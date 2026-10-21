import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, VoucherType } from '@prisma/client';
import { formatDateTimeVN } from '@/lib/utils';
import { getVoucherDisplayStatus } from '@/lib/voucher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/vouchers
 * Lấy danh sách Voucher cho trang quản trị (Chỉ SUPER_ADMIN)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền truy cập quản lý Voucher.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vouchers = await prisma.voucher.findMany({
      where,
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
        _count: {
          select: { usages: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = vouchers.map((v: any) => {
      const statusInfo = getVoucherDisplayStatus(v);
      return {
        ...v,
        computedStatus: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColorClass: statusInfo.colorClass,
      };
    });

    return NextResponse.json({ vouchers: enriched });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách voucher admin:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách Voucher.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vouchers
 * Tạo mới Voucher (Chỉ SUPER_ADMIN)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền tạo Voucher.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code: rawCode,
      name,
      description,
      type,
      value,
      maxDiscount,
      minOrderValue = 0,
      eventId,
      startsAt: rawStartsAt,
      endsAt: rawEndsAt,
      isUnlimitedTime = false,
      usageLimit = 100,
      perUserLimit = 1,
      isActive = true,
    } = body;

    // 1. Validate Code (Chữ in hoa và số, 4-20 ký tự)
    const code = (rawCode || '').trim().toUpperCase();
    if (!code || !/^[A-Z0-9]{4,20}$/.test(code)) {
      return NextResponse.json(
        {
          error:
            'Mã voucher phải từ 4 đến 20 ký tự, chỉ gồm chữ in hoa và chữ số (A-Z, 0-9), không chứa dấu hoặc ký tự đặc biệt.',
        },
        { status: 400 }
      );
    }

    const existingCode = await prisma.voucher.findUnique({ where: { code } });
    if (existingCode) {
      return NextResponse.json(
        { error: `Mã Voucher "${code}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác!` },
        { status: 400 }
      );
    }

    // 2. Validate Type & Value
    if (type !== VoucherType.PERCENT && type !== VoucherType.FIXED) {
      return NextResponse.json(
        { error: 'Loại giảm giá không hợp lệ (phải là PERCENT hoặc FIXED).' },
        { status: 400 }
      );
    }

    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      return NextResponse.json(
        { error: 'Mức giảm giá phải là số dương lớn hơn 0.' },
        { status: 400 }
      );
    }

    if (type === VoucherType.PERCENT) {
      if (numValue < 1 || numValue > 100) {
        return NextResponse.json(
          { error: 'Mức giảm theo phần trăm (%) phải từ 1% đến 100%.' },
          { status: 400 }
        );
      }
      if (maxDiscount !== null && maxDiscount !== undefined && maxDiscount !== '') {
        const numMax = Number(maxDiscount);
        if (!Number.isFinite(numMax) || numMax <= 0) {
          return NextResponse.json(
            { error: 'Mức giảm tối đa (VNĐ) phải là số tiền lớn hơn 0.' },
            { status: 400 }
          );
        }
      }
    }

    // 3. Validate Giới hạn lượt sử dụng
    const numUsageLimit = Number(usageLimit);
    const numPerUserLimit = Number(perUserLimit);

    if (!Number.isFinite(numUsageLimit) || numUsageLimit <= 0) {
      return NextResponse.json(
        { error: 'Tổng lượt sử dụng phải là số nguyên lớn hơn 0.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(numPerUserLimit) || numPerUserLimit <= 0) {
      return NextResponse.json(
        { error: 'Lượt dùng tối đa mỗi khách phải là số nguyên lớn hơn 0.' },
        { status: 400 }
      );
    }

    if (numPerUserLimit > numUsageLimit) {
      return NextResponse.json(
        {
          error: `Lượt dùng tối đa mỗi khách (${numPerUserLimit}) không được vượt quá Tổng lượt sử dụng (${numUsageLimit}).`,
        },
        { status: 400 }
      );
    }

    // 4. Validate Event & Quy tắc ngày hiệu lực
    let finalStartsAt: Date | null = null;
    let finalEndsAt: Date | null = null;

    if (eventId) {
      const event = await prisma.promotionEvent.findUnique({ where: { id: eventId } });
      if (!event) {
        return NextResponse.json({ error: 'Sự kiện khuyến mãi không tồn tại.' }, { status: 400 });
      }

      if (rawStartsAt && rawEndsAt) {
        const vStart = new Date(rawStartsAt);
        const vEnd = new Date(rawEndsAt);

        if (isNaN(vStart.getTime()) || isNaN(vEnd.getTime())) {
          return NextResponse.json({ error: 'Định dạng ngày voucher không hợp lệ.' }, { status: 400 });
        }

        if (vStart >= vEnd) {
          return NextResponse.json({ error: 'Ngày kết thúc phải sau ngày bắt đầu.' }, { status: 400 });
        }

        if (vStart < event.startsAt || vEnd > event.endsAt) {
          return NextResponse.json(
            {
              error: `Khoảng thời gian của Voucher (${formatDateTimeVN(vStart)} - ${formatDateTimeVN(
                vEnd
              )}) phải nằm TRONG khoảng thời gian của Sự kiện "${event.name}" (${formatDateTimeVN(
                event.startsAt
              )} - ${formatDateTimeVN(event.endsAt)}).`,
            },
            { status: 400 }
          );
        }

        finalStartsAt = vStart;
        finalEndsAt = vEnd;
      } else {
        // Voucher kế thừa thời gian sự kiện
        finalStartsAt = null;
        finalEndsAt = null;
      }
    } else {
      // Voucher độc lập không gắn sự kiện
      if (isUnlimitedTime) {
        finalStartsAt = null;
        finalEndsAt = null;
      } else {
        if (!rawStartsAt || !rawEndsAt) {
          return NextResponse.json(
            {
              error:
                'Voucher không gắn sự kiện bắt buộc phải nhập Ngày hiệu lực, hoặc chọn rõ "Không giới hạn thời gian".',
            },
            { status: 400 }
          );
        }

        const vStart = new Date(rawStartsAt);
        const vEnd = new Date(rawEndsAt);
        if (isNaN(vStart.getTime()) || isNaN(vEnd.getTime())) {
          return NextResponse.json({ error: 'Định dạng ngày voucher không hợp lệ.' }, { status: 400 });
        }

        if (vStart >= vEnd) {
          return NextResponse.json(
            { error: 'Ngày kết thúc phải sau ngày bắt đầu.' },
            { status: 400 }
          );
        }
        finalStartsAt = vStart;
        finalEndsAt = vEnd;
      }
    }

    const created = await prisma.voucher.create({
      data: {
        code,
        name: (name || code).trim(),
        description: description?.trim() || null,
        type,
        value: numValue,
        maxDiscount:
          type === VoucherType.PERCENT && maxDiscount ? Number(maxDiscount) : null,
        minOrderValue: Number(minOrderValue) || 0,
        eventId: eventId || null,
        startsAt: finalStartsAt,
        endsAt: finalEndsAt,
        usageLimit: numUsageLimit,
        perUserLimit: numPerUserLimit,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, voucher: created }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi tạo voucher:', error);
    // Bắt lỗi trùng unique key của Prisma (mã P2002) thân thiện
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Mã Voucher đã tồn tại trên hệ thống. Vui lòng chọn mã khác!' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Không thể tạo mã Voucher.' },
      { status: 500 }
    );
  }
}

