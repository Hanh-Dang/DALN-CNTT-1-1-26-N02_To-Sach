import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * GET /api/admin/events
 * Danh sách sự kiện khuyến mãi kèm số lượng voucher
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền truy cập quản lý sự kiện khuyến mãi.' },
        { status: 403 }
      );
    }

    const events = await prisma.promotionEvent.findMany({
      include: {
        _count: {
          select: { vouchers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách sự kiện:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách sự kiện khuyến mãi.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/events
 * Tạo sự kiện khuyến mãi mới (Chỉ SUPER_ADMIN)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền tạo sự kiện khuyến mãi.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, slug: rawSlug, description, bannerUrl, startsAt, endsAt, isActive = true } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Tên sự kiện không được để trống.' }, { status: 400 });
    }

    if (!startsAt || !endsAt) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc sự kiện.' },
        { status: 400 }
      );
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Định dạng ngày tháng không hợp lệ.' }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc.' },
        { status: 400 }
      );
    }

    let finalSlug = (rawSlug || '').trim() ? slugify(rawSlug) : slugify(name);
    if (!finalSlug) finalSlug = `su-kien-${Date.now()}`;

    // Kiểm tra trùng slug
    const existing = await prisma.promotionEvent.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newEvent = await prisma.promotionEvent.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        bannerUrl: bannerUrl?.trim() || null,
        startsAt: startDate,
        endsAt: endDate,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi tạo sự kiện khuyến mãi:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo sự kiện khuyến mãi.' },
      { status: 500 }
    );
  }
}
