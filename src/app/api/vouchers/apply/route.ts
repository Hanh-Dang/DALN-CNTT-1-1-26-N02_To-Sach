import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateVoucher } from '@/lib/voucher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vouchers/apply
 * API thẩm định và tính mức giảm giá của Voucher theo giá trị giỏ hàng
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { code, subtotal } = body;

    const parsedSubtotal = Number(subtotal);
    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) {
      return NextResponse.json(
        { error: 'Giá trị tạm tính của đơn hàng không hợp lệ.' },
        { status: 400 }
      );
    }

    const result = await validateVoucher(code, user?.id, parsedSubtotal);

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
