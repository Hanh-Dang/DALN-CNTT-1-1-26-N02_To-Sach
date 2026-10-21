import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/events/[id]
 * Cập nhật thông tin hoặc Bật/Tắt sự kiện (Chỉ SUPER_ADMIN)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền chỉnh sửa sự kiện.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.promotionEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sự kiện khuyến mãi.' }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof body.name === 'string') updateData.name = body.name.trim();
    if (typeof body.description !== 'undefined') updateData.description = body.description?.trim() || null;
    if (typeof body.bannerUrl !== 'undefined') updateData.bannerUrl = body.bannerUrl?.trim() || null;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;

    if (body.startsAt || body.endsAt) {
      const startsAt = body.startsAt ? new Date(body.startsAt) : existing.startsAt;
      const endsAt = body.endsAt ? new Date(body.endsAt) : existing.endsAt;
      if (startsAt >= endsAt) {
        return NextResponse.json(
          { error: 'Ngày bắt đầu phải diễn ra trước ngày kết thúc sự kiện.' },
          { status: 400 }
        );
      }
      updateData.startsAt = startsAt;
      updateData.endsAt = endsAt;
    }

    const updatedEvent = await prisma.promotionEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    console.error('Lỗi cập nhật sự kiện:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể cập nhật sự kiện.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/events/[id]
 * Xóa sự kiện khuyến mãi (Chỉ SUPER_ADMIN)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền xóa sự kiện.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.promotionEvent.findUnique({
      where: { id },
      include: {
        _count: { select: { vouchers: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sự kiện cần xóa.' }, { status: 404 });
    }

    if (existing._count.vouchers > 0) {
      return NextResponse.json(
        {
          error: `Sự kiện đang chứa ${existing._count.vouchers} mã Voucher. Bạn hãy tắt sự kiện hoặc chuyển các mã sang sự kiện khác trước khi xóa.`,
        },
        { status: 400 }
      );
    }

    await prisma.promotionEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Đã xóa sự kiện thành công.' });
  } catch (error: any) {
    console.error('Lỗi xóa sự kiện:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể xóa sự kiện.' },
      { status: 500 }
    );
  }
}
