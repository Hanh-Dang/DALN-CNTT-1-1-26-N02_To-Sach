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

    // Check if user has purchased this book (chỉ tính đơn đã giao thành công DELIVERED - M2)
    const verifiedOrder = await prisma.orderItem.findFirst({
      where: {
        bookId,
        order: {
          userId: user.id,
          status: 'DELIVERED',
        },
      },
    });

    // Check if user already reviewed this book (chống spam review vô hạn - M2)
    const existingReview = await prisma.review.findFirst({
      where: {
        bookId,
        userId: user.id,
      },
    });

    let savedReview;
    if (existingReview) {
      // Cập nhật đánh giá hiện tại thay vì spam tạo mới
      savedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numRating,
          title: title || null,
          body: reviewText,
          isVerifiedPurchase: !!verifiedOrder,
          status: ReviewStatus.APPROVED,
          updatedAt: new Date(),
        },
      });
    } else {
      // Tạo review mới lần đầu
      savedReview = await prisma.review.create({
        data: {
          bookId,
          userId: user.id,
          rating: numRating,
          title: title || null,
          body: reviewText,
          isVerifiedPurchase: !!verifiedOrder,
          status: ReviewStatus.APPROVED,
        },
      });
    }

    // Recalculate book average rating & count (sửa L7 & M11: không tự ý fallback 5 sao / 1 đánh giá nếu chưa có)
    const aggregates = await prisma.review.aggregate({
      where: { bookId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.book.update({
      where: { id: bookId },
      data: {
        avgRating: aggregates._avg.rating ? Number(aggregates._avg.rating.toFixed(1)) : 0,
        ratingCount: aggregates._count.rating || 0,
      },
    });

    return NextResponse.json({
      success: true,
      review: savedReview,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi lưu đánh giá. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
