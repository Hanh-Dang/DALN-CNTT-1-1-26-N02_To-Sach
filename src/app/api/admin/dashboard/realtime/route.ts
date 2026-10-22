import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/dashboardMetrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const metrics = await getDashboardMetrics();

    // N18: Ẩn số điện thoại khách hàng (masking PII) đối với nhân viên không phải SUPER_ADMIN hoặc không có quyền MANAGE_CUSTOMERS
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const canViewCustomerDetails = isSuperAdmin || user.permissions?.includes('MANAGE_CUSTOMERS');
    if (!canViewCustomerDetails && metrics.recentOrders) {
      metrics.recentOrders = metrics.recentOrders.map((o) => ({
        ...o,
        customerPhone: o.customerPhone
          ? o.customerPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
          : '***',
      }));
    }

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
