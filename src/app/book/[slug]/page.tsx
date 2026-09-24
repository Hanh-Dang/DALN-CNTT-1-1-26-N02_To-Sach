import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BookDetailClient, BookDetailData } from '@/components/book/BookDetailClient';
import { BookCardData } from '@/components/book/BookCard';

export const revalidate = 60; // ISR cache 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug, isActive: true },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
    },
  });

  if (!book) {
    return {
      title: 'Không tìm thấy sách — Tổ Sách Bookstore',
      description: 'Cuốn sách bạn yêu cầu không tồn tại hoặc đã ngừng phân phối trên Tổ Sách.',
    };
  }

  const authorNames = book.authors.map((a) => a.author.name).join(', ') || 'Tổ Sách';
  const categoryNames = book.categories.map((c) => c.category.name).join(' · ');

  return {
    title: `${book.title} — ${authorNames} | Tổ Sách Bookstore`,
    description: book.description ? book.description.slice(0, 160) + '...' : `Mua sách ${book.title} chính hãng tại Tổ Sách, chiết khấu giá tốt, miễn phí vận chuyển toàn quốc.`,
    keywords: [book.title, authorNames, categoryNames, 'sách chính hãng', 'Tổ Sách'],
    openGraph: {
      title: `${book.title} — ${authorNames} | Tổ Sách`,
      description: book.description ? book.description.slice(0, 160) : `Mua sách ${book.title} chính hãng tại Tổ Sách`,
      images: [
        {
          url: book.coverUrl,
          width: 800,
          height: 1066,
          alt: book.title,
        },
      ],
      type: 'book',
    },
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Query Book details with relations
  const rawBook = await prisma.book.findUnique({
    where: { slug, isActive: true },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          user: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!rawBook) {
    notFound();
  }

  // 2. Query Related Books in same category
  const categoryIds = rawBook.categories.map((c) => c.categoryId);
  let rawRelatedBooks = await prisma.book.findMany({
    where: {
      isActive: true,
      id: { not: rawBook.id },
      categories: {
        some: {
          categoryId: { in: categoryIds },
        },
      },
    },
    take: 4,
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
    },
    orderBy: { soldCount: 'desc' },
  });

  // Fallback if not enough category books: take top bestsellers
  if (rawRelatedBooks.length < 4) {
    const existingIds = [rawBook.id, ...rawRelatedBooks.map((b) => b.id)];
    const additionalBooks = await prisma.book.findMany({
      where: {
        isActive: true,
        id: { notIn: existingIds },
      },
      take: 4 - rawRelatedBooks.length,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
      orderBy: { soldCount: 'desc' },
    });
    rawRelatedBooks = [...rawRelatedBooks, ...additionalBooks];
  }

  // Format data for Client Component
  const bookData: BookDetailData = {
    id: rawBook.id,
    isbn: rawBook.isbn,
    title: rawBook.title,
    slug: rawBook.slug,
    description: rawBook.description,
    price: rawBook.price,
    originalPrice: rawBook.originalPrice,
    stockQty: rawBook.stockQty,
    soldCount: rawBook.soldCount,
    pageCount: rawBook.pageCount,
    language: rawBook.language,
    publishYear: rawBook.publishYear,
    publisher: rawBook.publisher,
    coverUrl: rawBook.coverUrl,
    extraImages: rawBook.extraImages,
    avgRating: rawBook.avgRating,
    ratingCount: rawBook.ratingCount,
    weightG: rawBook.weightG,
    sizeCm: rawBook.sizeCm,
    format: rawBook.format,
    translator: rawBook.translator,
    tags: rawBook.tags,
    authors: rawBook.authors.map((a) => ({
      author: {
        id: a.author.id,
        name: a.author.name,
        slug: a.author.slug,
        bio: a.author.bio,
      },
    })),
    categories: rawBook.categories.map((c) => ({
      category: {
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
        level: c.category.level,
      },
    })),
    reviews: rawBook.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt.toISOString(),
      user: {
        fullName: r.user.fullName || 'Bạn đọc Tổ Sách',
      },
    })),
  };

  const relatedBooksData: BookCardData[] = rawRelatedBooks.map((b) => ({
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

  // JSON-LD Structured Data Schema for Search Engines (Product & Breadcrumb)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: rawBook.title,
    image: [rawBook.coverUrl, ...(rawBook.extraImages || [])],
    description: rawBook.description?.slice(0, 300),
    sku: rawBook.isbn || rawBook.id,
    brand: {
      '@type': 'Brand',
      name: rawBook.publisher || 'Tổ Sách',
    },
    offers: {
      '@type': 'Offer',
      url: `https://tosach.vn/book/${rawBook.slug}`,
      priceCurrency: 'VND',
      price: rawBook.price,
      priceValidUntil: '2027-12-31',
      availability: rawBook.stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rawBook.avgRating || 5,
      reviewCount: Math.max(rawBook.ratingCount, 1),
    },
  };

  return (
    <main className="min-h-screen bg-slate-50/70 pb-16">
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <BookDetailClient book={bookData} relatedBooks={relatedBooksData} />
    </main>
  );
}
