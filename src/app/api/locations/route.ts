import { NextResponse } from 'next/server';

/**
 * API Phục vụ sổ địa chỉ hành chính Việt Nam (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã)
 * Nguồn dữ liệu: Tổng cục Thống kê (GSO) qua provinces.open-api.vn
 * Có cơ chế ISR cache 24h để phản hồi siêu tốc (dưới 5ms)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'provinces';
  const provinceCode = searchParams.get('provinceCode');
  const districtCode = searchParams.get('districtCode');

  try {
    // 1. Lấy danh sách 63 Tỉnh / Thành phố
    if (type === 'provinces') {
      const res = await fetch('https://provinces.open-api.vn/api/p/', {
        next: { revalidate: 86400 },
      });
      if (!res.ok) throw new Error('Failed to fetch provinces');
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. Lấy danh sách Quận / Huyện theo mã Tỉnh
    if (type === 'districts' && provinceCode) {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) throw new Error('Failed to fetch districts');
      const data = await res.json();
      return NextResponse.json(data.districts || []);
    }

    // 3. Lấy danh sách Phường / Xã theo mã Huyện
    if (type === 'wards' && districtCode) {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) throw new Error('Failed to fetch wards');
      const data = await res.json();
      return NextResponse.json(data.wards || []);
    }

    return NextResponse.json({ error: 'Tham số không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu địa lý' }, { status: 500 });
  }
}
