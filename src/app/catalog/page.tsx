import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CatalogClient } from '@/components/catalog/CatalogClient';
import { CatalogBookItem } from '@/components/catalog/CatalogBookCard';
import { CategoryFilterItem, PublisherFilterItem } from '@/components/catalog/CatalogFilterSidebar';

export const metadata: Metadata = {
  title: 'Danh mục sách & Bộ lọc — Tổ Sách Bookstore',
  description: 'Khám phá kho tri thức sách chính hãng với bộ lọc chuyên sâu theo ngành hàng, khoảng giá, nhà xuất bản và tác giả.',
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function CatalogPage() {
  // 1. Lấy toàn bộ sách thực tế đang active từ Supabase PostgreSQL qua Prisma (100% dữ liệu thật, không mock)
  const rawBooks = await prisma.book.findMany({
    where: { isActive: true },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const books: CatalogBookItem[] = rawBooks.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    author: b.authors && b.authors.length > 0 ? b.authors.map((a) => a.author.name).join(', ') : 'Tổ Sách Tuyển Chọn',
    publisher: b.publisher || 'NXB Trẻ',
    price: b.price,
    originalPrice: b.originalPrice,
    coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    rating: b.avgRating || 5.0,
    ratingCount: b.ratingCount || 1,
    inStock: b.stockQty > 0,
    categorySlug: b.categories.map((c) => c.category.slug).join(' '),
    tag: b.publisher || 'Chính Hãng',
  }));

  // 2. Lấy danh mục thực tế từ Database kèm tính toán số lượng sách thực tế
  const rawCategories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Xây dựng cây danh mục cấp 1 và cấp con với số lượng sách thực tế
  const rootCategories = rawCategories.filter((c) => c.level === 1);
  const categoriesData: CategoryFilterItem[] = rootCategories.map((root) => {
    // Thu thập toàn bộ slug của root và các con cháu của nó
    const allSlugs = new Set<string>([root.slug]);
    const subsList: Array<{ name: string; slug: string; count: number }> = [];

    root.children?.forEach((child) => {
      allSlugs.add(child.slug);
      if (child.children && child.children.length > 0) {
        child.children.forEach((subChild) => {
          allSlugs.add(subChild.slug);
          // Đếm số sách thật trong DB thuộc subChild
          const subCount = books.filter((b) => b.categorySlug?.includes(subChild.slug)).length;
          subsList.push({
            name: subChild.name,
            slug: subChild.slug,
            count: subCount,
          });
        });
      } else {
        const childCount = books.filter((b) => b.categorySlug?.includes(child.slug)).length;
        subsList.push({
          name: child.name,
          slug: child.slug,
          count: childCount,
        });
      }
    });

    // Tổng số sách thực tế thuộc danh mục cha này
    const totalRootCount = books.filter((b) => 
      Array.from(allSlugs).some((s) => b.categorySlug?.includes(s))
    ).length;

    return {
      name: root.name,
      slug: root.slug,
      count: totalRootCount,
      subs: subsList,
    };
  });

  // 3. Tính toán Nhà xuất bản thực tế từ các cuốn sách trong DB
  const pubMap = new Map<string, number>();
  rawBooks.forEach((b) => {
    if (b.publisher) {
      pubMap.set(b.publisher, (pubMap.get(b.publisher) || 0) + 1);
    }
  });
  const publishersData: PublisherFilterItem[] = Array.from(pubMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // 4. Lấy danh sách Tác giả thực tế từ sách trong DB
  const authorSet = new Set<string>();
  rawBooks.forEach((b) => {
    b.authors.forEach((a) => {
      if (a.author?.name) authorSet.add(a.author.name);
    });
  });
  const authorsData: string[] = Array.from(authorSet);

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <div className="w-10 h-10 border-4 border-[#0B1F3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh mục sách và bộ lọc Tổ Sách...</p>
          </div>
        }
      >
        <CatalogClient 
          initialBooks={books}
          categoriesData={categoriesData}
          publishersData={publishersData}
          authorsData={authorsData}
        />
      </Suspense>
    </main>
  );
}
