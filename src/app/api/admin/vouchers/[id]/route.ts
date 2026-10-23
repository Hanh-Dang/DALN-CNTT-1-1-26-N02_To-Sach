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
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const hasManagePerm = user?.permissions?.includes('MANAGE_PROMOTIONS') ?? false;

    if (!user || (!isSuperAdmin && !hasManagePerm)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật Voucher (cần quyền MANAGE_PROMOTIONS hoặc Quản trị viên).' },
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

    // N10: Validate chặt chẽ dữ liệu số nguyên dương
    if (typeof body.usageLimit !== 'undefined') {
      const numUsage = Number(body.usageLimit);
      if (!Number.isInteger(numUsage) || numUsage <= 0 || numUsage > 10000000) {
        return NextResponse.json(
          { error: 'Tổng lượt sử dụng phải là số nguyên dương từ 1 đến 10.000.000.' },
          { status: 400 }
        );
      }
      updateData.usageLimit = numUsage;
    }

    if (typeof body.perUserLimit !== 'undefined') {
      const numPerUser = Number(body.perUserLimit);
      if (!Number.isInteger(numPerUser) || numPerUser <= 0) {
        return NextResponse.json(
          { error: 'Lượt dùng mỗi khách phải là số nguyên dương lớn hơn 0.' },
          { status: 400 }
        );
      }
      const targetUsageLimit = updateData.usageLimit ?? existing.usageLimit;
      if (numPerUser > targetUsageLimit) {
        return NextResponse.json(
          { error: `Lượt dùng mỗi khách (${numPerUser}) không được vượt quá Tổng lượt (${targetUsageLimit}).` },
          { status: 400 }
        );
      }
      updateData.perUserLimit = numPerUser;
    }

    if (typeof body.minOrderValue !== 'undefined') {
      const numMinOrder = Number(body.minOrderValue);
      if (!Number.isFinite(numMinOrder) || numMinOrder < 0) {
        return NextResponse.json(
          { error: 'Đơn hàng tối thiểu phải là số tiền không âm (>= 0).' },
          { status: 400 }
        );
      }
      updateData.minOrderValue = Math.floor(numMinOrder);
    }

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
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const hasManagePerm = user?.permissions?.includes('MANAGE_PROMOTIONS') ?? false;

    if (!user || (!isSuperAdmin && !hasManagePerm)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa Voucher (cần quyền MANAGE_PROMOTIONS hoặc Quản trị viên).' },
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
