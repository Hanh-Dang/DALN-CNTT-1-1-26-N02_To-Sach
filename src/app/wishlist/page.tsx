'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, ShoppingBag, Trash2, ArrowRight, BookOpen, 
  Check, Star, Sparkles, ArrowLeft 
} from 'lucide-react';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatVND, calculateDiscount } from '@/lib/utils';

export default function WishlistPage() {
  const { items, totalWishlist, removeFromWishlist, clearWishlist, isLoaded } = useWishlist();
  const { addToCart } = useCart();

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [allAdded, setAllAdded] = useState(false);

  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      bookId: item.bookId,
      title: item.title,
      slug: item.slug,
      price: item.price,
      originalPrice: item.originalPrice,
      coverUrl: item.coverUrl,
      authorName: item.authorName,
      stockQty: item.stockQty || 50,
    });

    setAddedIds((prev) => ({ ...prev, [item.bookId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.bookId]: false }));
    }, 1800);
  };

  const handleAddAllToCart = () => {
    if (items.length === 0) return;
    for (const item of items) {
      addToCart({
        bookId: item.bookId,
        title: item.title,
        slug: item.slug,
        price: item.price,
        originalPrice: item.originalPrice,
        coverUrl: item.coverUrl,
        authorName: item.authorName,
        stockQty: item.stockQty || 50,
      });
    }

    setAllAdded(true);
    setTimeout(() => setAllAdded(false), 2200);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#0B1F3A] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#0B1F3A] font-bold">Tủ sách yêu thích</span>
        </nav>

        {/* 2. Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A] tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </span>
              <span>Tủ Sách Yêu Thích Của Tôi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Bạn đang lưu giữ{' '}
              <strong className="text-[#0B1F3A] font-bold">{totalWishlist}</strong>{' '}
              tựa sách tâm đắc
            </p>
          </div>

          {/* Quick Action Buttons */}
          {totalWishlist > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                  allAdded 
                    ? 'bg-emerald-600 text-white shadow-emerald-200' 
                    : 'bg-[#0B1F3A] hover:bg-[#163156] text-white'
                }`}
              >
                {allAdded ? (
                  <>
                    <Check className="w-4 h-4 text-[#F5A623]" />
                    <span>Đã chuyển tất cả vào giỏ hàng!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
                    <span>Chuyển Tất Cả Vào Giỏ Hàng</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ sách khỏi tủ yêu thích?')) {
                    clearWishlist();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                title="Xóa tất cả sách trong danh sách yêu thích"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* 3. Main Content: Grid or Empty State */}
        {!isLoaded ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0B1F3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải tủ sách yêu thích của bạn...</p>
          </div>
        ) : totalWishlist > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((book) => {
              const discount = calculateDiscount(book.originalPrice, book.price);
              const isItemAdded = addedIds[book.bookId];

              return (
                <article
                  key={book.bookId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all group hover:-translate-y-1 relative"
                >
                  <div>
                    {/* Cover image container */}
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 mb-3">
                      <Link href={`/book/${book.slug}`} className="block w-full h-full">
                        <img
                          src={book.coverUrl || '/placeholder-book.jpg'}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Discount badge */}
                      {discount > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-[#F5A623] text-[#0B1F3A] font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          -{discount}%
                        </span>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(book.bookId)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-xs transition-colors"
                        title="Gỡ khỏi yêu thích"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Meta info */}
                    {book.categoryName && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {book.categoryName}
                      </span>
                    )}

                    <Link href={`/book/${book.slug}`}>
                      <h3 className="font-bold text-[#0B1F3A] text-sm line-clamp-2 group-hover:text-[#F5A623] transition-colors leading-snug">
                        {book.title}
                      </h3>
                    </Link>

                    {book.authorName && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {book.authorName}
                      </p>
                    )}

                    {/* Rating if available */}
                    {book.avgRating && (
                      <div className="flex items-center gap-1 text-amber-500 mt-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {book.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Add to cart */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-[#0B1F3A] text-base">
                        {formatVND(book.price)}
                      </span>
                      {book.originalPrice > book.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(book.originalPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(book)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors ${
                        isItemAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0B1F3A] hover:bg-[#163156] text-white'
                      }`}
                    >
                      {isItemAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã thêm vào giỏ!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-[#F5A623]" />
                          <span>Thêm Vào Giỏ</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-lg mx-auto space-y-5 shadow-xs">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center ring-8 ring-rose-50/50">
              <Heart className="w-10 h-10 fill-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="font-black text-[#0B1F3A] text-xl">
                Tủ sách yêu thích của bạn đang trống
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Hãy nhấn vào biểu tượng trái tim ở các tựa sách bạn quan tâm để lưu lại vào tủ sách riêng và theo dõi bất cứ lúc nào!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:gap-3"
              >
                <BookOpen className="w-4 h-4 text-[#F5A623]" />
                <span>Khám Phá Danh Mục Sách Tổ Sách</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
