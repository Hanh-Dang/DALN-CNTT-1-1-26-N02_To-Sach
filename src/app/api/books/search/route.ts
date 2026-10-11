import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchBooksSmart } from '@/lib/elasticsearch';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    // Nếu không có từ khóa hoặc từ khóa quá ngắn, trả về các cuốn sách hot nhất / bán chạy nhất
    if (!query) {
      const hotBooks = await prisma.book.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: [
          { isBestseller: 'desc' },
          { soldCount: 'desc' },
        ],
        include: {
          authors: { include: { author: true } },
          categories: { include: { category: true } },
        },
      });

      return NextResponse.json({
        type: 'popular',
        source: 'POSTGRESQL_HOT',
        books: hotBooks.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          price: b.price,
          originalPrice: b.originalPrice,
          coverUrl: b.coverUrl,
          soldCount: b.soldCount,
          authorName: b.authors[0]?.author.name || 'Tác giả tuyển chọn',
          categoryName: b.categories[0]?.category.name || 'Văn học',
        })),
      });
    }

    // Tìm kiếm thông minh qua Elasticsearch 8.x (kèm PostgreSQL Fallback tự động)
    const { source, results: books } = await searchBooksSmart(query, 6);

    return NextResponse.json({
      type: 'search',
      source,
      engine: source === 'ELASTICSEARCH_8'
        ? 'Elasticsearch 8.x (Vietnamese Analyzer + Fuzzy Matching)'
        : 'PostgreSQL pg_trgm + unaccent (Vietnamese Fuzzy & Typo Tolerance)',
      query,
      books: books.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        price: b.price,
        originalPrice: b.originalPrice,
        coverUrl: b.coverUrl,
        soldCount: b.soldCount,
        authorName: b.authors?.[0]?.author?.name || b.authorName || 'Tác giả tuyển chọn',
        categoryName: b.categories?.[0]?.category?.name || b.categoryName || 'Văn học',
      })),
    });
  } catch (error) {
    console.error('Lỗi API search books:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tìm kiếm sách', books: [] },
      { status: 500 }
    );
  }
}
