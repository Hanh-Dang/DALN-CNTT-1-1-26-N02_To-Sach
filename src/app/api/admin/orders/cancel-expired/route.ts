import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { cancelExpiredBankTransferOrders } from '@/lib/orderExpiration';

/**
 * POST /api/admin/orders/cancel-expired
 * API quét và tự động hủy các đơn hàng chuyển khoản VietQR quá hạn 24 giờ (Lỗi M10)
 * Quyền: SUPER_ADMIN hoặc STAFF có quyền MANAGE_ORDERS, hoặc CRON_SECRET hợp lệ
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCronAuthorized) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
      }

      const canManageOrders = user.role === 'SUPER_ADMIN' || (user.role === 'STAFF' && user.permissions?.includes('MANAGE_ORDERS'));
      if (!canManageOrders) {
        return NextResponse.json({ error: 'Bạn không có quyền MANAGE_ORDERS để thực hiện thao tác này' }, { status: 403 });
      }
    }

    const operatorName = isCronAuthorized ? 'Hệ thống tự động (Cronjob)' : 'Quản trị viên';
    const result = await cancelExpiredBankTransferOrders(operatorName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lỗi khi hủy đơn quá hạn 24h:', error);
    return NextResponse.json(
      { error: 'Không thể xử lý quét hủy đơn quá hạn', details: (error as Error).message },
      { status: 500 }
    );
  }
}
