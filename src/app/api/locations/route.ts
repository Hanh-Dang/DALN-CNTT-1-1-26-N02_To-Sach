import { NextResponse } from 'next/server';
import {
  FALLBACK_PROVINCES,
  FALLBACK_DISTRICTS_MAP,
  FALLBACK_GENERIC_WARDS,
} from '@/lib/provincesFallback';

/**
 * API Phục vụ sổ địa chỉ hành chính Việt Nam (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã)
 * Nguồn dữ liệu: Tổng cục Thống kê (GSO) qua provinces.open-api.vn
 * Bổ sung cơ chế Fallback tĩnh 63 tỉnh thành & Timeout 3.5s chống nghẽn checkout (Lỗi M15)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'provinces';
  const provinceCode = searchParams.get('provinceCode');
  const districtCode = searchParams.get('districtCode');

  // Hàm fetch an toàn với timeout 3.5s
  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    // 1. Lấy danh sách 63 Tỉnh / Thành phố
    if (type === 'provinces') {
      try {
        const data = await fetchWithTimeout('https://provinces.open-api.vn/api/p/');
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('API provinces open-api gặp sự cố, kích hoạt Fallback 63 tỉnh GSO:', e);
      }
      // Fallback an toàn (Lỗi M15)
      return NextResponse.json(FALLBACK_PROVINCES, {
        headers: { 'x-data-source': 'fallback-gso' },
      });
    }

    // 2. Lấy danh sách Quận / Huyện theo mã Tỉnh
    if (type === 'districts' && provinceCode) {
      try {
        const data = await fetchWithTimeout(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        if (data && Array.isArray(data.districts) && data.districts.length > 0) {
          return NextResponse.json(data.districts);
        }
      } catch (e) {
        console.warn(`API districts cho tỉnh ${provinceCode} gặp sự cố, kích hoạt Fallback:`, e);
      }

      const pCodeNum = Number(provinceCode);
      const fallbackDistricts = FALLBACK_DISTRICTS_MAP[pCodeNum] || [
        { code: pCodeNum * 100 + 1, name: 'Quận / Huyện Trung Tâm' },
        { code: pCodeNum * 100 + 2, name: 'Quận / Thị Xã 1' },
        { code: pCodeNum * 100 + 3, name: 'Huyện Khu Vực 2' },
      ];
      return NextResponse.json(fallbackDistricts, {
        headers: { 'x-data-source': 'fallback-gso' },
      });
    }

    // 3. Lấy danh sách Phường / Xã theo mã Huyện
    if (type === 'wards' && districtCode) {
      try {
        const data = await fetchWithTimeout(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        if (data && Array.isArray(data.wards) && data.wards.length > 0) {
          return NextResponse.json(data.wards);
        }
      } catch (e) {
        console.warn(`API wards cho huyện ${districtCode} gặp sự cố, kích hoạt Fallback:`, e);
      }

      return NextResponse.json(FALLBACK_GENERIC_WARDS, {
        headers: { 'x-data-source': 'fallback-gso' },
      });
    }

    return NextResponse.json({ error: 'Tham số không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Location API error:', error);
    // Khi có lỗi bất khả kháng, vẫn trả về danh sách tỉnh fallback thay vì 500
    return NextResponse.json(FALLBACK_PROVINCES, { status: 200 });
  }
}
