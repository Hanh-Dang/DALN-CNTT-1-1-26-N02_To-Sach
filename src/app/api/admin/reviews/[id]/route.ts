import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReviewStatus } from '@prisma/client';

/**
 * PATCH /api/admin/reviews/[id]
 * Cập nhật trạng thái đánh giá: APPROVED (Duyệt) | REJECTED (Từ chối/Ẩn) | PENDING (Chờ duyệt)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasReviewPerm = user.permissions?.includes('MANAGE_REVIEWS');

    if (!isSuperAdmin && !hasReviewPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_REVIEWS để thay đổi trạng thái đánh giá.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(ReviewStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái đánh giá không hợp lệ (Phải là APPROVED, REJECTED hoặc PENDING).' },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: { book: true, user: true },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Không tìm thấy đánh giá cần cập nhật.' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái đánh giá
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            price: true,
            avgRating: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Tính toán lại điểm số trung bình và số lượt đánh giá của cuốn sách
    const aggregates = await prisma.review.aggregate({
      where: {
        bookId: existingReview.bookId,
        status: ReviewStatus.APPROVED,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.book.update({
      where: { id: existingReview.bookId },
      data: {
        avgRating: aggregates._avg.rating
          ? Number(aggregates._avg.rating.toFixed(1))
          : 5,
        ratingCount: aggregates._count.rating || 0,
      },
    });

    // Ghi nhận Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_REVIEW_STATUS',
          targetType: 'REVIEW',
          targetId: id,
          details: {
            bookTitle: existingReview.book.title,
            reviewer: existingReview.user.fullName,
            oldStatus: existingReview.status,
            newStatus: status,
          },
        },
      });
    } catch (e) {
      console.warn('AuditLog error ignored:', e);
    }

    const statusLabels: Record<string, string> = {
      APPROVED: 'Đã duyệt hiển thị đánh giá thành công!',
      REJECTED: 'Đã ẩn đánh giá vi phạm khỏi trang sách!',
      PENDING: 'Đã chuyển đánh giá về trạng thái chờ duyệt!',
    };

    return NextResponse.json({
      success: true,
      message: statusLabels[status] || 'Cập nhật đánh giá thành công!',
      review: updatedReview,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi cập nhật trạng thái đánh giá.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Xóa vĩnh viễn một đánh giá rác / spam
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasReviewPerm = user.permissions?.includes('MANAGE_REVIEWS');

    if (!isSuperAdmin && !hasReviewPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_REVIEWS để xóa đánh giá.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: { book: true, user: true },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Không tìm thấy đánh giá cần xóa.' },
        { status: 404 }
      );
    }

    // Xóa đánh giá
    await prisma.review.delete({
      where: { id },
    });

    // Cập nhật lại số liệu cho sách
    const aggregates = await prisma.review.aggregate({
      where: {
        bookId: existingReview.bookId,
        status: ReviewStatus.APPROVED,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.book.update({
      where: { id: existingReview.bookId },
      data: {
        avgRating: aggregates._avg.rating
          ? Number(aggregates._avg.rating.toFixed(1))
          : 5,
        ratingCount: aggregates._count.rating || 0,
      },
    });

    // Ghi nhận Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_REVIEW',
          targetType: 'REVIEW',
          targetId: id,
          details: {
            bookTitle: existingReview.book.title,
            reviewer: existingReview.user.fullName,
            rating: existingReview.rating,
            body: existingReview.body,
          },
        },
      });
    } catch (e) {
      console.warn('AuditLog error ignored:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa đánh giá vĩnh viễn khỏi hệ thống!',
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xóa đánh giá.' },
      { status: 500 }
    );
  }
}
