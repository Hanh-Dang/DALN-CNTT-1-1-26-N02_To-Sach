import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { validateVoucher } from '@/lib/voucher';
import { normalizePhone } from '@/lib/utils';

import crypto from 'crypto';

/**
 * Sinh mã đơn hàng chuẩn TMĐT chuyên nghiệp: TS-YYYYMMDD-XXXXXX (CSPRNG 6 ký tự hex - L6)
 * Ví dụ: TS-20261018-9B2F8A
 */
function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
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
      voucherCode,
    } = body;

    // 1. Validation dữ liệu đầu vào (M4)
    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp họ và tên người nhận hợp lệ.' }, { status: 400 });
    }

    if (!customerPhone || typeof customerPhone !== 'string' || !customerPhone.trim()) {
      return NextResponse.json({ error: 'Vui lòng cung cấp số điện thoại nhận hàng.' }, { status: 400 });
    }

    // Chuẩn hóa và validate số điện thoại (chấp nhận +84, 84 hoặc 0...) (L-d, R10, T8)
    const phoneClean = normalizePhone(customerPhone);
    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      return NextResponse.json({ error: 'Số điện thoại không hợp lệ (chuẩn 10 chữ số di động Việt Nam hoặc +84).' }, { status: 400 });
    }

    // R9: Kiểm tra kiểu dữ liệu cho customerEmail và note
    let cleanCustomerEmail = user.email;
    if (customerEmail !== undefined && customerEmail !== null) {
      if (typeof customerEmail !== 'string') {
        return NextResponse.json({ error: 'Định dạng email người nhận không hợp lệ.' }, { status: 400 });
      }
      const trimmedEmail = customerEmail.trim();
      if (trimmedEmail) {
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_REGEX.test(trimmedEmail)) {
          return NextResponse.json({ error: 'Email người nhận không đúng định dạng.' }, { status: 400 });
        }
        cleanCustomerEmail = trimmedEmail.toLowerCase();
      }
    }

    let cleanNote: string | null = null;
    if (note !== undefined && note !== null) {
      if (typeof note !== 'string') {
        return NextResponse.json({ error: 'Ghi chú đơn hàng phải là dạng chuỗi văn bản.' }, { status: 400 });
      }
      cleanNote = note.trim() || null;
    }

    if (!shippingAddress || typeof shippingAddress !== 'string' || !shippingAddress.trim() || shippingAddress.trim().length < 5) {
      return NextResponse.json({ error: 'Vui lòng cung cấp địa chỉ nhận hàng chi tiết hợp lệ (tối thiểu 5 ký tự).' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Đơn hàng không có sản phẩm nào để thanh toán.' }, { status: 400 });
    }

    // Validate chi tiết từng item trong đơn hàng (L-d)
    for (const item of items) {
      if (!item || !item.bookId || typeof item.bookId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Dữ liệu sản phẩm trong đơn hàng không hợp lệ (mã sách hoặc số lượng phải là số nguyên dương).' },
          { status: 400 }
        );
      }
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

        const rawQty = Number(item.quantity);
        if (!Number.isFinite(rawQty) || !Number.isInteger(rawQty) || rawQty < 1 || rawQty > 99) {
          throw new Error(`Số lượng mua cuốn "${book.title}" không hợp lệ (phải là số nguyên từ 1 đến 99).`);
        }
        const qty = rawQty;

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

      // C. Kiểm tra tổng tiền sách và tính phí vận chuyển (Chính sách Freeship >= 150.000đ, ngược lại 25.000đ)
      if (calculatedSubtotal <= 0) {
        throw new Error('Giá trị đơn hàng không hợp lệ (tổng tiền sách phải lớn hơn 0).');
      }

      // D. Thẩm định và Áp dụng Voucher (nếu có - Quy tắc 6 & 7)
      let appliedVoucherId: string | null = null;
      let calculatedDiscountAmount = 0;

      if (voucherCode && typeof voucherCode === 'string' && voucherCode.trim()) {
        const vValidation = await validateVoucher(voucherCode, user.id, calculatedSubtotal, tx);
        if (!vValidation.isValid || !vValidation.voucher) {
          throw new Error(vValidation.error || 'Mã giảm giá không hợp lệ.');
        }

        appliedVoucherId = vValidation.voucher.id;
        calculatedDiscountAmount = vValidation.discountAmount || 0;

        // N1: Khóa dòng Voucher (Row-Level Lock) tuần tự hóa các giao dịch song song của cùng mã
        try {
          await tx.$queryRaw`SELECT id FROM vouchers WHERE id = ${vValidation.voucher.id} FOR UPDATE`;
        } catch {
          // Dự phòng nếu DB engine không yêu cầu FOR UPDATE
        }

        // N1: Kiểm tra lại perUserLimit ngay trong Transaction sau khi đã giữ khóa dòng
        const currentUsedByUser = await tx.voucherUsage.count({
          where: {
            voucherId: vValidation.voucher.id,
            userId: user.id,
          },
        });

        if (currentUsedByUser >= vValidation.voucher.perUserLimit) {
          throw new Error(`Bạn đã sử dụng hết số lần cho phép (${vValidation.voucher.perUserLimit} lần) của mã "${voucherCode}".`);
        }

        // Chống Race Condition: Trừ lượt dùng nguyên tử bằng điều kiện atomic update
        const voucherUpdate = await tx.voucher.updateMany({
          where: {
            id: vValidation.voucher.id,
            isActive: true,
            usedCount: { lt: vValidation.voucher.usageLimit },
          },
          data: {
            usedCount: { increment: 1 },
          },
        });

        if (voucherUpdate.count === 0) {
          throw new Error(`Mã giảm giá "${voucherCode}" vừa hết lượt sử dụng bởi người mua khác. Vui lòng thử lại!`);
        }
      }

      const calculatedShippingFee = calculatedSubtotal >= 150000 ? 0 : 25000;
      const calculatedTotalAmount = Math.max(0, calculatedSubtotal - calculatedDiscountAmount) + calculatedShippingFee;

      // E. Sinh mã đơn hàng TS-YYYYMMDD-XXXX không trùng lặp
      let orderCode = generateOrderCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({ where: { orderCode } });
        if (!existing) break;
        orderCode = generateOrderCode();
        attempts++;
      }

      // F. Khởi tạo mốc lịch sử Timeline đầu tiên của đơn hàng
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

      // G. Tạo bản ghi Đơn hàng (Order) và Chi tiết mặt hàng (OrderItem)
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          userId: user.id,
          customerName: customerName.trim(),
          customerPhone: phoneClean,
          customerEmail: cleanCustomerEmail,
          shippingAddress: shippingAddress.trim(),
          subtotal: calculatedSubtotal,
          shippingFee: calculatedShippingFee,
          totalAmount: calculatedTotalAmount,
          voucherId: appliedVoucherId,
          discountAmount: calculatedDiscountAmount,
          paymentMethod: validPaymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          note: cleanNote,
          timeline: initialTimeline,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // H. Ghi nhận lịch sử sử dụng Voucher (VoucherUsage)
      if (appliedVoucherId) {
        await tx.voucherUsage.create({
          data: {
            voucherId: appliedVoucherId,
            userId: user.id,
            orderId: newOrder.id,
          },
        });
      }

      // G. Trừ tồn kho nguyên tử theo thứ tự bookId cố định để chống deadlock (R12)
      const sortedItemsToDeduct = [...items].sort((a: any, b: any) =>
        String(a.bookId).localeCompare(String(b.bookId))
      );
      for (const item of sortedItemsToDeduct) {
        const qty = Number(item.quantity) || 1;
        const updateResult = await tx.book.updateMany({
          where: {
            id: item.bookId,
            stockQty: { gte: qty },
          },
          data: {
            stockQty: { decrement: qty },
            soldCount: { increment: qty },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(
            `Cuốn sách "${item.bookTitle || 'sản phẩm'}" vừa hết hàng hoặc không đủ tồn kho để đáp ứng số lượng bạn mua.`
          );
        }
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
