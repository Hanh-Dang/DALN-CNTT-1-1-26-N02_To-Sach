'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Receipt,
  Package,
  FolderTree,
  Users,
  MessageSquareText,
  Ticket,
  BadgeCheck,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminSidebarProps {
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
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({
  user,
  pendingOrdersCount,
  lowStockCount = 3,
  pendingReviewsCount = 5,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const perms = user.permissions || [];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Các nhóm phân hệ chuẩn theo Figma UI đính kèm (media_1790936412693.png)
  const menuGroups = [
    {
      group: 'TỔNG QUAN',
      items: [
        {
          href: '/admin',
          label: 'Dashboard & KPI',
          icon: LayoutGrid,
          allowed: true,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      group: 'BÁN HÀNG & KHO',
      items: [
        {
          href: '/admin/orders',
          label: 'Quản lý Đơn hàng',
          icon: Receipt,
          allowed: isSuperAdmin || perms.includes('MANAGE_ORDERS'),
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} mới` : '12 mới',
          badgeColor: 'bg-[#FEAE2C] text-[#291800]',
        },
        {
          href: '/admin/books',
          label: 'Quản lý Kho Sách',
          icon: Package,
          allowed: isSuperAdmin || perms.includes('MANAGE_BOOKS'),
          badge: lowStockCount > 0 ? `${lowStockCount} sắp hết` : '3 sắp hết',
          badgeColor: 'bg-[#BA1A1A] text-white',
        },
        {
          href: '/admin/categories',
          label: 'Danh mục Sách',
          icon: FolderTree,
          allowed: isSuperAdmin || perms.includes('MANAGE_CATEGORIES'),
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      group: 'KHÁCH HÀNG & NỘI DUNG',
      items: [
        {
          href: '/admin/customers',
          label: 'Khách hàng thành viên',
          icon: Users,
          allowed: isSuperAdmin || perms.includes('MANAGE_USERS'),
          badge: null,
          badgeColor: '',
        },
        {
          href: '/admin/reviews',
          label: 'Đánh giá & Bình luận',
          icon: MessageSquareText,
          allowed: isSuperAdmin || perms.includes('MANAGE_REVIEWS'),
          badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} chờ` : null,
          badgeColor: 'bg-[#182A44] text-slate-400',
        },
      ],
    },
    {
      group: 'HỆ THỐNG',
      items: [
        {
          href: '/admin/promotions',
          label: 'Khuyến mãi & Voucher',
          icon: Ticket,
          allowed: true,
          badge: null,
          badgeColor: '',
        },
        {
          href: '/admin/staff',
          label: 'Phân quyền Nhân viên',
          icon: BadgeCheck,
          allowed: isSuperAdmin,
          badge: null,
          badgeColor: '',
        },
        {
          href: '/admin/settings',
          label: 'Cài đặt hệ thống',
          icon: Settings,
          allowed: isSuperAdmin || perms.includes('VIEW_AUDIT_LOG'),
          badge: null,
          badgeColor: '',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar - Chuẩn Figma UI: fixed left-0 top-0 h-screen w-64 bg-[#0B1F3A] */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0B1F3A] z-50 flex flex-col justify-between overflow-y-auto shadow-[0_12px_30px_-6px_rgba(11,31,58,0.25)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header (Chuẩn 100% theo ảnh Figma media_1790936412693.png) */}
          <div className="px-5 pt-5 pb-3 flex flex-col gap-1 border-b border-white/5">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-2.5">
                {/* Official Gold Bird Nest & Open Book Wings Icon */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <path
                      d="M12 32C17 35 27 35 32 32"
                      stroke="#FEAE2C"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 26C18 29 26 29 30 26"
                      stroke="#FEAE2C"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 14C17 17 12 18 8 16C8 23 15 25 22 25C29 25 36 23 36 16C32 18 27 17 22 14Z"
                      fill="#FEAE2C"
                    />
                    <circle cx="22" cy="13" r="2.5" fill="white" />
                    <path
                      d="M22 15.5V24.5"
                      stroke="#0B1F3A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Brand Text & Slogan */}
                <div className="flex flex-col">
                  <span className="text-white font-bold text-base leading-tight tracking-tight">
                    Tổ Sách
                  </span>
                  <span className="text-[7.5px] font-bold text-[#FEAE2C] uppercase tracking-wider leading-tight mt-0.5 whitespace-nowrap">
                    SÁCH VỀ TỔ, TRI THỨC BAY XA
                  </span>
                </div>
              </Link>

              {/* Badge ADMIN vàng cam */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-[#FEAE2C] text-[#291800] text-[10px] font-bold uppercase tracking-wider">
                  ADMIN
                </span>
                <button
                  onClick={onClose}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
                  aria-label="Đóng menu"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtitle mô tả: Hệ thống Quản trị Vận hành */}
            <p className="text-xs text-slate-400 font-normal mt-2">
              Hệ thống Quản trị Vận hành
            </p>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex flex-col gap-3.5 px-3 py-3">
            {menuGroups.map((group) => (
              <div key={group.group} className="flex flex-col gap-1">
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.group}
                </span>

                {group.items.map((item) => {
                  if (!item.allowed) return null;
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-[#263143] text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-[#263143]/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User Role Status & Actions (media_1790936412693.png) */}
        <div className="px-3 py-3 flex flex-col gap-2 bg-[#0B1F3A] border-t border-white/5">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#263143]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6FFBBE] animate-pulse"></span>
              <span className="text-[11px] text-white uppercase font-bold tracking-wider">
                {isSuperAdmin ? 'SUPER ADMIN ACTIVE' : 'STAFF ACTIVE'}
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <button
              type="button"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hỗ trợ</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
