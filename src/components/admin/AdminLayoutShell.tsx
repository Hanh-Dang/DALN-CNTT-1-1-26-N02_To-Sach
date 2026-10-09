'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutShellProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    permissions: string[];
    avatarUrl?: string | null;
  };
  pendingOrdersCount: number;
  lowStockCount?: number;
  pendingReviewsCount?: number;
  lowStockList?: { id: string; title: string; stockQty: number }[];
  recentPendingOrders?: {
    id: string;
    orderCode: string;
    totalAmount: number;
    customerName: string;
    createdAt: string;
  }[];
  recentPendingReviews?: {
    id: string;
    rating: number;
    body: string;
    userName: string;
    bookTitle: string;
    createdAt: string;
  }[];
  children: React.ReactNode;
}

export function AdminLayoutShell({
  user,
  pendingOrdersCount,
  lowStockCount = 3,
  pendingReviewsCount = 0,
  lowStockList = [],
  recentPendingOrders = [],
  recentPendingReviews = [],
  children,
}: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9FF] text-[#111C2D] font-sans antialiased">
      {/* 1. SIDEBAR (w-64) */}
      <AdminSidebar
        user={user}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        pendingReviewsCount={pendingReviewsCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. TOP HEADER (Fixed h-16 left-64) */}
      <AdminHeader
        user={user}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        pendingReviewsCount={pendingReviewsCount}
        lowStockList={lowStockList}
        recentPendingOrders={recentPendingOrders}
        recentPendingReviews={recentPendingReviews}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* 3. MAIN CONTENT (Padding top 16 = 64px, Padding left 64 = 256px on lg) */}
      <main className="lg:pl-64 pt-16 min-h-screen bg-[#F9F9FF]">
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
