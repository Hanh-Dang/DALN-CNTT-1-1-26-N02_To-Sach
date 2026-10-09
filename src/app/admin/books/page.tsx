import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  AdminBooksClient,
  AdminBookItem,
  AdminCategoryItem,
} from '@/components/admin/AdminBooksClient';

export const dynamic = 'force-dynamic';

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialQuery = (resolvedParams.q || '').trim();

  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasBookPerm = user?.permissions?.includes('MANAGE_BOOKS') ?? false;
  const canManageBooks = isSuperAdmin || hasBookPerm;

  // 1. TRUY VẤN TẤT CẢ SÁCH TỪ SUPABASE
  const [rawBooks, rawCategories] = await Promise.all([
    prisma.book.findMany({
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    }),
  ]);

  const books: AdminBookItem[] = rawBooks.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    isbn: b.isbn,
    publisher: b.publisher,
    publishYear: b.publishYear,
    pageCount: b.pageCount,
    originalPrice: b.originalPrice,
    price: b.price,
    stockQty: b.stockQty,
    soldCount: b.soldCount,
    coverUrl: b.coverUrl,
    format: b.format,
    description: b.description,
    authors: b.authors.map((ba) => ({
      author: {
        id: ba.author.id,
        name: ba.author.name,
      },
    })),
    categories: b.categories.map((bc) => ({
      category: {
        id: bc.category.id,
        name: bc.category.name,
      },
    })),
    createdAt: b.createdAt.toISOString(),
  }));

  const categories: AdminCategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    level: c.level,
  }));

  return (
    <AdminBooksClient
      initialBooks={books}
      categories={categories}
      canManageBooks={canManageBooks}
      currentUser={user ? { fullName: user.fullName, role: user.role } : null}
      initialQuery={initialQuery}
    />
  );
}
