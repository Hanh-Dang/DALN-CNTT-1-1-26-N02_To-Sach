import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền truy cập.' }, { status: 403 });
    }

    const [staffList, permissions] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          lastLoginAt: true,
          staffPerms: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.permission.findMany({
        orderBy: { code: 'asc' },
      }),
    ]);

    return NextResponse.json({
      staff: staffList,
      permissions,
    });
  } catch (error: any) {
    console.error('Error fetching staff list:', error);
    return NextResponse.json({ error: 'Lỗi server khi nạp danh sách nhân viên' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền cập nhật quyền hạn.' }, { status: 403 });
    }

    const body = await req.json();
    const { staffId, permissionCodes } = body;

    if (!staffId || !Array.isArray(permissionCodes)) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    // Không cho phép hạ quyền chính Super Admin hiện tại
    const targetStaff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên.' }, { status: 404 });
    }

    if (targetStaff.role === UserRole.SUPER_ADMIN && targetStaff.id === currentUser.id) {
      return NextResponse.json({ error: 'Không thể tự thay đổi quyền hạn của tài khoản Super Admin hiện tại.' }, { status: 400 });
    }

    // Lấy ID của các permission codes tương ứng
    const matchedPerms = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Xóa các quyền cũ của staff này
      await tx.staffPermission.deleteMany({
        where: { staffId },
      });

      // 2. Thêm các quyền mới
      if (matchedPerms.length > 0) {
        await tx.staffPermission.createMany({
          data: matchedPerms.map((p) => ({
            staffId,
            permissionId: p.id,
            assignedById: currentUser.id,
          })),
        });
      }

      // 3. Ghi nhật ký kiểm toán (Audit Log)
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'UPDATE_STAFF_PERMISSIONS',
          targetType: 'STAFF',
          targetId: staffId,
          details: {
            staffEmail: targetStaff.email,
            staffName: targetStaff.fullName,
            newPermissions: permissionCodes,
          },
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Cập nhật phân quyền thành công.' });
  } catch (error: any) {
    console.error('Error updating staff permissions:', error);
    return NextResponse.json({ error: 'Lỗi server khi cập nhật phân quyền.' }, { status: 500 });
  }
}
