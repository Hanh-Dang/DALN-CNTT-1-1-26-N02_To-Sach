import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReviewStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để gửi đánh giá cho tác phẩm này.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bookId, rating, title, body: reviewText } = body;

    if (!bookId || !rating || !reviewText) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đánh giá bắt buộc (số sao hoặc nội dung).' },
        { status: 400 }
      );
    }

    const numRating = Math.min(5, Math.max(1, Number(rating)));

    // Verify if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Không tìm thấy sách yêu cầu đánh giá.' },
        { status: 404 }
      );
    }

    // Check if user has purchased this book
    const verifiedOrder = await prisma.orderItem.findFirst({
      where: {
        bookId,
        order: {
          userId: user.id,
        },
      },
    });

    // Create review
    const newReview = await prisma.review.create({
      data: {
        bookId,
        userId: user.id,
        rating: numRating,
        title: title || null,
        body: reviewText,
        isVerifiedPurchase: !!verifiedOrder,
        status: ReviewStatus.APPROVED, // Tự động duyệt hoặc kiểm duyệt
      },
    });

    // Recalculate book average rating & count
    const aggregates = await prisma.review.aggregate({
      where: { bookId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.book.update({
      where: { id: bookId },
      data: {
        avgRating: aggregates._avg.rating ? Number(aggregates._avg.rating.toFixed(1)) : 5,
        ratingCount: aggregates._count.rating || 1,
      },
    });

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi lưu đánh giá. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
