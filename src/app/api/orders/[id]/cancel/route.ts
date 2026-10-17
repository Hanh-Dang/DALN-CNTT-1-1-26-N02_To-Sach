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

    // 5. Chạy Prisma Transaction có khóa lạc quan (Optimistic Atomic Lock)
    const result = await prisma.$transaction(async (tx) => {
      // 5.1. CHỈ cập nhật đơn sang CANCELLED NẾU trạng thái hiện tại vẫn đang là PENDING
      const updateResult = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.CANCELLED,
          timeline: updatedTimeline,
        },
      });

      // Nếu count === 0 nghĩa là đơn hàng đã bị hủy bởi một request song song khác -> Rollback ngay lập tức!
      if (updateResult.count === 0) {
        throw new Error('Đơn hàng không ở trạng thái chờ xác nhận hoặc đã được xử lý trước đó.');
      }

      // 5.2. Chỉ khi cập nhật trạng thái thành công (duy nhất 1 request chiến thắng) mới hoàn trả tồn kho
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stockQty: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
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
    const errorMessage = error?.message || '';
    const isBusinessError = errorMessage.includes('Đơn hàng không ở trạng thái');
    return NextResponse.json(
      { error: isBusinessError ? errorMessage : 'Có lỗi xảy ra khi xử lý hủy đơn hàng: ' + errorMessage },
      { status: isBusinessError ? 400 : 500 }
    );
  }
}
