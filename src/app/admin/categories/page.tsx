import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  AdminCategoriesClient,
  AdminCategoryData,
} from '@/components/admin/AdminCategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasCatPerm = user?.permissions?.includes('MANAGE_CATEGORIES') ?? false;
  const canManageCategories = isSuperAdmin || hasCatPerm;

  const rawCategories = await prisma.category.findMany({
    include: {
      parent: {
        select: { id: true, name: true, slug: true, level: true },
      },
      _count: {
        select: {
          books: true,
          children: true,
        },
      },
    },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  const categories: AdminCategoryData[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    level: c.level,
    sortOrder: c.sortOrder,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    parent: c.parent,
    _count: c._count,
  }));

  return (
    <AdminCategoriesClient
      initialCategories={categories}
      canManageCategories={canManageCategories}
      currentUser={user ? { fullName: user.fullName, role: user.role } : null}
    />
  );
}
