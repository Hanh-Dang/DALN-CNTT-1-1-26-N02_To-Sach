import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export const metadata: Metadata = {
  title: 'Thanh Toán Đơn Hàng | Tổ Sách - Sách về tổ, tri thức bay xa',
  description:
    'Xác nhận thông tin giao hàng và lựa chọn phương thức thanh toán an toàn, bảo mật tại Tổ Sách.',
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  // Bắt buộc xác thực tài khoản trước khi vào trang Checkout (Trường phái 1)
  if (!user) {
    redirect('/auth?redirect=/checkout');
  }

  // Truy vấn thông tin người dùng kèm hồ sơ địa chỉ đã lưu
  const userWithProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      profile: {
        select: {
          addressProvince: true,
          addressDistrict: true,
          addressWard: true,
          addressDetail: true,
        },
      },
    },
  });

  const initialUser = userWithProfile || {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    profile: null,
  };

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      <CheckoutClient user={initialUser} />
    </main>
  );
}
