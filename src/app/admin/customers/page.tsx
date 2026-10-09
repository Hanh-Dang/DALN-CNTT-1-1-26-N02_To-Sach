import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AdminCustomersClient, CustomerData } from '@/components/admin/AdminCustomersClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/admin/customers');
  }

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const hasUserPerm = user.permissions?.includes('MANAGE_USERS') ?? false;

  if (!isSuperAdmin && !hasUserPerm) {
    redirect('/admin');
  }

  const rawUsers = await prisma.user.findMany({
    where: {
      role: UserRole.USER,
    },
    include: {
      profile: true,
      orders: {
        select: {
          totalAmount: true,
          status: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedCustomers: CustomerData[] = rawUsers.map((u) => {
    const totalSpent = u.orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const location = u.profile?.addressProvince
      ? `${u.profile.addressDistrict ? u.profile.addressDistrict + ', ' : ''}${u.profile.addressProvince}`
      : 'Chưa cập nhật địa chỉ';

    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      status: u.status,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt.toISOString(),
      ordersCount: u._count.orders,
      totalSpent,
      reviewsCount: u._count.reviews,
      location,
    };
  });

  return <AdminCustomersClient initialCustomers={formattedCustomers} />;
}
