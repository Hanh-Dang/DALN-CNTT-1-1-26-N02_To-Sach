'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CustomerHeader } from './CustomerHeader';
import { CustomerFooter } from './CustomerFooter';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // Nếu đang ở cổng Quản trị Admin: Render giao diện Admin độc lập (không kèm Header/Footer khách hàng)
  if (isAdmin) {
    return <div className="min-h-screen bg-[#F8FAFC] antialiased">{children}</div>;
  }

  // Cổng Khách hàng Storefront thông thường
  return (
    <CartProvider>
      <WishlistProvider>
        <CustomerHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <CustomerFooter />
      </WishlistProvider>
    </CartProvider>
  );
}
