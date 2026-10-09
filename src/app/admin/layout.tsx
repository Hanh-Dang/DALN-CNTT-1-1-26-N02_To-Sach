import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal | Tổ Sách B2C',
  description: 'Phân hệ quản trị vận hành kho sách, đơn hàng và danh mục cho Tổ Sách.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Chốt chặn bảo mật Server-side: Bắt buộc STAFF hoặc SUPER_ADMIN
  if (!user || (user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN')) {
    redirect('/auth?redirect=/admin');
  }

  // Đếm và lấy dữ liệu thời gian thực các cảnh báo kho và đơn hàng PENDING
  let pendingOrdersCount = 0;
  let pendingReviewsCount = 0;
  let lowStockList: { id: string; title: string; stockQty: number }[] = [];
  let recentPendingOrders: {
    id: string;
    orderCode: string;
    totalAmount: number;
    customerName: string;
    createdAt: string;
  }[] = [];
  let recentPendingReviews: {
    id: string;
    rating: number;
    body: string;
    userName: string;
    bookTitle: string;
    createdAt: string;
  }[] = [];

  try {
    const [pCount, lBooks, rOrders, revCount, rReviews] = await Promise.all([
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
      prisma.book.findMany({
        where: { stockQty: { lte: 10 }, isActive: true },
        select: { id: true, title: true, stockQty: true },
        orderBy: { stockQty: 'asc' },
        take: 5,
      }),
      prisma.order.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          orderCode: true,
          totalAmount: true,
          customerName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.review.count({
        where: { status: 'PENDING' },
      }),
      prisma.review.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          user: { select: { fullName: true } },
          book: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);
    pendingOrdersCount = pCount;
    pendingReviewsCount = revCount;
    lowStockList = lBooks;
    recentPendingOrders = rOrders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      totalAmount: o.totalAmount,
      customerName: o.customerName,
      createdAt: o.createdAt.toISOString(),
    }));
    recentPendingReviews = rReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      userName: r.user?.fullName || 'Khách hàng',
      bookTitle: r.book?.title || 'Tác phẩm',
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error counting pending orders and reviews:', error);
  }

  return (
    <AdminLayoutShell
      user={{
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        avatarUrl: user.avatarUrl,
      }}
      pendingOrdersCount={pendingOrdersCount}
      lowStockCount={lowStockList.length}
      pendingReviewsCount={pendingReviewsCount}
      lowStockList={lowStockList}
      recentPendingOrders={recentPendingOrders}
      recentPendingReviews={recentPendingReviews}
    >
      {children}
    </AdminLayoutShell>
  );
}
