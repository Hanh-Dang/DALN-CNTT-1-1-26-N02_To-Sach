import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateVoucher } from '@/lib/voucher';
import { getClientIp, checkRateLimit, hasRealIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vouchers/apply
 * API thẩm định và tính mức giảm giá của Voucher theo giá trị giỏ hàng
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const user = await getCurrentUser();

    // L-f: Giới hạn tần suất thử mã voucher, ưu tiên theo user đã đăng nhập
    const rateLimitKey = user ? `voucher-user:${user.id}` : `voucher-ip:${ip}`;
    const rateLimitQuota = user || hasRealIp(ip) ? 20 : 200;
    const rateCheck = await checkRateLimit(rateLimitKey, rateLimitQuota, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Bạn đang thử mã quá nhanh. Vui lòng đợi 1 phút trước khi thử lại.' },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { code, subtotal } = body;

    // Validate kiểu dữ liệu mã voucher (L-e, L-f)
    if (!code || typeof code !== 'string' || !code.trim() || code.trim().length > 30) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mã giảm giá hợp lệ dạng chuỗi ký tự.' },
        { status: 400 }
      );
    }

    const parsedSubtotal = Number(subtotal);
    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) {
      return NextResponse.json(
        { error: 'Giá trị tạm tính của đơn hàng không hợp lệ (phải là số không âm).' },
        { status: 400 }
      );
    }

    const result = await validateVoucher(code.trim(), user?.id, parsedSubtotal);

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error || 'Mã giảm giá không hợp lệ.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher: {
        id: result.voucher!.id,
        code: result.voucher!.code,
        name: result.voucher!.name,
        type: result.voucher!.type,
        value: result.voucher!.value,
        maxDiscount: result.voucher!.maxDiscount,
        minOrderValue: result.voucher!.minOrderValue,
      },
      discountAmount: result.discountAmount,
    });
  } catch (error: any) {
    console.error('Lỗi khi áp dụng voucher:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi kiểm tra mã giảm giá. Vui lòng thử lại!' },
      { status: 500 }
    );
  }
}
