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

export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams?: Promise<{
    page?: string;
    category?: string;
    cat?: string;
    q?: string;
    sort?: string;
    priceRange?: string;
    minPrice?: string;
    maxPrice?: string;
    publisher?: string;
    inStock?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  // 1. Phân tích tham số phân trang & lọc phía Server (H12: Server-side Pagination)
  const rawPage = parseInt(resolvedParams.page || '1', 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = 24; // 24 cuốn/trang: Tối ưu tải nhanh, payload HTML giảm từ 2MB xuống ~30KB

  const rawCat = (resolvedParams.category || resolvedParams.cat || '').trim();
  const queryText = (resolvedParams.q || '').trim();
  const sortOption = (resolvedParams.sort || 'newest').trim();
  const minPrice = resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined;
  const publisher = (resolvedParams.publisher || '').trim();
  const inStockOnly = resolvedParams.inStock === 'true';

  // 2. Xây dựng điều kiện lọc Prisma WHERE
  const where: any = { isActive: true };

  // A. Lọc theo danh mục (hỗ trợ alias kinh-te-ky-nang & chuyên mục con - M11)
  if (rawCat) {
    let targetSlugs = [rawCat];
    if (rawCat === 'kinh-te-ky-nang' || rawCat === 'kinh-te') {
      targetSlugs = ['kinh-te-khoi-nghiep', 'ky-nang-song'];
    } else if (rawCat === 'ky-nang') {
      targetSlugs = ['ky-nang-song'];
    }

    const matchedCats = await prisma.category.findMany({
      where: {
        OR: [
          { slug: { in: targetSlugs } },
          { parent: { slug: { in: targetSlugs } } },
          { parent: { parent: { slug: { in: targetSlugs } } } },
        ],
      },
      select: { id: true },
    });

    const categoryIds = matchedCats.map((c) => c.id);
    if (categoryIds.length > 0) {
      where.categories = {
        some: {
          categoryId: { in: categoryIds },
        },
      };
    }
  }

  // B. Tìm kiếm từ khóa (Tiêu đề, Tác giả, Nhà xuất bản)
  if (queryText) {
    where.OR = [
      { title: { contains: queryText, mode: 'insensitive' } },
      { publisher: { contains: queryText, mode: 'insensitive' } },
      { authors: { some: { author: { name: { contains: queryText, mode: 'insensitive' } } } } },
    ];
  }

  // C. Lọc khoảng giá
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) where.price.gte = minPrice;
    if (maxPrice !== undefined && !isNaN(maxPrice)) where.price.lte = maxPrice;
  }

  // D. Lọc Nhà xuất bản
  if (publisher && publisher !== 'Tất cả NXB') {
    where.publisher = publisher;
  }

  // E. Lọc còn hàng
  if (inStockOnly) {
    where.stockQty = { gt: 0 };
  }

  // 3. Sắp xếp thứ tự hiển thị (M11: Bán chạy theo soldCount)
  let orderBy: any = { createdAt: 'desc' };
  if (sortOption === 'price-asc') orderBy = { price: 'asc' };
  else if (sortOption === 'price-desc') orderBy = { price: 'desc' };
  else if (sortOption === 'rating') orderBy = { avgRating: 'desc' };
  else if (sortOption === 'bestseller') orderBy = { soldCount: 'desc' };

  // 4. Thực thi truy vấn Server-side phân trang (24 cuốn/trang)
  const [rawBooks, totalResults] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        authors: { include: { author: true } },
        categories: {
          include: {
            category: {
              include: {
                parent: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy,
    }),
    prisma.book.count({ where }),
  ]);

  const books: CatalogBookItem[] = rawBooks.map((b) => {
    const allCatSlugs = new Set<string>();
    b.categories.forEach((bc) => {
      let cur: any = bc.category;
      while (cur) {
        if (cur.slug) allCatSlugs.add(cur.slug);
        cur = cur.parent;
      }
    });

    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      author: b.authors && b.authors.length > 0 ? b.authors.map((a) => a.author.name).join(', ') : 'Tổ Sách Tuyển Chọn',
      publisher: b.publisher || 'NXB Trẻ',
      price: b.price,
      originalPrice: b.originalPrice,
      coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      rating: b.avgRating || 0,
      ratingCount: b.ratingCount || 0,
      inStock: b.stockQty > 0,
      stockQty: b.stockQty,
      categorySlug: Array.from(allCatSlugs).join(' '),
      tag: b.publisher || 'Chính Hãng',
    };
  });

  // 5. Lấy cây danh mục thực tế từ Database kèm số lượng sách thực tế (tối ưu qua Prisma _count)
  const rawCategories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          children: {
            include: {
              _count: { select: { books: true } },
            },
          },
          _count: { select: { books: true } },
        },
      },
      _count: { select: { books: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const rootCategories = rawCategories.filter((c) => c.level === 1);
  const categoriesData: CategoryFilterItem[] = rootCategories.map((root) => {
    let rootBooksSum = root._count?.books || 0;
    const subsList: Array<{ name: string; slug: string; count: number }> = [];

    root.children?.forEach((child) => {
      let childCount = child._count?.books || 0;
      if (child.children && child.children.length > 0) {
        child.children.forEach((subChild) => {
          const subCount = subChild._count?.books || 0;
          childCount += subCount;
          subsList.push({
            name: subChild.name,
            slug: subChild.slug,
            count: subCount,
          });
        });
      } else {
        subsList.push({
          name: child.name,
          slug: child.slug,
          count: childCount,
        });
      }
      rootBooksSum += childCount;
    });

    return {
      name: root.name,
      slug: root.slug,
      count: rootBooksSum,
      subs: subsList,
    };
  });

  // 6. Lấy danh sách Nhà xuất bản tiêu biểu
  const rawPublishers = await prisma.book.groupBy({
    by: ['publisher'],
    where: { isActive: true, publisher: { not: null } },
    _count: { publisher: true },
    orderBy: { _count: { publisher: 'desc' } },
    take: 15,
  });
  const publishersData: PublisherFilterItem[] = rawPublishers
    .filter((p) => !!p.publisher)
    .map((p) => ({
      name: p.publisher as string,
      count: p._count.publisher,
    }));

  // 7. Lấy danh sách Tác giả có nhiều tác phẩm nhất
  const rawAuthors = await prisma.author.findMany({
    take: 20,
    include: { _count: { select: { books: true } } },
    orderBy: { books: { _count: 'desc' } },
  });
  const authorsData: string[] = rawAuthors.map((a) => a.name);

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
          serverTotalResults={totalResults}
          serverCurrentPage={page}
          serverPageSize={pageSize}
          categoriesData={categoriesData}
          publishersData={publishersData}
          authorsData={authorsData}
        />
      </Suspense>
    </main>
  );
}
