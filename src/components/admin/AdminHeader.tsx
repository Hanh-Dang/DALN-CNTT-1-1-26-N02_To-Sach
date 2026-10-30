'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  PlusSquare,
  Store,
  Calendar,
  ChevronDown,
  Check,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import type { MonthlyMetric } from '@/lib/dashboardMetrics';

interface HeaderMonthOption {
  key: string;
  label: string;
  badge: string;
  type: 'current' | 'data' | 'empty';
}

const DEFAULT_HEADER_MONTHS: HeaderMonthOption[] = [
  { key: '2026-11', label: 'Tháng 11/2026', badge: 'Hiện tại · 0đ', type: 'current' },
  { key: '2026-10', label: 'Tháng 10/2026', badge: '383 triệu', type: 'data' },
  { key: '2026-09', label: 'Tháng 09/2026', badge: '1,2 tỷ', type: 'data' },
  { key: '2026-08', label: 'Tháng 08/2026', badge: '893 triệu', type: 'data' },
  { key: '2026-07', label: 'Tháng 07/2026', badge: '6,8 triệu', type: 'data' },
  { key: '2026-06', label: 'Tháng 06/2026', badge: '3,1 triệu', type: 'data' },
  { key: '2026-05', label: 'Tháng 05/2026', badge: 'Chưa mở bán', type: 'empty' },
  { key: '2026-04', label: 'Tháng 04/2026', badge: 'Chưa mở bán', type: 'empty' },
  { key: '2026-03', label: 'Tháng 03/2026', badge: 'Chưa mở bán', type: 'empty' },
  { key: '2026-02', label: 'Tháng 02/2026', badge: 'Chưa mở bán', type: 'empty' },
  { key: '2026-01', label: 'Tháng 01/2026', badge: 'Chưa mở bán', type: 'empty' },
];

function formatRevenueShort(revenue: number): string {
  if (revenue >= 1000000000) {
    return `${(revenue / 1000000000).toFixed(1).replace('.', ',')} tỷ`;
  }
  if (revenue >= 1000000) {
    const millions = revenue / 1000000;
    const formatted = millions >= 10 ? Math.round(millions).toString() : millions.toFixed(1).replace('.', ',');
    return `${formatted} triệu`;
  }
  if (revenue > 0) {
    return `${Math.round(revenue / 1000)}k`;
  }
  return '0đ';
}

function formatHeaderMonthOption(m: MonthlyMetric): HeaderMonthOption {
  if (!m.hasData) {
    if (m.month === 11) {
      return { key: m.key, label: m.label, badge: 'Hiện tại · 0đ', type: 'current' };
    }
    return {
      key: m.key,
      label: m.label,
      badge: m.month < 6 ? 'Chưa mở bán' : '0đ',
      type: 'empty',
    };
  }
  const revText = formatRevenueShort(m.revenue);
  if (m.month === 11) {
    return { key: m.key, label: m.label, badge: `Hiện tại · ${revText}`, type: 'current' };
  }
  return { key: m.key, label: m.label, badge: revText, type: 'data' };
}

interface AdminHeaderProps {
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
  onOpenSidebar: () => void;
}

export function AdminHeader({
  user,
  pendingOrdersCount,
  lowStockCount = 0,
  pendingReviewsCount = 0,
  lowStockList = [],
  recentPendingOrders = [],
  recentPendingReviews = [],
  onOpenSidebar,
}: AdminHeaderProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [monthOptions, setMonthOptions] = useState<HeaderMonthOption[]>(DEFAULT_HEADER_MONTHS);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyMonths = (metrics?: MonthlyMetric[]) => {
      if (!Array.isArray(metrics) || metrics.length === 0) return;
      const synced = metrics
        .filter((m) => m.month <= 11)
        .sort((a, b) => b.month - a.month)
        .map((m) => formatHeaderMonthOption(m));
      if (synced.length > 0) {
        setMonthOptions(synced);
      }
    };

    const cachedMetrics = (window as unknown as { __tosachMonthlyMetrics?: MonthlyMetric[] })
      .__tosachMonthlyMetrics;
    if (cachedMetrics) {
      applyMonths(cachedMetrics);
    }

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setSelectedMonth(customEvent.detail);
      }
    };
    const handleMonthsSync = (e: Event) => {
      const customEvent = e as CustomEvent<MonthlyMetric[]>;
      applyMonths(customEvent.detail);
    };
    window.addEventListener('tosach_admin_month_change', handleSync);
    window.addEventListener('tosach_admin_months_sync', handleMonthsSync);
    return () => {
      window.removeEventListener('tosach_admin_month_change', handleSync);
      window.removeEventListener('tosach_admin_months_sync', handleMonthsSync);
    };
  }, []);

  useEffect(() => {
    if (!isMonthOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMonthOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMonthOpen]);

  const activeMonthOption =
    monthOptions.find((opt) => opt.key === selectedMonth) || monthOptions[0];

  const handleSelectMonth = (key: string) => {
    setSelectedMonth(key);
    setIsMonthOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tosach_admin_month_change', { detail: key }));
    }
  };
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
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          {/* Custom Dropdown Kỳ đối soát mềm mại, chiều rộng vừa khít nút Trigger */}
          <div className="relative" ref={monthDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMonthOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isMonthOpen}
              title="Chọn tháng đối soát doanh thu"
              className={`flex items-center justify-between gap-2 sm:min-w-[235px] lg:min-w-[285px] px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 shadow-2xs ${
                isMonthOpen
                  ? 'bg-white border-[#0B1F3A]/30 ring-2 ring-[#0B1F3A]/15'
                  : 'bg-[#F0F3FF] hover:bg-[#DEE8FF]/80 border-slate-200/90'
              }`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-[#0B1F3A] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500 hidden lg:inline shrink-0">
                  Kỳ đối soát:
                </span>
                <span className="font-bold text-[#0B1F3A] truncate">
                  {activeMonthOption.label}
                </span>
              </span>

              <span className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeMonthOption.type === 'data'
                      ? 'bg-emerald-100/80 text-emerald-800'
                      : activeMonthOption.type === 'current'
                      ? 'bg-amber-100/90 text-amber-800'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {activeMonthOption.badge}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isMonthOpen ? 'rotate-180 text-[#0B1F3A]' : ''
                  }`}
                />
              </span>
            </button>

            {isMonthOpen && (
              <div
                role="listbox"
                aria-label="Danh sách kỳ đối soát"
                className="absolute left-0 right-0 top-full mt-2 w-full min-w-[210px] sm:min-w-0 bg-white rounded-2xl shadow-[0_12px_36px_-8px_rgba(11,31,58,0.18)] border border-slate-200/90 p-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="max-h-[75vh] sm:max-h-[440px] overflow-y-auto space-y-0.5">
                  {monthOptions.map((opt) => {
                    const isSelected = opt.key === selectedMonth;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectMonth(opt.key)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B1F3A] text-white font-bold shadow-xs'
                            : 'text-[#111C2D] hover:bg-[#F0F3FF] font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0 truncate">
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#FEAE2C] shrink-0 stroke-[2.5]" />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-[#FEAE2C] text-[#0B1F3A]'
                              : opt.type === 'data'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : opt.type === 'current'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                              : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* + Nhập sách mới */}
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B1F3A] text-white hover:bg-[#1a3862] transition-colors text-xs font-bold shadow-xs whitespace-nowrap"
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

          {/* Notification Bell Dropdown (Thông báo thông minh có phân cấp & Xóa tất cả) */}
          <NotificationDropdown
            user={user}
            initialPendingOrdersCount={pendingOrdersCount}
            initialLowStockCount={lowStockCount}
            pendingReviewsCount={pendingReviewsCount}
            lowStockList={lowStockList}
            recentPendingOrders={recentPendingOrders}
            recentPendingReviews={recentPendingReviews}
          />

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
