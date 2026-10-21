import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/vouchers/[id]
 * Cập nhật thông tin hoặc Bật/Tắt Voucher (Chỉ SUPER_ADMIN)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền cập nhật Voucher.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.voucher.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy Voucher.' }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof body.name === 'string') updateData.name = body.name.trim();
    if (typeof body.description !== 'undefined') updateData.description = body.description?.trim() || null;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (typeof body.usageLimit === 'number') updateData.usageLimit = body.usageLimit;
    if (typeof body.perUserLimit === 'number') updateData.perUserLimit = body.perUserLimit;
    if (typeof body.minOrderValue === 'number') updateData.minOrderValue = body.minOrderValue;

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, voucher: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật voucher:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể cập nhật Voucher.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vouchers/[id]
 * Xóa Voucher (Chỉ SUPER_ADMIN)
 * QUY TẮC NGHIỆP VỤ 7: Voucher đã phát sinh lượt dùng thì CHỈ TẮT, KHÔNG ĐƯỢC XÓA CỨNG!
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền xóa Voucher.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.voucher.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true, orders: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy Voucher cần xóa.' }, { status: 404 });
    }

    // CHẶN XÓA CỨNG NẾU ĐÃ DÙNG
    if (existing._count.usages > 0 || existing._count.orders > 0 || existing.usedCount > 0) {
      const totalUsed = Math.max(existing._count.usages, existing.usedCount);
      return NextResponse.json(
        {
          error: `Mã Voucher "${existing.code}" đã phát sinh ${totalUsed} lượt sử dụng trong các đơn hàng. Theo quy định kiểm toán, bạn chỉ có thể Tắt (vô hiệu hóa) mã này chứ không được xóa vĩnh viễn khỏi cơ sở dữ liệu.`,
        },
        { status: 400 }
      );
    }

    await prisma.voucher.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Đã xóa mã voucher "${existing.code}" thành công.` });
  } catch (error: any) {
    console.error('Lỗi xóa voucher:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể xóa Voucher.' },
      { status: 500 }
    );
  }
}
