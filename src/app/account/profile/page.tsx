import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ProfileClient from '@/components/account/ProfileClient';

export const metadata: Metadata = {
  title: 'Hồ Sơ Của Tôi | Tổ Sách - Kho Tàng Tri Thức Việt',
  description: 'Quản lý thông tin tài khoản, ảnh đại diện và địa chỉ nhận hàng tại Tổ Sách.',
};

export default async function AccountProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/account/profile');
  }

  // Lấy đầy đủ thông tin người dùng kèm Profile
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
    },
  });

  if (!fullUser) {
    redirect('/auth?redirect=/account/profile');
  }

  const { passwordHash, ...safeUser } = fullUser;

  return (
    <div className="bg-slate-50/60 min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ProfileClient initialUser={JSON.parse(JSON.stringify(safeUser))} />
      </div>
    </div>
  );
}
