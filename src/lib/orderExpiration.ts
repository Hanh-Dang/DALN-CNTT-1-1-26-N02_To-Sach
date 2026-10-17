import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface ExpiredOrderCancelResult {
  success: boolean;
  cancelledCount: number;
  cancelledOrderCodes: string[];
  restockedBooksCount: number;
  message: string;
}

/**
 * Tự động quét và hủy các đơn hàng chuyển khoản (BANK_TRANSFER) quá hạn 24 giờ chưa thanh toán (Lỗi M10)
 * Hoàn trả lại tồn kho sách (stockQty) cho từng đầu sách và cập nhật timeline đơn hàng.
 */
export async function cancelExpiredBankTransferOrders(operatorName = 'Hệ thống tự động (Cron)'): Promise<ExpiredOrderCancelResult> {
  const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 giờ trước

  // 1. Tìm các đơn thỏa điều kiện quá hạn
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: { in: [PaymentStatus.PENDING] },
      createdAt: { lt: expiredThreshold },
    },
    include: {
      items: true,
    },
  });

  if (expiredOrders.length === 0) {
    return {
      success: true,
      cancelledCount: 0,
      cancelledOrderCodes: [],
      restockedBooksCount: 0,
      message: 'Không có đơn hàng chuyển khoản nào quá hạn 24 giờ cần hủy.',
    };
  }

  const cancelledOrderCodes: string[] = [];
  let totalRestockedBooks = 0;

  // 2. Xử lý từng đơn trong Transaction an toàn
  for (const order of expiredOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        // Khóa nguyên tử: cập nhật trạng thái nếu vẫn là PENDING
        const updateResult = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING,
          },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
          },
        });

        // Nếu đơn đã được xử lý bởi luồng khác thì bỏ qua
        if (updateResult.count === 0) return;

        // Hoàn trả tồn kho cho từng sản phẩm
        for (const item of order.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stockQty: { increment: item.quantity },
            },
          });
          totalRestockedBooks += item.quantity;
        }

        // Bổ sung sự kiện vào timeline
        const existingTimeline = Array.isArray(order.timeline) ? (order.timeline as any[]) : [];
        const newEvent = {
          status: 'CANCELLED',
          title: 'Tự động hủy đơn do quá hạn thanh toán 24h',
          description: `Đơn hàng chuyển khoản VietQR quá hạn 24 giờ chưa hoàn tất thanh toán. Hệ thống đã tự động hủy và hoàn trả tồn kho sách.`,
          operator: operatorName,
          timestamp: new Date().toISOString(),
          time: new Date().toISOString(),
          desc: 'Tự động hủy đơn do quá hạn thanh toán 24h',
        };

        await tx.order.update({
          where: { id: order.id },
          data: {
            timeline: [...existingTimeline, newEvent],
          },
        });
      });

      cancelledOrderCodes.push(order.orderCode);
    } catch (err) {
      console.error(`Lỗi khi tự động hủy đơn ${order.orderCode}:`, err);
    }
  }

  return {
    success: true,
    cancelledCount: cancelledOrderCodes.length,
    cancelledOrderCodes,
    restockedBooksCount: totalRestockedBooks,
    message: `Đã tự động hủy thành công ${cancelledOrderCodes.length} đơn quá hạn và hoàn lại ${totalRestockedBooks} cuốn sách về kho.`,
  };
}
