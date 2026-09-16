'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { formatVND, calculateDiscount } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export interface BookCardData {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number;
  coverUrl: string;
  avgRating: number;
  ratingCount: number;
  stockQty: number;
  soldCount?: number;
  isBestseller?: boolean;
  isNew?: boolean;
  authors?: Array<{
    author: {
      id: string;
      name: string;
    };
  }>;
  categories?: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

interface BookCardProps {
  book: BookCardData;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const discountPercent = calculateDiscount(book.originalPrice, book.price);
  const authorName = book.authors && book.authors.length > 0 
    ? book.authors.map((a) => a.author.name).join(', ') 
    : 'Tổ Sách Tuyển Chọn';
  const categoryName = book.categories && book.categories.length > 0
    ? book.categories[0].category.name
    : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      price: book.price,
      originalPrice: book.originalPrice,
      coverUrl: book.coverUrl,
      authorName,
      stockQty: book.stockQty,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative h-full">
      {/* 1. Cover Image Container */}
      <Link href={`/book/${book.slug}`} className="relative aspect-[3/4] bg-slate-50 overflow-hidden block">
        <img
          src={book.coverUrl || '/placeholder-book.jpg'}
          alt={book.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            // Fallback image nếu link ảnh lỗi
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="bg-[#F5A623] text-[#0B1F3A] font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {book.isBestseller && (
            <span className="bg-[#0B1F3A] text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              Bán chạy
            </span>
          )}
          {book.isNew && (
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              Mới lên kệ
            </span>
          )}
        </div>

        {/* Quick Add to Cart button on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            onClick={handleQuickAdd}
            disabled={book.stockQty <= 0}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all ${
              book.stockQty <= 0
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0B1F3A] hover:bg-[#163156] text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã thêm vào giỏ!</span>
              </>
            ) : book.stockQty <= 0 ? (
              <span>Tạm hết hàng</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Thêm vào giỏ</span>
              </>
            )}
          </button>
        </div>
      </Link>

      {/* 2. Book Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {categoryName && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {categoryName}
            </span>
          )}

          <Link href={`/book/${book.slug}`}>
            <h3 className="font-bold text-[#0B1F3A] text-sm sm:text-[15px] line-clamp-2 group-hover:text-[#F5A623] transition-colors leading-snug">
              {book.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {authorName}
          </p>
        </div>

        <div>
          {/* Rating & Sold count */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="text-xs font-bold text-slate-700">
                {book.avgRating > 0 ? book.avgRating.toFixed(1) : '5.0'}
              </span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-[11px] text-slate-400">
              {book.soldCount && book.soldCount > 0 ? `Đã bán ${book.soldCount}` : 'Mới phát hành'}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100">
            <span className="text-base sm:text-lg font-black text-[#0B1F3A]">
              {formatVND(book.price)}
            </span>
            {book.originalPrice > book.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatVND(book.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
