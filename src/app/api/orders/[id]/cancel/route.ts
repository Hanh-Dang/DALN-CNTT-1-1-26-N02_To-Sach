import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

/**
 * POST /api/orders/[id]/cancel
 * Khách hàng tự hủy đơn hàng khi đang ở trạng thái PENDING (Chờ xác nhận)
 * Tự động hoàn trả tồn kho sách (Stock Rollback) qua Prisma Transaction
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác này.' },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Mã định danh đơn hàng không hợp lệ.' },
        { status: 400 }
      );
    }

    let body: { reason?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body không bắt buộc
    }
    const cancelReason = body.reason?.trim() || 'Khách hàng yêu cầu hủy đơn khi đang chờ xác nhận.';

    // 1. Tìm đơn hàng kèm danh sách sản phẩm để hoàn kho
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

    // 2. Kiểm tra thẩm quyền: Phải là chủ đơn hàng hoặc Super Admin
    if (order.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền hủy đơn hàng của người khác.' },
        { status: 403 }
      );
    }

    // 3. Kiểm tra điều kiện nghiệp vụ: Chỉ cho phép hủy khi đang PENDING
    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        {
          error:
            'Đơn hàng đã được xác nhận hoặc đang trên đường vận chuyển, không thể hủy trực tiếp. Vui lòng liên hệ bộ phận hỗ trợ Tổ Sách.',
        },
        { status: 400 }
      );
    }

    // 4. Chuẩn bị sự kiện lịch sử (Timeline)
    const existingTimeline = Array.isArray(order.timeline)
      ? (order.timeline as any[])
      : [];

    const newTimelineEvent = {
      status: 'CANCELLED',
      title: 'Khách hàng đã hủy đơn hàng',
      description: `Lý do: ${cancelReason}`,
      timestamp: new Date().toISOString(),
    };

    const updatedTimeline = [...existingTimeline, newTimelineEvent];

    // 5. Chạy Prisma Transaction: Hoàn kho sách và cập nhật trạng thái đơn
    const result = await prisma.$transaction(async (tx) => {
      // 5.1. Hoàn trả tồn kho cho từng đầu sách
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stockQty: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
      }

      // 5.2. Cập nhật trạng thái đơn sang CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          timeline: updatedTimeline,
        },
        include: {
          items: true,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Hủy đơn hàng thành công. Số lượng sách đã được hoàn trả về kho.',
      order: result,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý hủy đơn hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
