import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { AdminPromotionsClient } from '@/components/admin/AdminPromotionsClient';
import { getVoucherDisplayStatus } from '@/lib/voucher';

export const dynamic = 'force-dynamic';

export default async function AdminPromotionsPage() {
  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const [rawVouchers, rawEvents] = await Promise.all([
    prisma.voucher.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            startsAt: true,
            endsAt: true,
          },
        },
        _count: {
          select: { usages: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.promotionEvent.findMany({
      include: {
        _count: {
          select: { vouchers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Serialize dates and compute status
  const vouchers = rawVouchers.map((v: any) => {
    const statusInfo = getVoucherDisplayStatus(v);
    return {
      id: v.id,
      code: v.code,
      name: v.name,
      description: v.description,
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount,
      minOrderValue: v.minOrderValue,
      startsAt: v.startsAt ? v.startsAt.toISOString() : null,
      endsAt: v.endsAt ? v.endsAt.toISOString() : null,
      usageLimit: v.usageLimit,
      usedCount: v.usedCount,
      perUserLimit: v.perUserLimit,
      isActive: v.isActive,
      eventId: v.eventId,
      createdAt: v.createdAt.toISOString(),
      event: v.event
        ? {
            id: v.event.id,
            name: v.event.name,
            slug: v.event.slug,
            isActive: v.event.isActive,
            startsAt: v.event.startsAt.toISOString(),
            endsAt: v.event.endsAt.toISOString(),
          }
        : null,
      _count: v._count,
      computedStatus: statusInfo.status,
      statusLabel: statusInfo.label,
      statusColorClass: statusInfo.colorClass,
    };
  });

  const events = rawEvents.map((e: any) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    description: e.description,
    bannerUrl: e.bannerUrl,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    isActive: e.isActive,
    createdAt: e.createdAt.toISOString(),
    _count: e._count,
  }));

  return (
    <div className="space-y-6">
      <AdminPromotionsClient
        initialVouchers={vouchers}
        initialEvents={events}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
