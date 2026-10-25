import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { maskCustomerPhone } from '@/lib/dashboardMetrics';

/**
 * GET /api/admin/orders
 * API tìm kiếm, lọc và phân trang đơn hàng trực tiếp từ CSDL PostgreSQL (Lỗi M14)
 * Hỗ trợ tìm kiếm theo: Mã đơn (#TS...), tên khách, số điện thoại, email
 * Hỗ trợ lọc theo: Trạng thái đơn (OrderStatus), Phương thức thanh toán (PaymentMethod)
 * Phân trang server-side linh hoạt với page & limit
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasOrderPerm = user.permissions?.includes('MANAGE_ORDERS') ?? false;
    if (!isSuperAdmin && !hasOrderPerm) {
      return NextResponse.json({ error: 'Không có quyền quản lý đơn hàng' }, { status: 403 });
    }

    const canViewRevenue = isSuperAdmin || (user.permissions?.includes('VIEW_REVENUE') ?? false);
    const canManageUsers = isSuperAdmin || (user.permissions?.includes('MANAGE_USERS') ?? false);

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const statusParam = (searchParams.get('status') || 'ALL').trim().toUpperCase();
    const paymentParam = (searchParams.get('paymentMethod') || 'ALL').trim().toUpperCase();

    // L-h: Validate tham số phân trang page và limit tránh crash 500 do NaN
    const rawPageParam = searchParams.get('page');
    const rawLimitParam = searchParams.get('limit');

    if (rawPageParam && (isNaN(Number(rawPageParam)) || Number(rawPageParam) < 1)) {
      return NextResponse.json({ error: 'Tham số trang (page) phải là số nguyên dương hợp lệ.' }, { status: 400 });
    }

    if (rawLimitParam && (isNaN(Number(rawLimitParam)) || Number(rawLimitParam) < 1)) {
      return NextResponse.json({ error: 'Tham số giới hạn (limit) phải là số nguyên dương hợp lệ.' }, { status: 400 });
    }

    const page = Math.max(1, parseInt(rawPageParam || '1', 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(rawLimitParam || '10', 10) || 10));
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc (where clause)
    const where: Prisma.OrderWhereInput = {};

    // 1. Lọc theo trạng thái
    if (statusParam !== 'ALL' && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      where.status = statusParam as OrderStatus;
    }

    // 2. Lọc theo phương thức thanh toán
    if (paymentParam !== 'ALL' && Object.values(PaymentMethod).includes(paymentParam as PaymentMethod)) {
      where.paymentMethod = paymentParam as PaymentMethod;
    }

    // 3. Tìm kiếm toàn văn
    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Thực hiện truy vấn song song tối ưu: lấy danh sách đơn, đếm tổng theo bộ lọc và đếm số lượng từng tab
    const [
      orders,
      totalFilteredCount,
      allCount,
      pendingCount,
      confirmedCount,
      shippingCount,
      deliveredCount,
      cancelledCount,
    ] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  coverUrl: true,
                  publisher: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPING } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    // Chuẩn hóa bộ đếm trạng thái cho các tab
    const counts: Record<string, number> = {
      ALL: allCount,
      PENDING: pendingCount,
      CONFIRMED: confirmedCount,
      SHIPPING: shippingCount,
      DELIVERED: deliveredCount,
      CANCELLED: cancelledCount,
    };

    // Định dạng response có kiểm soát quyền hạn (4.3, T1)
    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customerName,
      customerPhone: canManageUsers ? o.customerPhone : maskCustomerPhone(o.customerPhone),
      customerEmail: o.customerEmail,
      shippingAddress: o.shippingAddress,
      subtotal: canViewRevenue ? o.subtotal : null,
      shippingFee: canViewRevenue ? o.shippingFee : null,
      totalAmount: canViewRevenue ? o.totalAmount : null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      trackingCode: o.trackingCode,
      note: o.note,
      timeline: (Array.isArray(o.timeline) ? o.timeline : []) as any,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item) => ({
        id: item.id,
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        coverUrl: item.coverUrl,
        quantity: item.quantity,
        unitPrice: canViewRevenue ? item.unitPrice : null,
        totalPrice: canViewRevenue ? item.totalPrice : null,
        book: item.book
          ? {
              id: item.book.id,
              title: item.book.title,
              coverUrl: item.book.coverUrl,
              publisher: item.book.publisher,
            }
          : null,
      })),
      user: o.user
        ? {
            id: o.user.id,
            email: o.user.email,
            fullName: o.user.fullName,
            phone: canManageUsers ? o.user.phone : maskCustomerPhone(o.user.phone),
          }
        : null,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount: totalFilteredCount,
        totalPages: Math.ceil(totalFilteredCount / limit) || 1,
      },
      counts,
    });
  } catch (error) {
    console.error('Lỗi khi truy vấn danh sách đơn hàng admin:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi truy vấn đơn hàng', details: (error as Error).message },
      { status: 500 }
    );
  }
}
