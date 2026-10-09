import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminOrdersClient, AdminOrderData } from '@/components/admin/AdminOrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; q?: string; status?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialOrderCode = (resolvedParams.code || resolvedParams.q || '').trim();
  const initialStatus = (resolvedParams.status || '').trim().toUpperCase();

  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasOrderPerm = user?.permissions?.includes('MANAGE_ORDERS') ?? false;
  const canManageOrders = isSuperAdmin || hasOrderPerm;

  const rawOrders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              publisher: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  const formattedOrders: AdminOrderData[] = rawOrders.map((o) => ({
    id: o.id,
    orderCode: o.orderCode,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    shippingAddress: o.shippingAddress,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    trackingCode: o.trackingCode,
    note: o.note,
    timeline: (Array.isArray(o.timeline) ? o.timeline : []) as any,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      bookTitle: item.bookTitle,
      coverUrl: item.coverUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      book: item.book
        ? {
            id: item.book.id,
            title: item.book.title,
            coverUrl: item.book.coverUrl,
            publisher: item.book.publisher,
          }
        : null,
    })),
    user: o.user
      ? {
          id: o.user.id,
          email: o.user.email,
          fullName: o.user.fullName,
          phone: o.user.phone,
        }
      : null,
  }));

  return (
    <AdminOrdersClient
      initialOrders={formattedOrders}
      canManageOrders={canManageOrders}
      currentUser={user ? { fullName: user.fullName, role: user.role } : null}
      initialOrderCode={initialOrderCode}
      initialStatus={initialStatus}
    />
  );
}
