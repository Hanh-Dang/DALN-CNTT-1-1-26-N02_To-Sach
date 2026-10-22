import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getEffectiveVoucherDates } from '@/lib/voucher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vouchers/available
 * Lấy danh sách các mã voucher đang hoạt động, còn lượt dùng để khách hàng chọn nhanh
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const now = new Date();

    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        OR: [
          { eventId: null },
          { event: { isActive: true } },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            isActive: true,
            startsAt: true,
            endsAt: true,
          },
        },
        usages: user
          ? {
              where: { userId: user.id },
              select: { id: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // L-m: Lấy tập ứng viên đủ rộng để sau khi lọc vẫn đảm bảo đủ 10 voucher khả dụng
    });

    // Lọc các voucher còn hiệu lực thực tế
    const validVouchers = vouchers
      .filter((v: any) => {
        // Kiểm tra lượt dùng toàn hệ thống
        if (v.usedCount >= v.usageLimit) return false;

        // Kiểm tra thời hạn
        const { effectiveStartsAt, effectiveEndsAt } = getEffectiveVoucherDates(v);
        if (effectiveStartsAt && now < effectiveStartsAt) return false;
        if (effectiveEndsAt && now > effectiveEndsAt) return false;

        // Kiểm tra lượt dùng của cá nhân (nếu đã đăng nhập)
        if (user && v.usages && v.usages.length >= v.perUserLimit) return false;

        return true;
      })
      .slice(0, 10) // L-m: Giới hạn tối đa 10 voucher khả dụng tốt nhất sau khi đã lọc hợp lệ
      .map((v: any) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        description: v.description,
        type: v.type,
        value: v.value,
        maxDiscount: v.maxDiscount,
        minOrderValue: v.minOrderValue,
        eventName: v.event?.name || null,
        perUserLimit: v.perUserLimit,
        userUsedCount: user && v.usages ? v.usages.length : 0,
      }));

    return NextResponse.json({ vouchers: validVouchers });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách voucher khả dụng:', error);
    return NextResponse.json({ vouchers: [] });
  }
}
