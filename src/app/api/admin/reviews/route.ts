import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReviewStatus } from '@prisma/client';

/**
 * GET /api/admin/reviews
 * Lấy danh sách đánh giá phục vụ kiểm duyệt của Admin/Staff
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasReviewPerm = user.permissions?.includes('MANAGE_REVIEWS');

    if (!isSuperAdmin && !hasReviewPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_REVIEWS để kiểm duyệt đánh giá.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL'; // ALL | PENDING | APPROVED | REJECTED
    const ratingParam = searchParams.get('rating') || 'ALL'; // ALL | 1..5
    const q = searchParams.get('q') || '';

    const where: any = {};

    if (status !== 'ALL' && Object.values(ReviewStatus).includes(status as ReviewStatus)) {
      where.status = status as ReviewStatus;
    }

    if (ratingParam !== 'ALL') {
      const num = parseInt(ratingParam, 10);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        where.rating = num;
      }
    }

    if (q.trim()) {
      const term = q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { body: { contains: term, mode: 'insensitive' } },
        { book: { title: { contains: term, mode: 'insensitive' } } },
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải danh sách đánh giá.' },
      { status: 500 }
    );
  }
}
