import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Tạo slug từ khóa để tìm kiếm không dấu trên trường slug
    const normalizedNoAccent = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

    const slugSearch = normalizedNoAccent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Tìm kiếm các cuốn sách liên quan nhất theo Tiêu đề, Slug, Tác giả, Thể loại, Mô tả
    const searchConditions: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      {
        authors: {
          some: {
            author: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        },
      },
      {
        categories: {
          some: {
            category: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        },
      },
    ];

    if (slugSearch) {
      searchConditions.push({ slug: { contains: slugSearch, mode: 'insensitive' } });
    }

    const books = await prisma.book.findMany({
      where: {
        isActive: true,
        OR: searchConditions,
      },
      take: 6,
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
      type: 'search',
      query,
      books: books.map((b) => ({
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
  } catch (error) {
    console.error('Lỗi API search books:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tìm kiếm sách', books: [] },
      { status: 500 }
    );
  }
}
