'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Check, Star, PackageCheck } from 'lucide-react';
import { formatVND, calculateDiscount } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export interface CatalogBookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  publisher: string;
  price: number;
  originalPrice: number;
  coverUrl: string;
  rating: number;
  ratingCount: number;
  inStock: boolean;
  categorySlug?: string;
  tag?: string;
}

interface CatalogBookCardProps {
  book: CatalogBookItem;
  viewMode?: 'grid' | 'list';
}

export const CatalogBookCard: React.FC<CatalogBookCardProps> = ({ book, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = isWishlisted(book.id);
  const discountPercent = calculateDiscount(book.originalPrice, book.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      price: book.price,
      originalPrice: book.originalPrice,
      coverUrl: book.coverUrl,
      authorName: book.author,
      stockQty: book.inStock ? 50 : 0,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      price: book.price,
      originalPrice: book.originalPrice,
      coverUrl: book.coverUrl,
      authorName: book.author,
      publisher: book.publisher,
      stockQty: book.inStock ? 50 : 0,
      avgRating: book.rating,
    });
  };

  if (viewMode === 'list') {
    return (
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/80 p-4 flex flex-col sm:flex-row gap-4 group">
        {/* Cover */}
        <div className="relative w-full sm:w-32 aspect-[3/4] sm:aspect-auto rounded-xl overflow-hidden bg-slate-50 shrink-0">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {book.tag && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-50 text-[#0B1F3A] font-bold text-[10px] shadow-xs border border-blue-100">
              {book.tag}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium truncate">
                {book.author} • {book.publisher}
              </p>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                }`}
                title="Lưu vào yêu thích"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <Link href={`/book/${book.slug}`}>
              <h3 className="font-bold text-sm sm:text-base text-[#0B1F3A] line-clamp-2 leading-snug group-hover:text-[#F5A623] transition-colors mt-0.5">
                {book.title}
              </h3>
            </Link>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center text-[11px] text-emerald-700 font-semibold gap-1">
                <PackageCheck className="w-3.5 h-3.5" />
                {book.inStock ? 'Còn hàng trong kho' : 'Đặt trước (Pre-order)'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center text-[11px] text-slate-600 font-medium">
                <Star className="w-3.5 h-3.5 text-[#F5A623] fill-current mr-1" />
                {book.rating.toFixed(1)} ({book.ratingCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-baseline gap-2">
              <span className="font-black text-base text-[#0B1F3A]">
                {formatVND(book.price)}
              </span>
              {book.originalPrice > book.price && (
                <>
                  <span className="text-xs text-slate-400 line-through">
                    {formatVND(book.originalPrice)}
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F5A623] hover:bg-[#e09419] text-[#0B1F3A]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã thêm</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Thêm vào giỏ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Default: Grid View
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1 border border-slate-200/80">
      {/* 1. Cover Image */}
      <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden">
        <Link href={`/book/${book.slug}`} className="block w-full h-full">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Top-Left Tag (Nhà xuất bản hoặc bản đặc biệt) */}
        {book.tag && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[#0B1F3A] font-bold text-[10px] shadow-xs border border-slate-100 pointer-events-none">
            {book.tag}
          </span>
        )}

        {/* Top-Right Heart button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-colors shadow-xs ${
            isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
          }`}
          title="Lưu sách yêu thích"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 2. Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {book.author} • {book.publisher}
          </p>

          <Link href={`/book/${book.slug}`}>
            <h3 className="font-bold text-xs sm:text-sm text-[#0B1F3A] line-clamp-2 leading-snug group-hover:text-[#F5A623] transition-colors">
              {book.title}
            </h3>
          </Link>
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          {/* Prices & Discount */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-black text-sm sm:text-base text-[#0B1F3A]">
              {formatVND(book.price)}
            </span>
            {book.originalPrice > book.price && (
              <>
                <span className="text-[11px] text-slate-400 line-through">
                  {formatVND(book.originalPrice)}
                </span>
                <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Stock & Rating */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <PackageCheck className="w-3 h-3" />
              <span>{book.inStock ? 'Còn hàng' : 'Pre-order'}</span>
            </span>
            <span className="text-slate-500 flex items-center">
              <Star className="w-3 h-3 text-[#F5A623] fill-current mr-0.5" />
              <span>{book.rating.toFixed(1)}</span>
              <span className="text-slate-400 ml-0.5">({book.ratingCount})</span>
            </span>
          </div>

          {/* Quick Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#F5A623] hover:bg-[#e09419] text-[#0B1F3A]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã thêm</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Thêm vào giỏ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
