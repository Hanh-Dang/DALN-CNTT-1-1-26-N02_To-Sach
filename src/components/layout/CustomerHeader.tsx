'use client';

import React, { useState, useEffect } from 'react';
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
  useEffect(() => {
    async function fetchUser() {
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
    }
    fetchUser();

    window.addEventListener('auth-change', fetchUser);
    return () => {
      window.removeEventListener('auth-change', fetchUser);
    };
  }, []);

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
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setShowUserMenu(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const isStaffOrAdmin = user && (user.role === 'STAFF' || user.role === 'SUPER_ADMIN');

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#0B1F3A] text-white text-xs font-medium py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-200">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#F5A623]" />
              Freeship toàn quốc đơn từ 250.000đ
            </span>
            <span className="hidden md:inline-block text-slate-400">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623]" />
              100% Sách thật có bản quyền
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#F5A623]" />
              Hotline: <strong className="text-white font-semibold ml-0.5">1900 6868</strong>
            </span>
            
            {isStaffOrAdmin && (
              <>
                <span className="text-slate-500">|</span>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-[#F5A623] hover:text-[#0B1F3A] text-white px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                >
                  <Shield className="w-3 h-3 text-[#F5A623]" />
                  <span>Vào trang Quản trị</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Logo Tổ Sách */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-[#F5A623] shadow-sm group-hover:bg-[#163156] transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0B1F3A] block leading-none">
                TỔ SÁCH
              </span>
              <span className="text-[10px] font-semibold text-[#F5A623] uppercase tracking-wider block mt-0.5">
                Nhà Sách Trực Tuyến
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tựa sách, tác giả, thể loại..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 pl-11 pr-24 py-2.5 rounded-full border border-slate-200 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 outline-hidden transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                Tìm sách
              </button>
            </div>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Nav links */}
            <Link
              href="/catalog"
              className="hidden lg:inline-flex text-xs font-bold text-slate-700 hover:text-[#F5A623] px-3 py-2 rounded-lg transition-colors"
            >
              Tất cả sách
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#0B1F3A]" />
                {isLoaded && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F5A623] text-[#0B1F3A] font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-800">
                Giỏ hàng
              </span>
            </Link>

            {/* User Account / Login Button */}
            <div className="relative">
              {isLoadingUser ? (
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200/80"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs font-bold">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Đăng nhập với tư cách</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
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
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-1.5 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                >
                  <UserIcon className="w-4 h-4 text-[#F5A623]" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="flex items-center relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sách, tác giả..."
              className="w-full bg-slate-50 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-20 py-2 rounded-full border border-slate-200 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#0B1F3A] text-white text-xs font-semibold px-3 py-1 rounded-full"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
