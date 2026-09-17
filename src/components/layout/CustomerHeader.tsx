'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Search, ShoppingBag, User as UserIcon, 
  ChevronDown, Phone, ShieldCheck, Truck, Menu, X, 
  ArrowRight, LogOut, Package, UserCheck, Shield
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'STAFF' | 'SUPER_ADMIN';
  phone?: string | null;
  avatarUrl?: string | null;
  permissions?: string[];
}

export const CustomerHeader: React.FC = () => {
  const router = useRouter();
  const { totalItems, isLoaded } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lấy thông tin user hiện tại từ API Auth
  const fetchUser = useCallback(async (silent = false) => {
    // Chỉ bật loading skeleton ở lần mount đầu tiên nếu chưa có dữ liệu
    if (!silent) {
      setIsLoadingUser(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser(false);

    // Khi có sự kiện auth-change (đăng nhập/đăng xuất), re-fetch ngầm (silent)
    // để không giật chuyển skeleton gây xô lệch header
    const handleAuthChange = () => fetchUser(true);
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [fetchUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  const handleLogout = async () => {
    try {
      // Đóng dropdown ngay lập tức
      setShowUserMenu(false);
      // Optimistic update: chuyển ngay sang trạng thái khách để UI không bị trễ
      setUser(null);
      await fetch('/api/auth/logout', { method: 'POST' });
      // Báo cho CartContext dọn dẹp giỏ hàng
      window.dispatchEvent(new Event('auth-change'));

      // Chỉ điều hướng về trang chủ nếu đang ở các trang yêu cầu đăng nhập
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/account') || path.startsWith('/checkout')) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const isStaffOrAdmin = user && (user.role === 'STAFF' || user.role === 'SUPER_ADMIN');

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      {/* 1. Top Announcement Bar: Cố định chiều cao h-8 để không co giãn giao diện */}
      <div className="bg-[#0B1F3A] text-white text-xs font-medium px-4 h-8 flex items-center overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-200">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
              <span className="truncate">Freeship toàn quốc đơn từ 250k</span>
            </span>
            <span className="hidden md:inline-block text-slate-500">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
              <span>100% Sách thật bản quyền</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 shrink-0">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#F5A623] shrink-0" />
              <span>Hotline: <strong className="text-white font-semibold ml-0.5">1900 6868</strong></span>
            </span>
            
            {isStaffOrAdmin && (
              <>
                <span className="text-slate-500">|</span>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-[#F5A623] hover:text-[#0B1F3A] text-white px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0"
                >
                  <Shield className="w-3 h-3 text-[#F5A623]" />
                  <span>Trang Quản trị</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar: Cố định chiều cao h-16 (64px) chuẩn xác tuyệt đối */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Logo Tổ Sách */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-[#F5A623] shadow-xs group-hover:bg-[#163156] transition-colors shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="shrink-0">
            <span className="text-xl font-black tracking-tight text-[#0B1F3A] block leading-none">
              TỔ SÁCH
            </span>
            <span className="text-[10px] font-semibold text-[#F5A623] uppercase tracking-wider block mt-0.5 leading-none">
              Nhà Sách Trực Tuyến
            </span>
          </div>
        </Link>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center relative h-10">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tựa sách, tác giả, thể loại..."
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 pl-11 pr-24 h-10 rounded-full border border-slate-200 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 outline-hidden transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-semibold px-4 h-7 rounded-full transition-colors flex items-center justify-center"
            >
              Tìm sách
            </button>
          </div>
        </form>

        {/* Action Icons: Tất cả nút con đều dùng chiều cao chuẩn h-9 để không bao giờ xô lệch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-9">
          {/* Nav link Catalog */}
          <Link
            href="/catalog"
            className="hidden lg:inline-flex items-center h-9 px-3 text-xs font-bold text-slate-700 hover:text-[#F5A623] rounded-xl hover:bg-slate-50 transition-colors shrink-0"
          >
            Tất cả sách
          </Link>

          {/* Cart Button: h-9 chuẩn */}
          <Link
            href="/cart"
            className="relative h-9 px-3 rounded-xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors shrink-0 border border-transparent hover:border-slate-200/60"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#0B1F3A]" />
              {isLoaded && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#F5A623] text-[#0B1F3A] font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-800 leading-none">
              Giỏ hàng
            </span>
          </Link>

          {/* User Account / Login Button: Container cố định h-9, min-w-[95px] */}
          <div className="relative flex items-center justify-end h-9 min-w-[95px] shrink-0">
            {isLoadingUser ? (
              // Skeleton đồng bộ kích thước chuẩn với nút Đăng nhập (h-9, w-24)
              <div className="w-24 h-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
            ) : user ? (
              // Nút User đã đăng nhập: h-9 chuẩn
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-9 px-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200/80 flex items-center gap-2 shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[90px] truncate leading-none">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400 font-medium">Đăng nhập với tư cách</p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user.fullName}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-md">
                        {user.role === 'SUPER_ADMIN' ? '👑 Quản Trị Viên' : user.role === 'STAFF' ? '📦 Nhân Viên' : '👤 Khách Hàng'}
                      </span>
                    </div>

                    {isStaffOrAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Bảng điều khiển Quản trị</span>
                      </Link>
                    )}

                    <Link
                      href="/account/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ tài khoản</span>
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Nút Khách vãng lai: h-9 chuẩn
              <Link
                href="/auth"
                className="h-9 px-3.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <UserIcon className="w-4 h-4 text-[#F5A623] shrink-0" />
                <span className="leading-none">Đăng nhập</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle: h-9 w-9 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown (chỉ hiện khi màn hình nhỏ) */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="flex items-center relative h-9">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sách, tác giả..."
            className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-9 pr-16 h-9 rounded-full border border-slate-200 outline-hidden"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#0B1F3A] text-white text-[11px] font-semibold px-3 h-7 rounded-full flex items-center justify-center"
          >
            Tìm
          </button>
        </form>
      </div>
    </header>
  );
};
