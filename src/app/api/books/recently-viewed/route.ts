import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordRecentlyViewed, getRecentlyViewedBookIds } from '@/lib/redis';

// Lấy định danh người dùng (User ID hoặc Session Cookie cho khách vãng lai)
async function getClientIdentifier(req: NextRequest): Promise<string> {
  const user = await getCurrentUser();
  if (user?.id) {
    return `user_${user.id}`;
  }

  // Khách vãng lai: dùng cookie tosach_session_id
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('tosach_session_id')?.value;
  if (!sessionId) {
    sessionId = req.headers.get('x-session-id') || 'guest_default';
  }
  return `guest_${sessionId}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu bookId' }, { status: 400 });
    }

    const identifier = await getClientIdentifier(req);
    await recordRecentlyViewed(identifier, bookId);

    // Ghi nhận sự kiện hành vi vào bảng user_behavior_events
    try {
      const user = await getCurrentUser();
      await prisma.behaviorEvent.create({
        data: {
          sessionId: identifier,
          userId: user?.id || null,
          eventType: 'view',
          bookId,
        },
      });
    } catch {
      // Bỏ qua lỗi log event phụ để không chặn luồng chính
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking recently viewed:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const identifier = await getClientIdentifier(req);
    const bookIds = await getRecentlyViewedBookIds(identifier, 10);

    if (bookIds.length === 0) {
      return NextResponse.json({ books: [] });
    }

    // Nạp đầy đủ thông tin sách từ PostgreSQL
    const books = await prisma.book.findMany({
      where: {
        id: { in: bookIds },
        isActive: true,
      },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    // Sắp xếp lại theo đúng thứ tự vừa xem trong Redis
    const sortedBooks = bookIds
      .map((id) => books.find((b) => b.id === id))
      .filter(Boolean);

    return NextResponse.json({ books: sortedBooks });
  } catch (error: any) {
    console.error('Error getting recently viewed books:', error);
    return NextResponse.json({ books: [] });
  }
}
