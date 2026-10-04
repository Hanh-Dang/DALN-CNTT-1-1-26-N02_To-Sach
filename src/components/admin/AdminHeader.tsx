'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  PlusSquare,
  Store,
} from 'lucide-react';

interface AdminHeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    permissions: string[];
    avatarUrl?: string | null;
  };
  pendingOrdersCount: number;
  onOpenSidebar: () => void;
}

export function AdminHeader({
  user,
  pendingOrdersCount,
  onOpenSidebar,
}: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-100">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 lg:hidden border border-slate-200"
          aria-label="Mở menu quản trị"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar (Figma spec: max-w-xl bg-[#F0F3FF]) */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              placeholder="Tìm kiếm mã đơn hàng, tên sách, SKU, tên khách hàng..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F0F3FF] text-xs text-[#111C2D] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all border border-transparent focus:border-slate-300"
            />
          </div>
        </div>

        {/* Right Actions Toolbar (Figma spec) */}
        <div className="flex items-center gap-3 ml-auto">
          {/* + Nhập sách mới */}
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#263143] transition-colors text-xs font-bold shadow-xs whitespace-nowrap"
          >
            <PlusSquare className="w-4 h-4 stroke-[2.2]" />
            <span>+ Nhập sách mới</span>
          </Link>

          {/* Xem trang khách hàng */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F3FF] text-[#111C2D] hover:bg-[#DEE8FF] transition-colors text-xs font-semibold whitespace-nowrap border border-slate-200/60"
          >
            <Store className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Xem trang khách hàng</span>
          </Link>

          {/* Notification Bell */}
          <Link
            href="/admin/orders"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-[#F0F3FF] hover:text-[#0B1F3A] transition-colors"
            title={pendingOrdersCount > 0 ? `${pendingOrdersCount} đơn chờ duyệt` : 'Thông báo'}
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#BA1A1A] ring-2 ring-white"></span>
            )}
          </Link>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-bold text-[#111C2D] truncate max-w-[130px]">
                {user.fullName || 'Nguyễn Minh Triết'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Nhân viên kho'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0B1F3A] to-slate-700 text-white font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shadow-2xs">
              {(user.fullName || 'N').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
