import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AdminStaffClient } from '@/components/admin/AdminStaffClient';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/admin/staff');
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-slate-200/80 shadow-xs space-y-4 my-8">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#0B1F3A]">Không Đủ Quyền Hạn Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tính năng Phân quyền Nhân viên (Dynamic RBAC) được giới hạn riêng cho vai trò{' '}
          <strong className="text-[#0B1F3A]">SUPER_ADMIN</strong>. Tài khoản hiện tại của bạn không có quyền xem hoặc sửa đổi ma trận này.
        </p>
      </div>
    );
  }

  const [rawStaff, rawPermissions] = await Promise.all([
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

  const formattedStaff = rawStaff.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
  }));

  return (
    <AdminStaffClient
      initialStaff={formattedStaff}
      permissions={rawPermissions}
      currentUserEmail={user.email}
    />
  );
}
