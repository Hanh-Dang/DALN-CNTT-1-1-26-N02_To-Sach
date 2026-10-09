import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AdminSettingsClient, AuditLogItem } from '@/components/admin/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/admin/settings');
  }

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const hasAuditPerm = user.permissions?.includes('VIEW_AUDIT_LOG') ?? false;

  if (!isSuperAdmin && !hasAuditPerm) {
    redirect('/admin');
  }

  const rawLogs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const formattedLogs: AuditLogItem[] = rawLogs.map((l) => ({
    id: l.id,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    details: l.details,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
    user: {
      fullName: l.user.fullName,
      email: l.user.email,
      role: l.user.role,
    },
  }));

  const systemInfo = {
    nodeVersion: process.version,
    nextVersion: 'Next.js 16 (App Router)',
    database: 'PostgreSQL 15 (Supabase Cloud Singapore)',
    architecture: 'Layered Modular Monolith (4-Tier)',
    environment: process.env.NODE_ENV || 'development',
  };

  return <AdminSettingsClient initialAuditLogs={formattedLogs} systemInfo={systemInfo} />;
}
