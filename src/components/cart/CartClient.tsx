'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, 
  ShieldCheck, Truck, PackageCheck, RefreshCw, CheckCircle2, 
  Sparkles, AlertCircle, Bookmark, Check
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { formatVND, calculateDiscount } from '@/lib/utils';
import { BookCard, BookCardData } from '@/components/book/BookCard';

const FREESHIP_THRESHOLD = 150000;
const STANDARD_SHIPPING_FEE = 25000;

interface CartClientProps {
  recommendedBooks?: BookCardData[];
}

export const CartClient: React.FC<CartClientProps> = ({ recommendedBooks = [] }) => {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, isLoaded } = useCart();

  // Trạng thái chọn từng sản phẩm để thanh toán (mặc định chọn tất cả)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Khởi tạo các item được chọn khi nạp xong giỏ hàng
  React.useEffect(() => {
    if (items.length > 0) {
      setSelectedIds((prev) => {
        const next: Record<string, boolean> = { ...prev };
        items.forEach((item) => {
          if (next[item.bookId] === undefined) {
            next[item.bookId] = true;
          }
        });
        return next;
      });
    }
  }, [items]);

  // Danh sách các cuốn được tick chọn
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds[item.bookId] !== false);
  }, [items, selectedIds]);

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

  // Điều kiện Freeship >= 150.000đ
  const isFreeShip = selectedSubtotal >= FREESHIP_THRESHOLD;
  const needMoreForFreeShip = Math.max(0, FREESHIP_THRESHOLD - selectedSubtotal);
  const shippingFee = selectedItems.length === 0 ? 0 : isFreeShip ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = selectedSubtotal + shippingFee;

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const handleToggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    items.forEach((item) => {
      updated[item.bookId] = checked;
    });
    setSelectedIds(updated);
  };

  const handleToggleItem = (bookId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) return;
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
            
            {/* Header select-all bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between text-xs shadow-2xs">
              <label className="flex items-center gap-3 font-bold text-[#0B1F3A] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  className="rounded accent-[#0B1F3A] w-4 h-4 cursor-pointer"
                />
                <span>Chọn tất cả ({items.length} cuốn sách)</span>
              </label>

              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-slate-400">
                  Đã chọn: <strong className="text-[#0B1F3A]">{selectedItems.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa giỏ hàng</span>
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

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map((item) => {
                const isChecked = selectedIds[item.bookId] !== false;
                const discount = calculateDiscount(item.originalPrice, item.price);

                return (
                  <div
                    key={item.bookId}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                      isChecked
                        ? 'border-slate-300 shadow-2xs'
                        : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.bookId)}
                      className="rounded accent-[#0B1F3A] w-4 h-4 cursor-pointer mt-1 sm:mt-0 shrink-0"
                    />

                    {/* Book Thumbnail */}
                    <Link href={`/book/${item.slug}`} className="shrink-0 group">
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    {/* Book Title & Author */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link 
                        href={`/book/${item.slug}`}
                        className="font-bold text-[#0B1F3A] text-sm hover:text-[#F5A623] transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      {item.authorName && (
                        <p className="text-xs text-slate-500">Tác giả: <span className="font-semibold text-slate-700">{item.authorName}</span></p>
                      )}
                      
                      {/* Mobile price row */}
                      <div className="flex items-baseline gap-2 pt-1 sm:hidden">
                        <span className="font-extrabold text-sm text-[#F5A623]">
                          {formatVND(item.price)}
                        </span>
                        {item.originalPrice > item.price && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatVND(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop Unit Price */}
                    <div className="hidden sm:block text-right shrink-0 min-w-[100px]">
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
                    </div>

                    {/* Quantity Stepper */}
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

                    {/* Subtotal Item Line */}
                    <div className="text-right shrink-0 min-w-[100px] hidden sm:block">
                      <span className="font-black text-sm text-[#F5A623]">
                        {formatVND(item.price * item.quantity)}
                      </span>
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
                Chính sách B2C: Miễn phí vận chuyển toàn quốc cho đơn sách từ 150.000đ.
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-sm">
              <h3 className="font-extrabold text-base text-[#0B1F3A] pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <span className="text-xs font-semibold text-slate-400">
                  {selectedItems.length} cuốn
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
                disabled={selectedItems.length === 0}
                onClick={handleProceedCheckout}
                className="w-full bg-[#F5A623] hover:bg-[#e09419] disabled:bg-slate-300 disabled:cursor-not-allowed text-[#0B1F3A] font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
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
