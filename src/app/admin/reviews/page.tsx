import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  AdminReviewsClient,
  AdminReviewData,
} from '@/components/admin/AdminReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasReviewPerm = user?.permissions?.includes('MANAGE_REVIEWS') ?? false;
  const canManageReviews = isSuperAdmin || hasReviewPerm;

  // Truy vấn toàn bộ danh sách reviews từ Supabase DB
  const rawReviews = await prisma.review.findMany({
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

  const reviews: AdminReviewData[] = rawReviews.map((r) => ({
    id: r.id,
    bookId: r.bookId,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    status: r.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    createdAt: r.createdAt.toISOString(),
    book: {
      id: r.book.id,
      title: r.book.title,
      slug: r.book.slug,
      coverUrl: r.book.coverUrl,
      price: r.book.price,
      avgRating: r.book.avgRating,
    },
    user: {
      id: r.user.id,
      fullName: r.user.fullName,
      email: r.user.email,
      avatarUrl: r.user.avatarUrl,
    },
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AdminReviewsClient
        initialReviews={reviews}
        canManageReviews={canManageReviews}
        currentUser={
          user
            ? {
                fullName: user.fullName,
                role: user.role,
              }
            : null
        }
      />
    </div>
  );
}
