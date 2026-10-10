import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface CartValidatePayload {
  items: Array<{ bookId: string; quantity: number }>;
}

/**
 * POST /api/cart/validate
 * Real-time Cart Revalidation API:
 * Đối soát tồn kho, giá bán và trạng thái kích hoạt trực tiếp từ Database
 * Chống lỗi tồn kho cũ (stale inventory) và đảm bảo tính toàn vẹn giỏ hàng
 */
export async function POST(req: NextRequest) {
  try {
    const body: CartValidatePayload = await req.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ validatedItems: [] });
    }

    const bookIds = items.map((i) => i.bookId).filter(Boolean);

    const dbBooks = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        originalPrice: true,
        stockQty: true,
        isActive: true,
        coverUrl: true,
      },
    });

    const bookMap = new Map(dbBooks.map((b) => [b.id, b]));

    const validatedItems = items.map((item) => {
      const dbBook = bookMap.get(item.bookId);

      if (!dbBook || !dbBook.isActive) {
        return {
          bookId: item.bookId,
          title: dbBook?.title || 'Sách ngừng kinh doanh',
          stockQty: 0,
          currentPrice: dbBook?.price || 0,
          isAvailable: false,
          reason: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh',
          adjustedQty: 0,
        };
      }

      const isAvailable = dbBook.stockQty > 0;
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const adjustedQty = isAvailable ? Math.min(requestedQty, dbBook.stockQty) : 0;

      return {
        bookId: dbBook.id,
        title: dbBook.title,
        slug: dbBook.slug,
        currentPrice: dbBook.price,
        originalPrice: dbBook.originalPrice,
        stockQty: dbBook.stockQty,
        coverUrl: dbBook.coverUrl,
        isAvailable,
        reason: !isAvailable ? 'Sản phẩm tạm thời hết hàng trong kho' : undefined,
        adjustedQty,
      };
    });

    return NextResponse.json({ validatedItems });
  } catch (error) {
    console.error('Lỗi khi thẩm định giỏ hàng (Cart validate):', error);
    return NextResponse.json({ error: 'Lỗi thẩm định giỏ hàng' }, { status: 500 });
  }
}
