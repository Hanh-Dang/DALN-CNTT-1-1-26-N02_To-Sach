import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics, maskPhonesForStaff } from '@/lib/dashboardMetrics';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [user, metrics] = await Promise.all([
    getCurrentUser(),
    getDashboardMetrics(),
  ]);

  return (
    <AdminDashboardClient
      user={user ? { fullName: user.fullName, role: user.role } : null}
      initialData={maskPhonesForStaff(metrics, user)}
    />
  );
}
