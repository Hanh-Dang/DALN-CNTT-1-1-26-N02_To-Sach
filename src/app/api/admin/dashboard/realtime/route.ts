import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics, maskPhonesForStaff } from '@/lib/dashboardMetrics';

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

    const rawMetrics = await getDashboardMetrics();
    const metrics = maskPhonesForStaff(rawMetrics, user);

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
