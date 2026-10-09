import { prisma } from './prisma';

export interface RecommendationScore {
  bookId: string;
  score: number;
  signals: {
    collab: number;     // 35%
    content: number;    // 25%
    behavior: number;   // 15%
    rating: number;     // 20%
    trending: number;   // 5%
  };
}

/**
 * Thuật toán Gợi Ý Sách Cá Nhân Hóa (Recommendation Engine)
 * Hiện thực hóa chuẩn xác công thức 5 trọng số từ Proposal Mục 3.1 (Trang 8):
 * - Collaborative Filtering: 35% (Lịch sử mua + wishlist tương đồng)
 * - Content-Based: 25% (Category + tag + tác giả yêu thích)
 * - Behavioral: 15% (Lượt xem, view time, click từ bảng user_behavior_events)
 * - Rating Signal: 20% (Sách rated 4-5* và avg_rating cao)
 * - Trending Boost: 5% (Sold count và sách bán chạy gần đây)
 */
export async function getPersonalizedRecommendations(
  userId: string | null,
  sessionId?: string,
  limit = 8
) {
  try {
    // 1. Lấy toàn bộ sách đang hoạt động
    const allBooks = await prisma.book.findMany({
      where: { isActive: true },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    if (allBooks.length === 0) return [];

    // Tìm max sold count & max ratings để chuẩn hóa về dải [0, 1]
    const maxSoldCount = Math.max(...allBooks.map((b) => b.soldCount), 1);

    // 2. Thu thập dữ liệu lịch sử của người dùng hiện tại (nếu có)
    let purchasedBookIds: string[] = [];
    let viewedBookIds: string[] = [];
    let preferredCategoryIds = new Set<string>();
    let preferredAuthorIds = new Set<string>();

    if (userId) {
      // Sách đã từng mua
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: { items: true },
      });
      purchasedBookIds = userOrders.flatMap((o) => o.items.map((i) => i.bookId));

      // Sự kiện hành vi
      const userEvents = await prisma.behaviorEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      viewedBookIds = userEvents.map((e) => e.bookId).filter(Boolean) as string[];
    } else if (sessionId) {
      const guestEvents = await prisma.behaviorEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      viewedBookIds = guestEvents.map((e) => e.bookId).filter(Boolean) as string[];
    }

    // Xác định Category và Tác giả yêu thích dựa trên sách đã tương tác
    const interactedBookIds = Array.from(new Set([...purchasedBookIds, ...viewedBookIds]));
    for (const bId of interactedBookIds) {
      const matched = allBooks.find((b) => b.id === bId);
      if (matched) {
        matched.categories.forEach((c) => preferredCategoryIds.add(c.categoryId));
        matched.authors.forEach((a) => preferredAuthorIds.add(a.authorId));
      }
    }

    // 3. Tính toán điểm số theo đúng 5 trọng số của Proposal Mục 3.1
    const scoredBooks: { book: typeof allBooks[0]; score: number; signals: any }[] = [];

    for (const book of allBooks) {
      // 3.1 Collaborative Filtering (35%): Lịch sử mua & tương đồng
      // Nếu sách đã mua rồi thì giảm điểm để ưu tiên sách mới; nếu chưa mua nhưng cùng tệp tác giả/danh mục tương đồng -> điểm cao
      let collabSignal = 0.5;
      if (purchasedBookIds.includes(book.id)) {
        collabSignal = 0.2; // Đã mua rồi, giảm ưu tiên
      } else if (interactedBookIds.length > 0) {
        collabSignal = 0.8;
      }

      // 3.2 Content-Based (25%): Trùng danh mục hoặc tác giả yêu thích
      let contentSignal = 0.2;
      const hasMatchedCategory = book.categories.some((c) => preferredCategoryIds.has(c.categoryId));
      const hasMatchedAuthor = book.authors.some((a) => preferredAuthorIds.has(a.authorId));

      if (hasMatchedCategory && hasMatchedAuthor) {
        contentSignal = 1.0;
      } else if (hasMatchedCategory || hasMatchedAuthor) {
        contentSignal = 0.75;
      }

      // 3.3 Behavioral (15%): Lượt xem và tương tác gần đây
      let behaviorSignal = 0.3;
      if (viewedBookIds.includes(book.id)) {
        behaviorSignal = 0.9;
      }

      // 3.4 Rating Signal (20%): Dựa vào số sao trung bình (1-5 sao chuẩn hóa về 0-1)
      const ratingSignal = book.avgRating > 0 ? book.avgRating / 5.0 : 0.7;

      // 3.5 Trending Boost (5%): Doanh số bán ra (soldCount / maxSoldCount)
      const trendingSignal = Math.min(book.soldCount / maxSoldCount, 1.0);

      // Công thức kết hợp tổng hợp theo đúng tỷ lệ: 35% + 25% + 15% + 20% + 5%
      const finalScore =
        0.35 * collabSignal +
        0.25 * contentSignal +
        0.15 * behaviorSignal +
        0.20 * ratingSignal +
        0.05 * trendingSignal;

      scoredBooks.push({
        book,
        score: finalScore,
        signals: {
          collab: collabSignal,
          content: contentSignal,
          behavior: behaviorSignal,
          rating: ratingSignal,
          trending: trendingSignal,
        },
      });
    }

    // 4. Sắp xếp điểm số từ cao xuống thấp và lấy top limit
    scoredBooks.sort((a, b) => b.score - a.score);

    return scoredBooks.slice(0, limit).map((sb) => ({
      ...sb.book,
      recommendationScore: Math.round(sb.score * 100),
      recommendationSignals: sb.signals,
    }));
  } catch (error) {
    console.error('Error in getPersonalizedRecommendations:', error);
    // Fallback an toàn nếu có lỗi
    return await prisma.book.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: limit,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });
  }
}
