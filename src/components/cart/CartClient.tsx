'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, 
  ShieldCheck, Truck, PackageCheck, RefreshCw, CheckCircle2, 
  Sparkles, AlertCircle, Bookmark, Check, ArrowUpDown, Ticket, Tag, X
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { formatVND, calculateDiscount } from '@/lib/utils';
import { BookCard, BookCardData } from '@/components/book/BookCard';
import { BookCoverImage } from '@/components/book/BookCoverImage';

const FREESHIP_THRESHOLD = 150000;
const STANDARD_SHIPPING_FEE = 25000;

interface CartClientProps {
  recommendedBooks?: BookCardData[];
}

export const CartClient: React.FC<CartClientProps> = ({ recommendedBooks = [] }) => {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, validateCart, isLoaded } = useCart();

  // Trạng thái chọn từng sản phẩm để thanh toán
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [sessionAddedIds, setSessionAddedIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // 🔄 Tự động thẩm định lại tồn kho và giá bán từ Database khi nạp giỏ hàng
  useEffect(() => {
    if (isLoaded && items.length > 0 && validateCart) {
      validateCart();
    }
  }, [isLoaded]);

  // Phân loại sản phẩm còn hàng và hết hàng
  const inStockItems = useMemo(() => items.filter((item) => (item.stockQty || 0) > 0), [items]);
  const outOfStockItems = useMemo(() => items.filter((item) => !item.stockQty || item.stockQty <= 0), [items]);

  // 🌟 Tự động tích chọn những cuốn sách được thêm trong phiên mua sắm hiện tại (Session-Based Selection)
  useEffect(() => {
    if (!isLoaded || items.length === 0) return;

    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem('tosach_session_added');
        if (raw) {
          const sessionAdded: string[] = JSON.parse(raw);
          if (Array.isArray(sessionAdded) && sessionAdded.length > 0) {
            setSessionAddedIds(sessionAdded);
            const nextSelected: Record<string, boolean> = {};
            let hasAnyMatched = false;

            // CHỈ tự động tick chọn nếu cuốn sách còn hàng trong kho
            inStockItems.forEach((item) => {
              if (sessionAdded.includes(item.bookId)) {
                nextSelected[item.bookId] = true;
                hasAnyMatched = true;
              }
            });

            if (hasAnyMatched) {
              setSelectedIds(nextSelected);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [isLoaded, inStockItems]);

  // Trạng thái sắp xếp danh sách giỏ hàng (mặc định: Mới nhất từ trên xuống)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_desc' | 'price_asc'>('newest');

  // Danh sách giỏ hàng sau khi sắp xếp theo tiêu chí đã chọn
  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (sortOrder) {
      case 'newest':
        return list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      case 'oldest':
        return list.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price);
      default:
        return list;
    }
  }, [items, sortOrder]);

  // Danh sách các cuốn sách được tick chọn (CHỈ tính những cuốn còn hàng)
  const selectedItems = useMemo(() => {
    return inStockItems.filter((item) => selectedIds[item.bookId] === true);
  }, [inStockItems, selectedIds]);

  // VOUCHER & KHUYẾN MÃI STATE
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  // Tải danh sách voucher đang khả dụng
  useEffect(() => {
    fetch('/api/vouchers/available')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.vouchers)) {
          setAvailableVouchers(data.vouchers);
        }
      })
      .catch(() => {});
  }, []);

  // Khôi phục voucher từ sessionStorage nếu đã chọn trước đó
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tosach_checkout_voucher');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code) setAppliedVoucher(parsed);
      }
    } catch {}
  }, []);

  // Tính toán tiền hàng và chiết khấu
  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const selectedOriginalTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  }, [selectedItems]);

  const selectedSavings = useMemo(() => {
    return Math.max(0, selectedOriginalTotal - selectedSubtotal);
  }, [selectedOriginalTotal, selectedSubtotal]);

  const voucherDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0;

  // Điều kiện Freeship >= 150.000đ & Phí vận chuyển (CHỈ TÍNH KHI CÓ SẢN PHẨM HỢP LỆ VÀ TIỀN SÁCH > 0)
  const isFreeShip = selectedSubtotal >= FREESHIP_THRESHOLD;
  const needMoreForFreeShip = Math.max(0, FREESHIP_THRESHOLD - selectedSubtotal);
  const shippingFee = (selectedItems.length === 0 || selectedSubtotal === 0) ? 0 : isFreeShip ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = selectedSubtotal === 0 ? 0 : Math.max(0, selectedSubtotal - voucherDiscount) + shippingFee;

  // Thẩm định và áp dụng Voucher
  const handleApplyVoucher = async (codeToUse?: string) => {
    const targetCode = (codeToUse || voucherInput).trim().toUpperCase();
    if (!targetCode) {
      setVoucherError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setVoucherError('');
    setIsApplyingVoucher(true);

    try {
      const res = await fetch('/api/vouchers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode, subtotal: selectedSubtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mã giảm giá không hợp lệ.');
      }

      setAppliedVoucher({
        code: data.voucher.code,
        name: data.voucher.name,
        discountAmount: data.discountAmount,
      });
      setVoucherInput('');
      setShowVoucherList(false);
    } catch (err: any) {
      setVoucherError(err.message || 'Không thể áp dụng voucher.');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    sessionStorage.removeItem('tosach_checkout_voucher');
  };

  // N8: Tự động thẩm định và tính lại voucher khi tạm tính thay đổi
  useEffect(() => {
    if (!appliedVoucher || selectedSubtotal === 0) return;
    let isMounted = true;
    const revalidate = async () => {
      try {
        const res = await fetch('/api/vouchers/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: appliedVoucher.code, subtotal: selectedSubtotal }),
        });
        const data = await res.json();
        if (!isMounted) return;
        // 4.2: Nếu gặp HTTP 429 (Rate Limit do bấm nhanh), không tự động gỡ voucher của khách
        if (res.status === 429) return;
        if (res.ok && data.voucher) {
          setAppliedVoucher((prev) => (prev ? { ...prev, discountAmount: data.discountAmount } : null));
          setVoucherError('');
        } else {
          setAppliedVoucher(null);
          setVoucherError(data.error || 'Giỏ hàng không còn đủ giá trị tối thiểu của mã giảm giá đã chọn.');
          sessionStorage.removeItem('tosach_checkout_voucher');
        }
      } catch {
        // Bỏ qua nếu lỗi mạng tạm thời
      }
    };
    revalidate();
    return () => { isMounted = false; };
  }, [selectedSubtotal, appliedVoucher?.code]);

  // Trạng thái chọn tất cả (chỉ dựa trên danh sách sách còn hàng)
  const allSelected = inStockItems.length > 0 && selectedItems.length === inStockItems.length;

  const handleToggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    inStockItems.forEach((item) => {
      updated[item.bookId] = checked;
    });
    setSelectedIds(updated);
  };

  const handleToggleItem = (bookId: string) => {
    const target = items.find((i) => i.bookId === bookId);
    if (target && (!target.stockQty || target.stockQty <= 0)) return; // Chặn toggle nếu hết hàng
    setSelectedIds((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0 || selectedSubtotal <= 0) return;
    try {
      if (typeof window !== 'undefined') {
        const bookIds = selectedItems.map((i) => i.bookId);
        sessionStorage.setItem('tosach_checkout_selected_ids', JSON.stringify(bookIds));
        if (appliedVoucher) {
          sessionStorage.setItem('tosach_checkout_voucher', JSON.stringify(appliedVoucher));
        } else {
          sessionStorage.removeItem('tosach_checkout_voucher');
        }
      }
    } catch {
      // ignore
    }
    router.push('/checkout');
  };

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#0B1F3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-semibold">Đang tải giỏ hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. CHECKOUT STEPS TRACKER */}
      <div className="max-w-xl mx-auto flex items-center justify-between text-xs font-bold text-slate-400">
        <div className="flex items-center gap-2 text-[#0B1F3A]">
          <span className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-black text-xs shadow-xs">
            1
          </span>
          <span className="font-extrabold text-sm">Giỏ Hàng</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-200 mx-3" />
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center text-xs">
            2
          </span>
          <span className="font-medium">Thanh Toán</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-200 mx-3" />
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center text-xs">
            3
          </span>
          <span className="font-medium">Hoàn Tất</span>
        </div>
      </div>

      {/* 2. MAIN CONTENT (EMPTY CART vs ACTIVE CART) */}
      {items.length === 0 ? (
        /* ================= EMPTY CART STATE ================= */
        <div className="space-y-12">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs">
            <div className="w-24 h-24 rounded-3xl bg-amber-50 text-[#F5A623] mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#0B1F3A]">Giỏ hàng của bạn đang trống</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Bạn chưa thêm cuốn sách nào vào giỏ. Hãy dạo quanh kho tri thức Tổ Sách để tìm tựa sách ưng ý nhé!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-extrabold px-7 py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                <span>Khám phá sách ngay</span>
                <ArrowRight className="w-4 h-4 text-[#F5A623]" />
              </Link>
            </div>
          </div>

          {/* 3 VALUE PILLARS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B1F3A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-[#0B1F3A]">100% Sách Thật Bản Quyền</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Phân phối chính thống từ NXB Trẻ, Kim Đồng, Nhã Nam, Omega Plus.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F5A623] flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5 text-[#0B1F3A]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-[#0B1F3A]">Đóng Gói 3 Lớp Chống Sốc</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Màng co nguyên seal, xốp bóng khí bảo vệ gáy sách phẳng phiu.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-[#0B1F3A]">Đổi Trả Miễn Phí 7 Ngày</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Đổi mới cấp tốc nếu phát hiện lỗi in ấn, rách bìa hoặc thiếu trang.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= ACTIVE CART STATE ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ITEMS LIST & ACTIONS (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Header select-all & sort bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 font-bold text-[#0B1F3A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded accent-[#0B1F3A] w-4 h-4 cursor-pointer"
                  />
                  <span>Chọn tất cả ({items.length} cuốn)</span>
                </label>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="hidden sm:inline text-slate-500 font-medium">
                  Đã chọn: <strong className="text-[#0B1F3A] font-extrabold">{selectedItems.length}</strong>
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
                {/* Sắp xếp giỏ hàng */}
                <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl px-2.5 py-1.5 transition-colors">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Sắp xếp:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent font-bold text-[#0B1F3A] text-xs focus:outline-none cursor-pointer pr-1"
                    aria-label="Sắp xếp danh sách giỏ hàng"
                  >
                    <option value="newest">Mới nhất thêm vào</option>
                    <option value="oldest">Cũ nhất thêm vào</option>
                    <option value="price_desc">Giá: Cao đến thấp</option>
                    <option value="price_asc">Giá: Thấp đến cao</option>
                  </select>
                </div>

                {/* Xóa giỏ hàng */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 py-1.5 px-2 hover:bg-rose-50 rounded-xl cursor-pointer"
                  title="Làm rỗng giỏ hàng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa giỏ</span>
                </button>
              </div>
            </div>

            {/* Modal xác nhận xóa toàn bộ */}
            {showClearConfirm && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Bạn có chắc chắn muốn làm rỗng toàn bộ giỏ hàng không?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-white border border-rose-200 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setShowClearConfirm(false);
                    }}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            )}

            {/* Cảnh báo sách tạm hết hàng trong kho nếu có */}
            {outOfStockItems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 text-xs text-amber-900 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p>
                  Giỏ hàng có <strong>{outOfStockItems.length} cuốn tạm hết hàng trong kho</strong>. Các tựa sách này sẽ tự động không được tính vào thanh toán.
                </p>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              {sortedItems.map((item) => {
                const isOutOfStock = !item.stockQty || item.stockQty <= 0;
                const isChecked = selectedIds[item.bookId] === true && !isOutOfStock;
                const isSessionAdded = sessionAddedIds.includes(item.bookId);
                const discount = calculateDiscount(item.originalPrice, item.price);

                return (
                  <div
                    key={item.bookId}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                      isOutOfStock
                        ? 'border-rose-200/70 bg-rose-50/20 opacity-75'
                        : isChecked
                        ? 'border-slate-300 shadow-2xs'
                        : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Checkbox (Vô hiệu hóa hoàn toàn nếu hết hàng) */}
                    <input
                      type="checkbox"
                      disabled={isOutOfStock}
                      checked={isChecked}
                      onChange={() => !isOutOfStock && handleToggleItem(item.bookId)}
                      className="rounded accent-[#0B1F3A] w-4 h-4 mt-1 sm:mt-0 shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Chọn mua ${item.title}`}
                    />

                    {/* Book Thumbnail */}
                    <Link href={`/book/${item.slug}`} className="shrink-0 group">
                      <BookCoverImage
                        src={item.coverUrl}
                        alt={item.title}
                        className={`w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:scale-105 transition-transform ${
                          isOutOfStock ? 'grayscale-40' : ''
                        }`}
                      />
                    </Link>

                    {/* Book Title & Author */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          href={`/book/${item.slug}`}
                          className="font-bold text-[#0B1F3A] text-sm hover:text-[#F5A623] transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md shrink-0">
                            <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Tạm hết hàng</span>
                          </span>
                        ) : isSessionAdded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-[#F5A623]" />
                            <span>Vừa thêm</span>
                          </span>
                        ) : null}
                      </div>
                      {item.authorName && (
                        <p className="text-xs text-slate-500">Tác giả: <span className="font-semibold text-slate-700">{item.authorName}</span></p>
                      )}
                      
                      {/* Mobile price row */}
                      <div className="flex items-baseline gap-2 pt-1 sm:hidden">
                        {isOutOfStock ? (
                          <>
                            <span className="font-extrabold text-sm text-slate-400 line-through">
                              {formatVND(item.price)}
                            </span>
                            <span className="text-[11px] font-bold text-rose-600">
                              Hết hàng
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-extrabold text-sm text-[#F5A623]">
                              {formatVND(item.price)}
                            </span>
                            {item.originalPrice > item.price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatVND(item.originalPrice)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Desktop Unit Price */}
                    <div className="hidden sm:block text-right shrink-0 min-w-[100px]">
                      {isOutOfStock ? (
                        <>
                          <span className="font-extrabold text-sm text-slate-400 line-through block">
                            {formatVND(item.price)}
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 block mt-0.5">
                            Tạm hết hàng
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-extrabold text-sm text-[#0B1F3A] block">
                            {formatVND(item.price)}
                          </span>
                          {item.originalPrice > item.price && (
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatVND(item.originalPrice)}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                                -{discount}%
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quantity Stepper (hoặc thông báo hết hàng) */}
                    {isOutOfStock ? (
                      <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 shrink-0">
                        0 cuốn
                      </div>
                    ) : (
                      <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden text-xs shrink-0 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                          type="button"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center font-bold text-[#0B1F3A]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQty}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                          type="button"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Subtotal Item Line */}
                    <div className="text-right shrink-0 min-w-[100px] hidden sm:block">
                      {isOutOfStock ? (
                        <span className="font-bold text-xs text-slate-400">
                          0₫ (Hết hàng)
                        </span>
                      ) : (
                        <span className="font-black text-sm text-[#F5A623]">
                          {formatVND(item.price * item.quantity)}
                        </span>
                      )}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.bookId)}
                      className="text-slate-400 hover:text-rose-600 p-2 transition-colors rounded-xl hover:bg-rose-50 cursor-pointer shrink-0"
                      title="Xóa cuốn sách này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Back link */}
            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] hover:text-[#F5A623] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tiếp tục chọn thêm sách khác</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & FREESHIP (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Free Shipping Meter Box */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-950 font-bold">
                <Truck className="w-4 h-4 text-[#F5A623] shrink-0" />
                {isFreeShip ? (
                  <span className="text-emerald-800 font-extrabold">
                    🎉 Đơn hàng đã đủ điều kiện FREESHIP toàn quốc!
                  </span>
                ) : (
                  <span>
                    Mua thêm <strong className="text-[#0B1F3A] font-extrabold">{formatVND(needMoreForFreeShip)}</strong> để được <strong>FREESHIP</strong>
                  </span>
                )}
              </div>

              <div className="w-full bg-amber-200/70 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFreeShip ? 'bg-emerald-600' : 'bg-[#F5A623]'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedSubtotal / FREESHIP_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Chính sách ưu đãi: Miễn phí vận chuyển toàn quốc cho đơn sách từ 150.000đ.
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-sm">
              <h3 className="font-extrabold text-base text-[#0B1F3A] pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <span className="text-xs font-semibold text-slate-400">
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} cuốn
                </span>
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Tạm tính tiền sách:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatVND(selectedSubtotal)}
                  </span>
                </div>

                {selectedSavings > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                    <span>Tiết kiệm giá bìa NXB:</span>
                    <span className="font-extrabold">-{formatVND(selectedSavings)}</span>
                  </div>
                )}

                {/* VOUCHER INPUT BOX IN CART */}
                <div className="pt-2 pb-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#0B1F3A] flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>Mã giảm giá Voucher</span>
                    </span>
                    {availableVouchers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowVoucherList(!showVoucherList)}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {showVoucherList ? 'Ẩn' : `Xem mã (${availableVouchers.length})`}
                      </button>
                    )}
                  </div>

                  {appliedVoucher ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-black text-emerald-900">{appliedVoucher.code}</span>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Giảm: -{formatVND(appliedVoucher.discountAmount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nhập mã voucher..."
                          value={voucherInput}
                          onChange={(e) => {
                            setVoucherInput(e.target.value.toUpperCase());
                            if (voucherError) setVoucherError('');
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isApplyingVoucher || !voucherInput.trim()}
                          onClick={() => handleApplyVoucher()}
                          className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-bold text-xs disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                        >
                          {isApplyingVoucher ? '...' : 'Áp dụng'}
                        </button>
                      </div>

                      {voucherError && (
                        <p className="text-[10px] text-rose-600 font-medium">{voucherError}</p>
                      )}
                    </div>
                  )}

                  {showVoucherList && !appliedVoucher && availableVouchers.length > 0 && (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-52 overflow-y-auto">
                      {availableVouchers.map((av) => {
                        const isEligible = selectedSubtotal >= (av.minOrderValue || 0);
                        const diff = (av.minOrderValue || 0) - selectedSubtotal;

                        return (
                          <div
                            key={av.id}
                            onClick={() => {
                              if (isEligible) handleApplyVoucher(av.code);
                            }}
                            className={`p-2 rounded-xl border transition-all flex items-center justify-between text-[11px] ${
                              isEligible
                                ? 'bg-white border-slate-200 hover:border-[#F5A623] cursor-pointer shadow-2xs'
                                : 'bg-slate-100/70 border-dashed border-slate-300 opacity-60 cursor-not-allowed select-none'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-xs text-[#0B1F3A] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {av.code}
                                </span>
                                <span className="font-bold text-slate-800">{av.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {av.minOrderValue > 0
                                  ? `Đơn tối thiểu ${formatVND(av.minOrderValue)}`
                                  : 'Mọi giá trị đơn hàng'}
                              </div>
                              {!isEligible && (
                                <div className="text-[10px] font-bold text-amber-700">
                                  Mua thêm {formatVND(diff)} để dùng
                                </div>
                              )}
                            </div>

                            {isEligible && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyVoucher(av.code);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[10px] transition-colors cursor-pointer shrink-0 ml-2"
                              >
                                Dùng
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {voucherDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-1 rounded-lg font-semibold">
                    <span>Voucher ({appliedVoucher?.code}):</span>
                    <span className="font-extrabold text-emerald-700">-{formatVND(voucherDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Phí vận chuyển dự kiến:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedItems.length === 0 ? (
                      '0₫'
                    ) : shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        MIỄN PHÍ
                      </span>
                    ) : (
                      formatVND(shippingFee)
                    )}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-black text-sm text-[#0B1F3A]">Tổng thanh toán:</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-[#F5A623] block leading-none">
                      {formatVND(finalTotal)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      (Đã bao gồm thuế VAT)
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                id="btn-cart-proceed-checkout"
                disabled={selectedItems.length === 0 || selectedSubtotal <= 0}
                onClick={handleProceedCheckout}
                className="w-full bg-[#F5A623] hover:bg-[#e09419] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0B1F3A] font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                type="button"
              >
                <span>Tiến Hành Đặt Hàng ({selectedItems.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Badges */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bảo mật đơn hàng & thanh toán 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#0B1F3A] shrink-0" />
                  <span>Kiểm tra sách kỹ lưỡng trước khi nhận hàng (COD)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. RECOMMENDED BOOKS (GỢI Ý TỰA SÁCH NỔI BẬT) */}
      {recommendedBooks.length > 0 && (
        <section className="pt-8 border-t border-slate-200/80 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block">
                Khám phá thêm
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                Gợi Ý Tựa Sách Bạn Có Thể Thích
              </h3>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả danh mục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recommendedBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
