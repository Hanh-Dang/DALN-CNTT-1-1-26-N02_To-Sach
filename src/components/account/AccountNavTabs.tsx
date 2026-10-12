'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, ShoppingBag, Sparkles } from 'lucide-react';

interface AccountNavTabsProps {
  userName?: string;
}

export function AccountNavTabs({ userName }: AccountNavTabsProps) {
  const pathname = usePathname();
  const isProfile = pathname.startsWith('/account/profile');
  const isOrders = pathname.startsWith('/account/orders');

  return (
    <div className="space-y-6">
      {/* 1. UNIFIED HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
              Tài Khoản Độc Giả
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Sparkles className="w-3 h-3 text-[#F5A623]" />
              Thành viên Tổ Sách
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {userName ? (
              <>
                Xin chào <strong className="text-[#0B1F3A]">{userName}</strong>, quản lý thông tin bảo mật và lịch sử đơn mua tại đây.
              </>
            ) : (
              'Quản lý thông tin bảo mật, ảnh đại diện và theo dõi hành trình đơn hàng của bạn.'
            )}
          </p>
        </div>

        {/* Action Button - Unified & Constant */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs transition-colors shadow-2xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
            <span>Khám phá sách mới</span>
          </Link>
        </div>
      </div>

      {/* 2. UNIFIED PERSISTENT NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs flex items-center gap-1.5 w-full sm:w-fit">
        <Link
          href="/account/profile"
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial select-none ${
            isProfile
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70'
          }`}
        >
          <User className={`w-4 h-4 ${isProfile ? 'text-[#F5A623]' : 'text-slate-400'}`} />
          <span>Hồ sơ cá nhân</span>
        </Link>
        <Link
          href="/account/orders"
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial select-none ${
            isOrders
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70'
          }`}
        >
          <Package className={`w-4 h-4 ${isOrders ? 'text-[#F5A623]' : 'text-slate-400'}`} />
          <span>Lịch sử đơn mua</span>
        </Link>
      </div>
    </div>
  );
}
