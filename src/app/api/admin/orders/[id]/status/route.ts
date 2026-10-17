import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * POST /api/admin/orders/[id]/status
 * Admin / Nhân viên được cấp quyền MANAGE_ORDERS cập nhật trạng thái đơn hàng:
 * PENDING -> CONFIRMED -> SHIPPING -> DELIVERED (hoặc CANCELLED)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác.' },
        { status: 401 }
      );
    }

    // Kiểm tra phân quyền RBAC: Phải là Super Admin hoặc có quyền MANAGE_ORDERS
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasOrderPerm = user.permissions?.includes('MANAGE_ORDERS');

    if (!isSuperAdmin && !hasOrderPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_ORDERS để thay đổi trạng thái đơn hàng.' },
        { status: 403 }
      );
    }

    const { id: orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Mã định danh đơn hàng không hợp lệ.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status: newStatus, note, trackingCode } = body;

    const validStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Trạng thái đơn hàng không hợp lệ.' },
        { status: 400 }
      );
    }

    // Tìm đơn hàng hiện tại
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng trong hệ thống.' },
        { status: 404 }
      );
    }

    const oldStatus = order.status;
    if (oldStatus === newStatus) {
      return NextResponse.json({
        success: true,
        message: 'Trạng thái đơn hàng không thay đổi.',
        order,
      });
    }

    // Ma trận chuyển trạng thái hợp lệ (Order State Machine)
    const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [], // Trạng thái kết thúc: Khóa cứng, không cho phép đổi ngược
      [OrderStatus.CANCELLED]: [OrderStatus.PENDING, OrderStatus.CONFIRMED], // Phục hồi đơn (yêu cầu kiểm tra tồn kho)
    };

    const allowedNextStatuses = ALLOWED_TRANSITIONS[oldStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Không được phép chuyển trạng thái đơn hàng từ "${oldStatus}" sang "${newStatus}". Luồng trạng thái chỉ đi một chiều và đơn đã giao thành công (DELIVERED) không thể hoàn tác.`,
        },
        { status: 400 }
      );
    }

    // Chuẩn bị thông tin Timeline ghi nhận nhật ký
    const existingTimeline = Array.isArray(order.timeline)
      ? (order.timeline as any[])
      : [];

    let title = '';
    let description = '';

    switch (newStatus) {
      case OrderStatus.CONFIRMED:
        title = 'Đơn hàng đã được xác nhận';
        description = `Nhân viên ${user.fullName} đã duyệt đơn. Bộ phận kho đang chuẩn bị sách.`;
        break;
      case OrderStatus.SHIPPING:
        title = 'Đang giao hàng';
        description = trackingCode
          ? `Đã bàn giao cho đơn vị vận chuyển. Mã vận đơn: ${trackingCode}.`
          : 'Đã xuất kho và bàn giao cho đơn vị vận chuyển.';
        break;
      case OrderStatus.DELIVERED:
        title = 'Giao hàng thành công';
        description = 'Khách hàng đã nhận được kiện sách nguyên vẹn từ nhân viên giao hàng.';
        break;
      case OrderStatus.CANCELLED:
        title = 'Đơn hàng đã bị hủy bởi quản trị viên';
        description = `Thao tác bởi: ${user.fullName}. Lý do: ${note || 'Hủy đơn theo quy trình vận hành'}.`;
        break;
      default:
        title = `Cập nhật trạng thái sang ${newStatus}`;
        description = note || '';
        break;
    }

    const newTimelineEvent = {
      status: newStatus,
      title,
      description,
      operator: user.fullName,
      timestamp: new Date().toISOString(),
    };

    const updatedTimeline = [...existingTimeline, newTimelineEvent];

    // Chạy Transaction cập nhật trạng thái đơn (và hoàn kho nếu bị hủy)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Nếu chuyển sang CANCELLED mà trước đó chưa hủy -> Hoàn kho
      if (newStatus === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stockQty: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          });
        }
      }

      // 2. Nếu chuyển từ CANCELLED sang trạng thái khác (phục hồi đơn) -> Kiểm tra tồn kho & Trừ lại kho
      if (oldStatus === OrderStatus.CANCELLED && newStatus !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const currentBook = await tx.book.findUnique({
            where: { id: item.bookId },
            select: { id: true, title: true, stockQty: true },
          });

          if (!currentBook || currentBook.stockQty < item.quantity) {
            throw new Error(
              `Không thể khôi phục đơn hàng: Cuốn sách "${item.bookTitle}" trong kho hiện chỉ còn ${currentBook?.stockQty ?? 0} cuốn (cần ${item.quantity} cuốn). Vui lòng nhập bổ sung kho sách trước.`
            );
          }

          // Trừ kho có điều kiện gte để đảm bảo atomic và không bao giờ bị âm
          const updateResult = await tx.book.updateMany({
            where: {
              id: item.bookId,
              stockQty: { gte: item.quantity },
            },
            data: {
              stockQty: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            throw new Error(
              `Không thể khôi phục đơn hàng: Xung đột số lượng tồn kho cuốn sách "${item.bookTitle}".`
            );
          }
        }
      }

      // Cập nhật đơn hàng
      const updateData: any = {
        status: newStatus,
        timeline: updatedTimeline,
      };

      if (trackingCode) {
        updateData.trackingCode = trackingCode;
      }

      // Nếu đơn DELIVERED và hình thức COD -> Tự động chuyển paymentStatus thành PAID
      if (newStatus === OrderStatus.DELIVERED && order.paymentMethod === 'COD') {
        updateData.paymentStatus = PaymentStatus.PAID;
      }

      return await tx.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          items: {
            include: {
              book: true,
            },
          },
          user: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng sang ${newStatus} thành công.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Admin update order status error:', error);
    const errorMessage = error?.message || '';
    const isBusinessError =
      errorMessage.includes('Không thể khôi phục đơn hàng') ||
      errorMessage.includes('Không được phép chuyển trạng thái');
    return NextResponse.json(
      { error: isBusinessError ? errorMessage : 'Lỗi khi cập nhật trạng thái đơn hàng: ' + errorMessage },
      { status: isBusinessError ? 400 : 500 }
    );
  }
}
