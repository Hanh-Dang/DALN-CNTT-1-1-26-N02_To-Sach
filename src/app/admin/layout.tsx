import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal | Tổ Sách B2C',
  description: 'Phân hệ quản trị vận hành kho sách, đơn hàng và danh mục cho Tổ Sách.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Chốt chặn bảo mật Server-side: Bắt buộc STAFF hoặc SUPER_ADMIN
  if (!user || (user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN')) {
    redirect('/auth?redirect=/admin');
  }

  // Đếm thời gian thực các đơn hàng PENDING đang chờ nhân viên duyệt
  let pendingOrdersCount = 0;
  try {
    pendingOrdersCount = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('Error counting pending orders:', error);
  }

  return (
    <AdminLayoutShell
      user={{
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        avatarUrl: user.avatarUrl,
      }}
      pendingOrdersCount={pendingOrdersCount}
    >
      {children}
    </AdminLayoutShell>
  );
}
