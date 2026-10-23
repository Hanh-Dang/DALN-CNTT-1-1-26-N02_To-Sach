import { prisma } from './prisma';
import { Voucher, VoucherType, Prisma } from '@prisma/client';
import { formatVND } from './utils';

export interface VoucherValidationResult {
  isValid: boolean;
  error?: string;
  voucher?: Voucher & {
    event?: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      startsAt: Date;
      endsAt: Date;
    } | null;
  };
  discountAmount?: number;
}

/**
 * Tính số tiền giảm giá thực tế từ Voucher
 * - Cắt trần (cap) không vượt quá subtotal của đơn hàng
 * - Áp dụng maxDiscount nếu là loại PERCENT
 */
export function calculateVoucherDiscount(
  voucher: Pick<Voucher, 'type' | 'value' | 'maxDiscount'>,
  subtotal: number
): number {
  if (!subtotal || subtotal <= 0) return 0;

  let discount = 0;
  if (voucher.type === VoucherType.PERCENT) {
    discount = Math.round((subtotal * voucher.value) / 100);
    if (voucher.maxDiscount && voucher.maxDiscount > 0) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  } else if (voucher.type === VoucherType.FIXED) {
    discount = voucher.value;
  }

  // Đảm bảo không giảm quá giá trị đơn hàng và không bao giờ âm
  discount = Math.min(discount, subtotal);
  return Math.max(0, discount);
}

/**
 * Lấy khoảng thời gian hiệu lực thực tế của Voucher (kế thừa từ Sự kiện nếu Voucher không đặt riêng)
 */
export function getEffectiveVoucherDates(voucher: {
  startsAt?: Date | null;
  endsAt?: Date | null;
  event?: { startsAt: Date; endsAt: Date } | null;
}): { effectiveStartsAt: Date | null; effectiveEndsAt: Date | null } {
  let effectiveStartsAt = voucher.startsAt ? new Date(voucher.startsAt) : voucher.event?.startsAt ? new Date(voucher.event.startsAt) : null;
  let effectiveEndsAt = voucher.endsAt ? new Date(voucher.endsAt) : voucher.event?.endsAt ? new Date(voucher.event.endsAt) : null;

  if (voucher.event) {
    const evStart = new Date(voucher.event.startsAt);
    const evEnd = new Date(voucher.event.endsAt);
    if (!effectiveStartsAt || evStart > effectiveStartsAt) {
      effectiveStartsAt = evStart;
    }
    if (!effectiveEndsAt || evEnd < effectiveEndsAt) {
      effectiveEndsAt = evEnd;
    }
  }

  return { effectiveStartsAt, effectiveEndsAt };
}

export type VoucherDisplayStatus =
  | 'DISABLED'     // Đã tắt
  | 'EVENT_DISABLED' // Sự kiện cha bị tắt
  | 'UPCOMING'     // Sắp diễn ra
  | 'ACTIVE'       // Đang chạy
  | 'EXPIRED'      // Đã kết thúc / hết hạn
  | 'OUT_OF_STOCK'; // Hết lượt dùng

/**
 * Tự động tính toán trạng thái hiển thị động của Voucher
 */
export function getVoucherDisplayStatus(voucher: {
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit: number;
  usedCount: number;
  event?: { isActive: boolean; startsAt: Date; endsAt: Date } | null;
}): { status: VoucherDisplayStatus; label: string; colorClass: string } {
  if (!voucher.isActive) {
    return {
      status: 'DISABLED',
      label: 'Đã tắt',
      colorClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  if (voucher.event && !voucher.event.isActive) {
    return {
      status: 'EVENT_DISABLED',
      label: 'Sự kiện đã tắt',
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (voucher.usedCount >= voucher.usageLimit) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Hết lượt',
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  }

  const { effectiveStartsAt, effectiveEndsAt } = getEffectiveVoucherDates(voucher);
  const now = new Date();

  if (effectiveStartsAt && now < effectiveStartsAt) {
    return {
      status: 'UPCOMING',
      label: 'Sắp diễn ra',
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }

  if (effectiveEndsAt && now > effectiveEndsAt) {
    return {
      status: 'EXPIRED',
      label: 'Đã kết thúc',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    status: 'ACTIVE',
    label: 'Đang chạy',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

/**
 * Hàm thẩm định Voucher dùng chung (Shared Validator)
 * Trả về lý do lỗi cụ thể theo đúng yêu cầu nghiệp vụ
 */
export async function validateVoucher(
  rawCode: string,
  userId: string | null | undefined,
  subtotal: number,
  clientOrTx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<VoucherValidationResult> {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return { isValid: false, error: 'Vui lòng nhập mã giảm giá.' };
  }

  // 1. Tìm voucher trong database kèm quan hệ Sự kiện
  const voucher = await clientOrTx.voucher.findUnique({
    where: { code },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });

  const INVALID_VOUCHER_MSG = 'Mã giảm giá không hợp lệ hoặc đã hết hiệu lực.';

  if (!voucher) {
    return { isValid: false, error: INVALID_VOUCHER_MSG };
  }

  // 2. Kiểm tra trạng thái kích hoạt của voucher
  if (!voucher.isActive) {
    return { isValid: false, error: INVALID_VOUCHER_MSG };
  }

  // 3. Kiểm tra trạng thái của sự kiện cha (nếu có gắn eventId)
  if (voucher.event && !voucher.event.isActive) {
    return {
      isValid: false,
      error: INVALID_VOUCHER_MSG,
    };
  }

  // 4. Kiểm tra thời hạn hiệu lực (kế thừa từ sự kiện nếu voucher không đặt ngày riêng)
  const { effectiveStartsAt, effectiveEndsAt } = getEffectiveVoucherDates(voucher);
  const now = new Date();

  if (effectiveStartsAt && now < effectiveStartsAt) {
    return {
      isValid: false,
      error: INVALID_VOUCHER_MSG,
    };
  }

  if (effectiveEndsAt && now > effectiveEndsAt) {
    return {
      isValid: false,
      error: INVALID_VOUCHER_MSG,
    };
  }

  // 5. Kiểm tra giá trị đơn hàng tối thiểu
  if (subtotal < voucher.minOrderValue) {
    return {
      isValid: false,
      error: `Đơn hàng tối thiểu để áp dụng mã "${code}" là ${formatVND(
        voucher.minOrderValue
      )} (tạm tính hiện tại: ${formatVND(subtotal)}).`,
    };
  }

  // 6. Kiểm tra giới hạn lượt dùng toàn sàn (usageLimit)
  if (voucher.usedCount >= voucher.usageLimit) {
    return {
      isValid: false,
      error: `Mã giảm giá "${code}" đã hết lượt sử dụng trên toàn hệ thống.`,
    };
  }

  // 7. Kiểm tra giới hạn lượt dùng theo từng khách hàng (perUserLimit)
  if (userId) {
    const userUsedCount = await clientOrTx.voucherUsage.count({
      where: {
        voucherId: voucher.id,
        userId: userId,
      },
    });

    if (userUsedCount >= voucher.perUserLimit) {
      return {
        isValid: false,
        error: `Bạn đã sử dụng hết số lần cho phép (${voucher.perUserLimit} lần) của mã "${code}".`,
      };
    }
  }

  // 8. Tất cả điều kiện hợp lệ -> Tính toán số tiền chiết khấu thực tế
  const discountAmount = calculateVoucherDiscount(voucher, subtotal);

  return {
    isValid: true,
    voucher,
    discountAmount,
  };
}
