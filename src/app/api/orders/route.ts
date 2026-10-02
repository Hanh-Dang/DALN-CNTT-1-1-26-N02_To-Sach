import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

/**
 * Sinh mã đơn hàng chuẩn TMĐT chuyên nghiệp: TS-YYYYMMDD-XXXX
 * Ví dụ: TS-20261001-A79F
 */
function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TS-${dateStr}-${randomChars}`;
}

/**
 * POST /api/orders
 * Tạo đơn hàng mới với Prisma Database Transaction (ACID)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Khách bắt buộc phải đăng nhập theo luồng mua hàng B2C của Tổ Sách
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để tiến hành đặt hàng.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      province,
      district,
      ward,
      addressDetail,
      note,
      saveAsDefault,
      paymentMethod = 'COD',
      items,
    } = body;

    // 1. Validation dữ liệu đầu vào
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp họ và tên người nhận.' }, { status: 400 });
    }

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp số điện thoại nhận hàng.' }, { status: 400 });
    }

    const phoneClean = customerPhone.trim().replace(/\s/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneClean)) {
      return NextResponse.json({ error: 'Số điện thoại không hợp lệ (chuẩn 10 chữ số Việt Nam).' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp địa chỉ nhận hàng chi tiết.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Đơn hàng không có sản phẩm nào để thanh toán.' }, { status: 400 });
    }

    const validPaymentMethod =
      paymentMethod === 'BANK_TRANSFER' ? PaymentMethod.BANK_TRANSFER : PaymentMethod.COD;

    // 2. PRISMA TRANSACTION (Tính toàn vẹn ACID)
    const resultOrder = await prisma.$transaction(async (tx) => {
      // A. Lấy thông tin các cuốn sách thực tế từ Database
      const bookIds = items.map((i: any) => i.bookId);
      const dbBooks = await tx.book.findMany({
        where: {
          id: { in: bookIds },
          isActive: true,
        },
      });

      if (dbBooks.length !== bookIds.length) {
        throw new Error('Một số tựa sách trong đơn hàng không tồn tại hoặc đã ngừng kinh doanh.');
      }

      const bookMap = new Map(dbBooks.map((b) => [b.id, b]));

      // B. Kiểm tra tồn kho và tính toán lại giá tiền chuẩn xác từ Database
      let calculatedSubtotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const book = bookMap.get(item.bookId);
        if (!book) {
          throw new Error(`Không tìm thấy cuốn sách với mã ${item.bookId}`);
        }

        const qty = Number(item.quantity) || 1;
        if (qty <= 0) {
          throw new Error(`Số lượng mua cuốn "${book.title}" không hợp lệ.`);
        }

        // Chống Over-selling: kiểm tra tồn kho thời gian thực
        if (book.stockQty < qty) {
          throw new Error(
            `Cuốn sách "${book.title}" hiện chỉ còn ${book.stockQty} cuốn trong kho, không đủ số lượng ${qty} bạn yêu cầu.`
          );
        }

        const itemTotal = book.price * qty;
        calculatedSubtotal += itemTotal;

        orderItemsData.push({
          bookId: book.id,
          bookTitle: book.title,
          coverUrl: book.coverUrl,
          unitPrice: book.price,
          quantity: qty,
          totalPrice: itemTotal,
        });
      }

      // C. Tính phí vận chuyển (Chính sách Freeship >= 150.000đ, ngược lại 25.000đ)
      const calculatedShippingFee = calculatedSubtotal >= 150000 ? 0 : 25000;
      const calculatedTotalAmount = calculatedSubtotal + calculatedShippingFee;

      // D. Sinh mã đơn hàng TS-YYYYMMDD-XXXX không trùng lặp
      let orderCode = generateOrderCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({ where: { orderCode } });
        if (!existing) break;
        orderCode = generateOrderCode();
        attempts++;
      }

      // E. Khởi tạo mốc lịch sử Timeline đầu tiên của đơn hàng
      const initialTimeline = [
        {
          status: 'PENDING',
          title: 'Đặt hàng thành công',
          description:
            validPaymentMethod === PaymentMethod.BANK_TRANSFER
              ? 'Đơn hàng đã được tiếp nhận. Vui lòng quét mã VietQR để hoàn tất chuyển khoản.'
              : 'Đơn hàng đã được tiếp nhận thành công. Tổ Sách sẽ liên hệ xác nhận sớm nhất.',
          timestamp: new Date().toISOString(),
        },
      ];

      // F. Tạo bản ghi Đơn hàng (Order) và Chi tiết mặt hàng (OrderItem)
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          userId: user.id,
          customerName: customerName.trim(),
          customerPhone: phoneClean,
          customerEmail: customerEmail?.trim() || user.email,
          shippingAddress: shippingAddress.trim(),
          subtotal: calculatedSubtotal,
          shippingFee: calculatedShippingFee,
          totalAmount: calculatedTotalAmount,
          paymentMethod: validPaymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          note: note?.trim() || null,
          timeline: initialTimeline,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // G. Trừ tồn kho (stockQty) và tăng số lượng bán (soldCount) của từng cuốn sách
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stockQty: { decrement: qty },
            soldCount: { increment: qty },
          },
        });
      }

      // H. Cập nhật sổ địa chỉ mặc định trong UserProfile nếu khách yêu cầu
      if (saveAsDefault) {
        await tx.userProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            addressProvince: province || null,
            addressDistrict: district || null,
            addressWard: ward || null,
            addressDetail: addressDetail || null,
          },
          update: {
            addressProvince: province || null,
            addressDistrict: district || null,
            addressWard: ward || null,
            addressDetail: addressDetail || null,
          },
        });

        // Cập nhật SĐT vào User nếu không xung đột với tài khoản khác
        const existingPhoneUser = await tx.user.findFirst({
          where: { phone: phoneClean, id: { not: user.id } },
        });

        if (!existingPhoneUser) {
          await tx.user.update({
            where: { id: user.id },
            data: {
              phone: phoneClean,
              fullName: customerName.trim(),
            },
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Đặt hàng thành công!',
      orderCode: resultOrder.orderCode,
      orderId: resultOrder.id,
      totalAmount: resultOrder.totalAmount,
      paymentMethod: resultOrder.paymentMethod,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/orders
 * Lấy lịch sử đơn hàng của người dùng hiện tại hoặc tra cứu theo orderCode
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem đơn hàng.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    // Trường hợp 1: Tra cứu đơn hàng cụ thể theo mã orderCode
    if (code) {
      const order = await prisma.order.findUnique({
        where: { orderCode: code },
        include: {
          items: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: 'Không tìm thấy đơn hàng yêu cầu.' }, { status: 404 });
      }

      // Kiểm tra quyền: chỉ chủ đơn hàng hoặc Super Admin mới được xem
      if (order.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Bạn không có quyền truy cập đơn hàng này.' }, { status: 403 });
      }

      return NextResponse.json({ order });
    }

    // Trường hợp 2: Lấy toàn bộ danh sách đơn hàng của người dùng
    const statusParam = searchParams.get('status');
    const whereClause: any = { userId: user.id };

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam as OrderStatus;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải thông tin đơn hàng.' },
      { status: 500 }
    );
  }
}
