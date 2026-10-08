import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardMetrics } from '@/lib/dashboardMetrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: metrics,
    });
  } catch (error) {
    console.error('Lỗi API Realtime Dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể truy vấn dữ liệu realtime' },
      { status: 500 }
    );
  }
}

// Endpoint kích hoạt Giả lập Đơn hàng mới (Dành cho Demo / Bảo vệ đồ án trực tiếp)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'simulate_order';

    if (action === 'simulate_order') {
      // 1. Tìm ngẫu nhiên một cuốn sách có sẵn trong DB
      const randomBook = await prisma.book.findFirst({
        where: { isActive: true, stockQty: { gt: 0 } },
      });

      if (!randomBook) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy sách trong kho' }, { status: 400 });
      }

      const randomNames = [
        'Lê Quỳnh Như',
        'Nguyễn Văn An',
        'Phạm Hoàng Bách',
        'Trần Minh Khang',
        'Đỗ Thảo Vy',
        'Vũ Gia Huy',
      ];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
      const orderCode = `TS-${Math.floor(10000 + Math.random() * 90000)}`;
      const qty = Math.floor(Math.random() * 2) + 1;
      const subtotal = randomBook.price * qty;
      const shippingFee = 30000;
      const totalAmount = subtotal + shippingFee;

      // 2. Tạo đơn hàng thực tế vào cơ sở dữ liệu PostgreSQL
      const createdOrder = await prisma.order.create({
        data: {
          orderCode,
          customerName: randomName,
          customerPhone: randomPhone,
          customerEmail: `${orderCode.toLowerCase()}@gmail.com`,
          shippingAddress: 'Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh',
          subtotal,
          shippingFee,
          totalAmount,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          items: {
            create: [
              {
                bookId: randomBook.id,
                bookTitle: randomBook.title,
                coverUrl: randomBook.coverUrl,
                unitPrice: randomBook.price,
                quantity: qty,
                totalPrice: subtotal,
              },
            ],
          },
        },
        include: {
          items: {
            include: { book: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã tạo thành công đơn hàng giả lập vào DB thực tế',
        order: {
          id: createdOrder.id,
          orderCode: createdOrder.orderCode,
          customerName: createdOrder.customerName,
          totalAmount: createdOrder.totalAmount,
          firstBookTitle: randomBook.title,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Lỗi API POST Realtime Dashboard:', error);
    return NextResponse.json({ success: false, error: 'Lỗi xử lý đơn giả lập' }, { status: 500 });
  }
}
