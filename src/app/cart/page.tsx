import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CartClient } from '@/components/cart/CartClient';
import { BookCardData } from '@/components/book/BookCard';

export const metadata: Metadata = {
  title: 'Giỏ hàng của bạn — Tổ Sách Bookstore',
  description: 'Xem lại danh sách sách đã chọn, kiểm tra điều kiện Miễn phí vận chuyển (Freeship) và tiến hành đặt hàng trực tuyến an toàn.',
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function CartPage() {
  // Query 4 top bestseller books to recommend on the cart page
  const rawBooks = await prisma.book.findMany({
    where: { isActive: true },
    take: 4,
    orderBy: { soldCount: 'desc' },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
    },
  });

  const recommendedBooks: BookCardData[] = rawBooks.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    price: b.price,
    originalPrice: b.originalPrice,
    coverUrl: b.coverUrl,
    avgRating: b.avgRating,
    ratingCount: b.ratingCount,
    stockQty: b.stockQty,
    soldCount: b.soldCount,
    isBestseller: b.isBestseller,
    isNew: b.isNew,
    authors: b.authors.map((a) => ({
      author: {
        id: a.author.id,
        name: a.author.name,
      },
    })),
    categories: b.categories.map((c) => ({
      category: {
        id: c.category.id,
        name: c.category.name,
      },
    })),
  }));

  return (
    <main className="min-h-screen bg-slate-50/70 pb-16">
      <CartClient recommendedBooks={recommendedBooks} />
    </main>
  );
}
