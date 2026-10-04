'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BookOpen, Search, ShoppingBag, Heart, User as UserIcon, 
  ChevronDown, Phone, ShieldCheck, Truck, Menu, X, 
  ArrowRight, LogOut, Package, UserCheck, Shield,
  SlidersHorizontal, Flame, Sparkles, Layers, ChevronRight,
  Loader2
} from 'lucide-react';
import { ToSachLogo } from '@/components/brand/ToSachLogo';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatVND } from '@/lib/utils';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'STAFF' | 'SUPER_ADMIN';
  phone?: string | null;
  avatarUrl?: string | null;
  permissions?: string[];
}

// Nội dung thông báo chạy ticker liên tục từ TRÁI SANG PHẢI (không bị ngắt quãng)
// Loại bỏ hoàn toàn voucher/khuyến mại nhập mã theo đúng tài liệu dự án B2C,
// tập trung 100% vào cam kết chất lượng, vận chuyển và giá bìa chiết khấu trực tiếp
const TICKER_ITEMS = [
  { icon: '🚚', text: 'Miễn phí vận chuyển toàn quốc cho mọi đơn sách từ 150.000đ' },
  { icon: '📖', text: '100% Sách thật có bản quyền từ NXB Trẻ, Kim Đồng, Nhã Nam, Omega Plus' },
  { icon: '🔄', text: 'Đổi trả miễn phí trong 7 ngày nếu có bất kỳ lỗi in ấn từ nhà xuất bản' },
  { icon: '📦', text: 'Đóng gói tiêu chuẩn 3 lớp chống sốc, màng bọc bóng khí bảo vệ sách nguyên vẹn' },
  { icon: '⚡', text: 'Giao hàng hỏa tốc toàn quốc từ 24 - 48 giờ làm việc' },
  { icon: '🛡️', text: 'Tổ Sách cam kết hoàn tiền 200% nếu phát hiện sách giả, sách lậu' },
  { icon: '🏷️', text: 'Chiết khấu trực tiếp tới 40% trên giá bìa niêm yết cho bạn đọc' },
  { icon: '📞', text: 'Hotline hỗ trợ độc giả 24/7: 1900 6868' },
  { icon: '🌿', text: 'Kho tri thức hơn 150.000 tựa sách phong phú luôn sẵn sàng phục vụ' },
];

// Cây danh mục chuẩn đồng bộ 100% theo Database Supabase / Prisma
const CATEGORY_TREE = [
  {
    name: 'Văn Học',
    slug: 'van-hoc',
    icon: '📖',
    subs: [
      { name: 'Tiểu thuyết Việt Nam', slug: 'tieu-thuyet-vn' },
      { name: 'Tiểu thuyết Nước ngoài', slug: 'tieu-thuyet-nuoc-ngoai' },
      { name: 'Trinh Thám & Kinh Dị', slug: 'trinh-tham-kinh-di' },
      { name: 'Trinh thám Nhật Bản (Honkaku)', slug: 'trinh-tham-nhat-ban' },
    ],
  },
  {
    name: 'Kinh Tế & Kỹ Năng',
    slug: 'kinh-te-ky-nang',
    icon: '📈',
    subs: [
      { name: 'Tài Chính & Đầu Tư', slug: 'tai-chinh-dau-tu' },
      { name: 'Quản lý tài chính cá nhân', slug: 'tai-chinh-ca-nhan' },
    ],
  },
  {
    name: 'Công Nghệ & Lập Trình',
    slug: 'cong-nghe-lap-trinh',
    icon: '💻',
    subs: [
      { name: 'Lập Trình Phần Mềm', slug: 'lap-trinh-phan-mem' },
      { name: 'Python & Khoa học Dữ liệu', slug: 'python-data-science' },
      { name: 'Hệ Thống & Bảo Mật', slug: 'he-thong-bao-mat' },
    ],
  },
  {
    name: 'Lịch Sử & Văn Hóa',
    slug: 'lich-su-van-hoa',
    icon: '🏛️',
    subs: [
      { name: 'Lịch sử nhân loại', slug: 'lich-su-van-hoa' },
    ],
  },
  {
    name: 'Tâm Lý & Triết Học',
    slug: 'tam-ly-triet-hoc',
    icon: '🧠',
    subs: [
      { name: 'Tâm lý học ứng dụng', slug: 'tam-ly-triet-hoc' },
    ],
  },
  {
    name: 'Thiếu Nhi & Truyện Tranh',
    slug: 'thieu-nhi',
    icon: '✨',
    subs: [
      { name: 'Văn học thiếu nhi', slug: 'thieu-nhi' },
    ],
  },
];

export const CustomerHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, isLoaded } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    originalPrice: number;
    coverUrl: string;
    soldCount: number;
    authorName: string;
    categoryName: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { totalWishlist, isLoaded: isWishlistLoaded } = useWishlist();

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const POPULAR_SEARCHES = [
    'Tâm lý học',
    'Nhà Giả Kim',
    'Tâm Lý Học Về Tiền',
    'Sapiens',
    'Cây Chuối Non',
    'Lập Trình Python',
    'Án Mạng Mười Một Chữ',
  ];

  // Tìm kiếm tức thì khi gõ từ khóa (Live search debounce)
  useEffect(() => {
    let isMounted = true;
    if (!searchQuery.trim()) {
      fetch('/api/books/search')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data?.books) {
            setSearchResults(data.books);
          }
        })
        .catch(() => {});
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/books/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            setSearchResults(data?.books || []);
          }
        })
        .catch(() => {
          if (isMounted) setSearchResults([]);
        })
        .finally(() => {
          if (isMounted) setIsSearching(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (keyword: string) => {
    setSearchQuery(keyword);
    setIsSearchFocused(false);
    router.push(`/catalog?q=${encodeURIComponent(keyword)}`);
  };

  // Xác định trang hiện tại để kích hoạt nút pill trắng đúng như thiết kế Figma
  const isHome = pathname === '/';
  const isCatalog = pathname.startsWith('/catalog');

  // Lấy thông tin user hiện tại từ API Auth
  const fetchUser = useCallback(async (silent = false) => {
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

    const handleAuthChange = () => fetchUser(true);
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [fetchUser]);

  // Đóng user menu & search suggestions khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      setShowUserMenu(false);
      setUser(null);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.dispatchEvent(new Event('auth-change'));

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
    <header className="w-full sticky top-0 z-50 shadow-md select-none">
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT BAR (Chạy liên tục từ TRÁI SANG PHẢI, không ngắt quãng) */}
      {/* ========================================================================= */}
      <div className="bg-[#E8F0FE] text-[#111C2D] text-xs font-medium h-8 flex items-center border-b border-blue-100/80 overflow-hidden relative">
        <div className="w-full flex items-center overflow-hidden">
          {/* Track chạy vô tận từ Trái sang Phải: Lặp lại danh sách để nối liền mượt mà */}
          <div className="animate-marquee-ltr flex items-center gap-10 whitespace-nowrap text-[11px] text-slate-800 font-medium">
            {/* Bộ 1 */}
            {TICKER_ITEMS.map((item, idx) => (
              <span key={`t1-${idx}`} className="inline-flex items-center gap-1.5 shrink-0">
                <span>{item.icon}</span>
                <span>{item.text}</span>
                <span className="text-slate-300 ml-4">•</span>
              </span>
            ))}
            {/* Bộ 2 (Nhân đôi để nối liền không vết cắt) */}
            {TICKER_ITEMS.map((item, idx) => (
              <span key={`t2-${idx}`} className="inline-flex items-center gap-1.5 shrink-0">
                <span>{item.icon}</span>
                <span>{item.text}</span>
                <span className="text-slate-300 ml-4">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN NAVIGATION BAR (Chuẩn Figma UI: Nền #0B1F3A, Chiều cao h-20 80px) */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1F3A] text-white px-4 h-20 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* CỘT 1 (BÊN TRÁI): Logo Thương Hiệu Tổ Sách */}
          <div className="w-[220px] lg:w-[240px] shrink-0 flex items-center">
            <Link href="/" className="group shrink-0">
              <ToSachLogo 
                size={40} 
                withText={true}
                textClassName="text-xl font-black tracking-tight text-white block leading-none group-hover:text-[#F5A623] transition-colors"
                sloganClassName="text-[9px] font-bold text-[#F5A623] uppercase tracking-wider block mt-1 leading-none group-hover:text-white transition-colors"
              />
            </Link>
          </div>

          {/* CỘT 2 (Ở GIỮA): Menu Trang chủ & Danh mục (Đã bỏ Tất cả sách theo yêu cầu) */}
          <nav className="hidden md:flex items-center justify-center gap-3 lg:gap-5 shrink-0">
            {/* Nút Trang Chủ: Pill trắng khi ở trang chủ, link mờ khi ở trang khác */}
            <Link
              href="/"
              className={`rounded-xl px-4 py-2 text-xs font-extrabold inline-flex items-center justify-center h-10 transition-colors shrink-0 ${
                isHome
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Trang chủ
            </Link>

            {/* Nút Danh Mục: Pill trắng khi ở catalog, hover thả Mega Menu, click dẫn vào /catalog */}
            <div 
              className="relative"
              onMouseEnter={() => setShowMegaMenu(true)}
            >
              <Link
                href="/catalog"
                className={`rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 h-10 transition-colors shrink-0 ${
                  isCatalog || showMegaMenu
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className={`w-4 h-4 ${isCatalog || showMegaMenu ? 'text-[#0B1F3A]' : 'text-[#F5A623]'}`} />
                <span>Danh mục sách</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </nav>

          {/* CỘT 3 (BÊN PHẢI): Ô tìm kiếm + Wishlist + Giỏ hàng + Cố định Khung Tài khoản */}
          <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3.5">
            {/* Ô tìm kiếm dạng pill bo tròn trắng: Bên trái KHÔNG CÒN ICON, icon Search chuyển sang bên phải (thay thế dấu mũi tên) */}
            <div ref={searchContainerRef} className="relative shrink-0">
              <form onSubmit={handleSearch} className="relative flex items-center bg-white rounded-full h-9 pl-3.5 pr-1.5 w-48 sm:w-60 md:w-72 lg:w-80 shadow-inner shrink-0 transition-all border border-transparent focus-within:border-[#F5A623]">
                {/* INPUT BÊN TRÁI SẠCH SẼ, KHÔNG CÒN ICON TÌM KIẾM */}
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sách, tác giả, thể loại..."
                  className="w-full min-w-0 bg-transparent py-1 text-xs text-slate-800 placeholder-slate-400 outline-none"
                />

                {/* Nút Xóa nhanh khi có từ khóa */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors mr-1 shrink-0"
                    title="Xóa từ khóa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* ICON TÌM KIẾM ĐÃ CHUYỂN SANG BÊN PHẢI (THAY CHO DẤU MŨI TÊN) */}
                <button
                  type="submit"
                  title="Tìm kiếm"
                  className="w-7 h-7 rounded-full bg-[#0B1F3A] hover:bg-[#F5A623] text-white hover:text-[#0B1F3A] flex items-center justify-center transition-all shrink-0 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>

              {/* Popup gợi ý sách liên quan trực tiếp khi gõ từ khóa & sách hot khi chưa gõ */}
              {isSearchFocused && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[460px] overflow-y-auto">
                  {/* Trạng thái 1: Người dùng đã gõ từ khóa -> Hiện danh sách sách liên quan nhất */}
                  {searchQuery.trim() ? (
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Sách liên quan nhất
                        </span>
                        {isSearching ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                            <span>Đang tìm...</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {searchResults.length} kết quả
                          </span>
                        )}
                      </div>

                      {searchResults.length > 0 ? (
                        <div className="space-y-1.5">
                          {searchResults.slice(0, 5).map((book) => (
                            <Link
                              key={book.id}
                              href={`/books/${book.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F3FF] transition-colors group"
                            >
                              <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 relative bg-slate-100 border border-slate-200 shadow-2xs">
                                <img
                                  src={book.coverUrl}
                                  alt={book.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {book.authorName} • <span className="text-slate-500">{book.categoryName}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-[#0B1F3A]">
                                    {formatVND(book.price)}
                                  </span>
                                  {book.originalPrice > book.price && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {formatVND(book.originalPrice)}
                                    </span>
                                  )}
                                  {book.soldCount > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-semibold ml-auto">
                                      Đã bán {book.soldCount.toLocaleString('vi-VN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}

                          <button
                            type="button"
                            onClick={(e) => handleSearch(e)}
                            className="w-full pt-2.5 pb-1 border-t border-slate-100 text-xs font-bold text-[#0B1F3A] hover:text-amber-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Xem tất cả kết quả cho &quot;{searchQuery}&quot;</span>
                            <span className="text-amber-500 font-bold">→</span>
                          </button>
                        </div>
                      ) : !isSearching ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">Chưa tìm thấy sách phù hợp với &quot;{searchQuery}&quot;</p>
                          <p className="text-[11px] text-slate-400 mt-1">Hãy thử tìm theo tên tác giả hoặc thể loại</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    /* Trạng thái 2: Ô tìm kiếm trống -> Hiện gợi ý từ khóa hot & sách nổi bật */
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sách được quan tâm nhiều nhất</span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {searchResults.slice(0, 3).map((book) => (
                          <Link
                            key={book.id}
                            href={`/books/${book.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#F0F3FF] transition-colors group"
                          >
                            <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0 relative bg-slate-100 border border-slate-200">
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                                {book.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {book.authorName} • <span className="text-slate-500">{book.categoryName}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-[#0B1F3A]">
                                  {formatVND(book.price)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Từ khóa tìm kiếm hot:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {POPULAR_SEARCHES.map((keyword) => (
                            <button
                              key={keyword}
                              type="button"
                              onClick={() => handleSelectSuggestion(keyword)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#0B1F3A] hover:text-white text-slate-700 text-xs font-medium transition-colors text-left"
                            >
                              {keyword}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Icon Wishlist (Sách yêu thích) */}
            <Link
              href="/wishlist"
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 transition-colors shrink-0 group"
              title="Tủ sách yêu thích"
            >
              <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${totalWishlist > 0 ? 'text-rose-400 fill-rose-400' : 'text-slate-200'}`} />
              {isWishlistLoaded && totalWishlist > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white font-black text-[10px] flex items-center justify-center rounded-full shadow-xs">
                  {totalWishlist > 99 ? '99+' : totalWishlist}
                </span>
              )}
            </Link>

            {/* Icon Giỏ Hàng (kết nối CartContext) */}
            <Link
              href="/cart"
              id="header-cart-icon"
              data-cart-icon
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Giỏ hàng Tổ Sách"
            >
              <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
              {isLoaded && totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#0B1F3A] font-black text-[10px] flex items-center justify-center rounded-full shadow-xs">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Vạch kẻ phân cách thanh mảnh */}
            <div className="h-6 w-px bg-slate-700/80 shrink-0 hidden sm:block"></div>

            {/* Khung Tài khoản / Đăng nhập: Cố định chiều rộng w-[130px] hoặc w-[145px] để ZERO layout shift */}
            <div ref={userMenuRef} className="w-[125px] sm:w-[145px] shrink-0 flex items-center justify-end h-10 relative">
              {isLoadingUser ? (
                <div className="w-24 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 py-1 px-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    {/* Avatar bo tròn viền vàng #F5A623 */}
                    <div className="w-8 h-8 rounded-full bg-[#F5A623] text-[#0B1F3A] flex items-center justify-center text-xs font-black ring-2 ring-[#F5A623]/80 shadow-xs shrink-0">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-white max-w-[70px] truncate leading-none">
                      {user.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>

                  {/* Dropdown Menu tài khoản */}
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
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
                /* Nút Đăng nhập cho khách vãng lai dạng pill nổi bật */
                <Link
                  href="/auth"
                  className="h-8 px-3.5 sm:px-4 rounded-full bg-[#F5A623] hover:bg-[#e09419] text-[#0B1F3A] text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all shrink-0 whitespace-nowrap"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#0B1F3A]" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 shrink-0"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION BAR (Dải Danh Mục Ngành Hàng Dưới Header - h-11 44px)   */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200/80 shadow-[0_1px_6px_rgba(0,0,0,0.03)] h-11 flex items-center relative">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-medium">
            {/* Nút "Tất cả danh mục" dạng pill: Click dẫn sang /catalog, Hover mở Mega menu */}
            <Link
              href="/catalog"
              onMouseEnter={() => setShowMegaMenu(true)}
              className="bg-blue-50 hover:bg-blue-100 text-[#0B1F3A] font-bold rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 border border-blue-100"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0B1F3A]" />
              <span>Tất cả danh mục</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
            </Link>

            {/* Các ngành hàng chính chuyển tiếp trực tiếp sang Catalog kèm bộ lọc */}
            <Link
              href="/catalog?category=van-hoc"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Văn học Việt Nam
            </Link>

            <Link
              href="/catalog?category=kinh-te-ky-nang"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Kinh tế - Khởi nghiệp
            </Link>

            <Link
              href="/catalog?category=ky-nang-song"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Phát triển bản thân
            </Link>

            <Link
              href="/catalog?category=tam-ly-triet-hoc"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Tâm lý học
            </Link>

            <Link
              href="/catalog?category=manga"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Truyện tranh - Manga
            </Link>

            <Link
              href="/catalog?category=ngoai-van"
              className="text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100/80 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
            >
              Sách Ngoại văn
            </Link>

            <Link
              href="/catalog?sort=bestseller"
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 font-bold"
            >
              <Flame className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Sách Bán Chạy</span>
            </Link>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* MEGA MENU: Hiển thị khi hover/click vào "Danh mục" hoặc "Tất cả danh mục" */}
        {/* ========================================================================= */}
        {showMegaMenu && (
          <div 
            ref={megaMenuRef}
            onMouseLeave={() => setShowMegaMenu(false)}
            className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CATEGORY_TREE.map((cat) => (
                  <div key={cat.slug} className="space-y-3">
                    <Link
                      href={`/catalog?category=${cat.slug}`}
                      onClick={() => setShowMegaMenu(false)}
                      className="font-bold text-sm text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-2 group transition-colors pb-1 border-b border-slate-100"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#F5A623]" />
                    </Link>
                    <ul className="space-y-2 text-xs">
                      {cat.subs.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            href={`/catalog?category=${sub.slug}`}
                            onClick={() => setShowMegaMenu(false)}
                            className="text-slate-600 hover:text-[#0B1F3A] hover:font-bold transition-colors block py-0.5"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Dải chân trang Mega Menu */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Hơn <strong>150.000+ tựa sách chính hãng</strong> từ các NXB uy tín. Đầy đủ bộ lọc tại trang Catalog.
                </span>
                <Link
                  href="/catalog"
                  onClick={() => setShowMegaMenu(false)}
                  className="font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1.5 transition-colors group"
                >
                  <span>Mở toàn bộ Bộ Lọc & Tìm Kiếm Chi Tiết</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 text-xs shadow-lg animate-in slide-in-from-top-4 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-bold text-[#0B1F3A] border-b border-slate-100"
          >
            Trang chủ
          </Link>
          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-semibold text-slate-700 border-b border-slate-100 flex items-center justify-between"
          >
            <span>Danh mục sách</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-semibold text-slate-700 border-b border-slate-100 flex items-center justify-between"
          >
            <span>Giỏ hàng</span>
            <span className="bg-[#F5A623] text-[#0B1F3A] font-bold px-2 py-0.5 rounded-full text-[10px]">
              {totalItems}
            </span>
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-semibold text-slate-700 border-b border-slate-100 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Sách yêu thích</span>
            </span>
            <span className="bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {totalWishlist}
            </span>
          </Link>
          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-[11px] text-slate-400">Đang đăng nhập: <strong>{user.fullName}</strong></p>
              {isStaffOrAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 font-bold text-emerald-700"
                >
                  Bảng Quản trị
                </Link>
              )}
              <Link
                href="/account/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 font-semibold text-slate-700"
              >
                Đơn hàng của tôi
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-1.5 font-semibold text-rose-600"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 font-bold text-center bg-[#F5A623] text-[#0B1F3A] rounded-xl mt-2"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      )}

    </header>
  );
};


