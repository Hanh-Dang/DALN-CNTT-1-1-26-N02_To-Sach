'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw, 
  Check, Share2, Plus, Minus, ArrowLeft, ThumbsUp, 
  BookOpen, ChevronRight, Sparkles, CheckCircle2, AlertCircle,
  Award, PackageCheck, Bookmark, ExternalLink
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatVND, calculateDiscount } from '@/lib/utils';
import { BookCard, BookCardData } from './BookCard';

export interface BookDetailData {
  id: string;
  isbn: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number;
  stockQty: number;
  soldCount: number;
  pageCount: number | null;
  language: string | null;
  publishYear: number | null;
  publisher: string | null;
  coverUrl: string;
  extraImages: string[];
  avgRating: number;
  ratingCount: number;
  weightG: number | null;
  sizeCm: string | null;
  format: string | null;
  translator: string | null;
  tags: string[];
  authors: Array<{ author: { id: string; name: string; slug: string; bio?: string | null } }>;
  categories: Array<{ category: { id: string; name: string; slug: string; level: number } }>;
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
    user: {
      fullName: string;
    };
  }>;
}

interface BookDetailClientProps {
  book: BookDetailData;
  relatedBooks: BookCardData[];
}

export const BookDetailClient: React.FC<BookDetailClientProps> = ({ book, relatedBooks }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Gallery state
  const allImages = [
    book.coverUrl,
    ...(book.extraImages && book.extraImages.length > 0 ? book.extraImages : [])
  ].filter(Boolean);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Purchase quantity state
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tabs state: 'desc' | 'specs' | 'reviews'
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isFavorite = isWishlisted(book.id);
  const discountPercent = calculateDiscount(book.originalPrice, book.price);
  const authorName = book.authors && book.authors.length > 0
    ? book.authors.map((a) => a.author.name).join(', ')
    : 'Tổ Sách Tuyển Chọn';
  const primaryCategory = book.categories && book.categories.length > 0 ? book.categories[0].category : null;

  // Handle Add To Cart
  const handleAddToCart = () => {
    if (book.stockQty <= 0) return;

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

    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2200);
  };

  // Handle Buy Now (Add to cart & redirect directly to /checkout)
  const handleBuyNow = () => {
    if (book.stockQty <= 0) return;
    setIsBuyingNow(true);

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

    router.push('/checkout');
  };

  // Handle Toggle Wishlist
  const handleToggleWishlist = () => {
    toggleWishlist({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      price: book.price,
      originalPrice: book.originalPrice,
      coverUrl: book.coverUrl,
      authorName,
      categoryName: primaryCategory?.name,
      stockQty: book.stockQty,
      avgRating: book.avgRating,
    });
  };

  // Handle Share Link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setReviewSubmitting(true);
    setReviewMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          rating: newRating,
          title: newTitle.trim() || undefined,
          body: newComment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewMessage({
          type: 'success',
          text: 'Cảm ơn bạn! Đánh giá đã được ghi nhận và xuất bản thành công.',
        });
        setNewComment('');
        setNewTitle('');
        setNewRating(5);
      } else {
        setReviewMessage({
          type: 'error',
          text: data.error || 'Vui lòng đăng nhập để gửi đánh giá cho cuốn sách này.',
        });
      }
    } catch {
      setReviewMessage({
        type: 'error',
        text: 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Calculate star breakdown based on reviews
  const totalReviewsCount = Math.max(book.ratingCount, book.reviews.length, 1);
  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  book.reviews.forEach((r) => {
    if (starCounts[r.rating] !== undefined) {
      starCounts[r.rating]++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. BREADCRUMBS */}
      <nav aria-label="Breadcrumbs" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-[#0B1F3A] transition-colors flex items-center gap-1">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/catalog" className="hover:text-[#0B1F3A] transition-colors">
          Danh mục sách
        </Link>
        {primaryCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link 
              href={`/catalog?category=${primaryCategory.slug}`}
              className="hover:text-[#0B1F3A] transition-colors text-slate-700 font-semibold"
            >
              {primaryCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#0B1F3A] font-bold truncate max-w-xs sm:max-w-md">
          {book.title}
        </span>
      </nav>

      {/* 2. MAIN PRODUCT HERO CARD (2/3-COLUMN DESKTOP GRID) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: MULTI-IMAGE GALLERY (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Primary Display Frame */}
            <div className="relative aspect-[3/4] rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group">
              {/* Badges */}
              <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 items-start">
                <span className="bg-[#F5A623] text-[#0B1F3A] font-black text-[11px] px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wide">
                  <Award className="w-3.5 h-3.5" /> 100% Chính Hãng
                </span>
                {discountPercent > 0 && (
                  <span className="bg-rose-500 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-md shadow-xs">
                    Tiết kiệm {discountPercent}%
                  </span>
                )}
              </div>

              {/* Wishlist quick action button */}
              <button
                onClick={handleToggleWishlist}
                className={`absolute top-3.5 right-3.5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isFavorite
                    ? 'bg-rose-50 text-rose-500 ring-2 ring-rose-200'
                    : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white'
                }`}
                title={isFavorite ? 'Đã lưu yêu thích' : 'Thêm vào yêu thích'}
                type="button"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>

              {/* Main Image */}
              <img
                src={allImages[selectedImageIndex] || book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              {/* Seal Guarantee strip */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/60 to-transparent p-3 pt-6 text-white text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <PackageCheck className="w-4 h-4" /> Nguyên seal màng co
                </span>
                <span className="text-slate-200">Kiểm định NXB</span>
              </div>
            </div>

            {/* Thumbnail Carousel (If multiple images) */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    type="button"
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/30 scale-105 shadow-sm'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Góc nhìn ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Micro Trust Banner */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-[#0B1F3A] font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cam kết Bản quyền B2C từ Tổ Sách</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Phân phối trực tiếp từ các Nhà xuất bản uy tín (NXB Trẻ, Nhã Nam, Kim Đồng, Tri Thức). Hoàn tiền <strong>200%</strong> nếu phát hiện sách sao chép trái phép.
              </p>
            </div>
          </div>

          {/* RIGHT: DETAILS, PRICING & ACTIONS (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category & Publisher tags */}
              <div className="flex flex-wrap items-center gap-2">
                {book.publisher && (
                  <span className="bg-slate-100 text-[#0B1F3A] text-xs font-bold px-3 py-1 rounded-full border border-slate-200/60">
                    {book.publisher}
                  </span>
                )}
                {primaryCategory && (
                  <Link 
                    href={`/catalog?category=${primaryCategory.slug}`}
                    className="text-xs font-medium text-slate-500 hover:text-[#0B1F3A] bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200"
                  >
                    {primaryCategory.name}
                  </Link>
                )}
                {book.format && (
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    {book.format}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F3A] tracking-tight leading-snug">
                {book.title}
              </h1>

              {/* Author & Translators */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Tác giả: </span>
                  <span className="font-bold text-[#0B1F3A]">{authorName}</span>
                </div>
                {book.translator && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400">Dịch giả: </span>
                      <span className="font-semibold text-slate-700">{book.translator}</span>
                    </div>
                  </>
                )}
                {book.isbn && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">ISBN: {book.isbn}</span>
                  </>
                )}
              </div>

              {/* Rating & Sold Statistics Bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs pt-1 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(book.avgRating || 5)
                            ? 'fill-[#F5A623] text-[#F5A623]'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-extrabold text-[#0B1F3A]">{book.avgRating.toFixed(1)}</span>
                  <span className="text-slate-500">({book.ratingCount} đánh giá)</span>
                </div>

                <div className="text-slate-500">
                  Đã bán <strong className="text-[#0B1F3A] font-bold">{book.soldCount.toLocaleString('vi-VN')}</strong> cuốn
                </div>

                <button
                  onClick={handleShare}
                  className="ml-auto inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0B1F3A] text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                  type="button"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Đã sao chép link!' : 'Chia sẻ'}</span>
                </button>
              </div>

              {/* PRICING BOX */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-[#F5A623]">
                    {formatVND(book.price)}
                  </span>
                  {book.originalPrice > book.price && (
                    <>
                      <span className="text-base text-slate-400 line-through">
                        {formatVND(book.originalPrice)}
                      </span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                        Tiết kiệm {formatVND(book.originalPrice - book.price)} ({discountPercent}%)
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Giá đã bao gồm thuế VAT & Bảo hành vận chuyển nguyên vẹn bìa</span>
                </div>
              </div>

              {/* STOCK STATUS */}
              <div className="flex items-center gap-2 text-xs">
                {book.stockQty > 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-700">Tình trạng kho:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Còn {book.stockQty} cuốn sẵn sàng giao ngay
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-slate-700">Tình trạng kho:</span>
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                      Tạm thời hết hàng
                    </span>
                  </>
                )}
              </div>

              {/* QUANTITY SELECTOR & CTA BUTTONS */}
              {book.stockQty > 0 && (
                <div className="space-y-4 pt-2">
                  {/* Quantity Counter */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-700">Chọn số lượng:</span>
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                        type="button"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-[#0B1F3A]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(book.stockQty, q + 1))}
                        disabled={quantity >= book.stockQty}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                        type="button"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      (Tối đa {book.stockQty} cuốn)
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    {/* Add To Cart */}
                    <button
                      id="btn-add-to-cart"
                      onClick={handleAddToCart}
                      className={`w-full sm:flex-1 py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all shadow-xs ${
                        isAddedToCart
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-[#0B1F3A] hover:bg-slate-50 text-[#0B1F3A]'
                      }`}
                      type="button"
                    >
                      {isAddedToCart ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Đã Thêm Vào Giỏ!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
                          <span>Thêm Vào Giỏ Hàng</span>
                        </>
                      )}
                    </button>

                    {/* Buy Now */}
                    <button
                      id="btn-buy-now"
                      onClick={handleBuyNow}
                      disabled={isBuyingNow}
                      className="w-full sm:flex-1 bg-[#F5A623] hover:bg-[#e09419] text-[#0B1F3A] font-extrabold py-3.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                      type="button"
                    >
                      <span>{isBuyingNow ? 'Đang chuyển hướng...' : 'Mua Ngay'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* B2C PERKS GUARANTEE STRIP */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-600">
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-[#0B1F3A]" />
                <span className="font-bold text-[#0B1F3A]">100% Sách Thật</span>
                <span className="text-slate-400">Hoàn tiền 200% nếu giả</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                <Truck className="w-5 h-5 text-[#0B1F3A]" />
                <span className="font-bold text-[#0B1F3A]">Freeship từ 150k</span>
                <span className="text-slate-400">Giao siêu tốc toàn quốc</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                <RefreshCw className="w-5 h-5 text-[#0B1F3A]" />
                <span className="font-bold text-[#0B1F3A]">Đổi Trả 7 Ngày</span>
                <span className="text-slate-400">Nếu lỗi in ấn hoặc rách</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TABS SECTION: DESCRIPTION, SPECS & REVIEWS */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 lg:p-10 space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-8 border-b border-slate-200 text-sm font-bold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3.5 border-b-2 transition-colors ${
              activeTab === 'desc'
                ? 'border-[#0B1F3A] text-[#0B1F3A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            type="button"
          >
            Mô Tả Tác Phẩm
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3.5 border-b-2 transition-colors ${
              activeTab === 'specs'
                ? 'border-[#0B1F3A] text-[#0B1F3A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            type="button"
          >
            Thông Số Kỹ Thuật
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-[#0B1F3A] text-[#0B1F3A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            type="button"
          >
            <span>Đánh Giá & Nhận Xét</span>
            <span className="text-xs bg-slate-100 text-[#0B1F3A] px-2 py-0.5 rounded-full font-extrabold">
              {book.reviews.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'desc' && (
            <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
              <div className="whitespace-pre-line text-slate-700 font-normal leading-7">
                {book.description || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này.'}
              </div>

              {/* Official Publishing Note */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0B1F3A]">
                  <Sparkles className="w-4 h-4 text-[#F5A623]" />
                  <span>Lời giới thiệu từ Tổ Sách</span>
                </div>
                <p>
                  Mỗi bản in tại Tổ Sách đều được chúng tôi bảo quản trong môi trường kiểm soát độ ẩm đạt chuẩn kho tàng thư tịch, giữ nguyên màng co nhà xuất bản và cam kết không gãy gáy, quăn mép trước khi đến tay bạn đọc.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SPECS TABLE */}
          {activeTab === 'specs' && (
            <div className="max-w-2xl text-xs space-y-1">
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Mã ISBN</span>
                <span className="font-semibold text-slate-800 font-mono">{book.isbn || 'Đang cập nhật'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Tác giả</span>
                <span className="font-semibold text-slate-800">{authorName}</span>
              </div>
              {book.translator && (
                <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Dịch giả</span>
                  <span className="font-semibold text-slate-800">{book.translator}</span>
                </div>
              )}
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Nhà xuất bản</span>
                <span className="font-semibold text-slate-800">{book.publisher || 'NXB Trẻ'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Năm xuất bản</span>
                <span className="font-semibold text-slate-800">{book.publishYear || '2024'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Số trang</span>
                <span className="font-semibold text-slate-800">{book.pageCount ? `${book.pageCount} trang` : 'Đang cập nhật'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Kích thước bao bì</span>
                <span className="font-semibold text-slate-800">{book.sizeCm || '13 x 20.5 cm'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Trọng lượng</span>
                <span className="font-semibold text-slate-800">{book.weightG ? `${book.weightG} gram` : '350 gram'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Hình thức</span>
                <span className="font-semibold text-slate-800">{book.format || 'Bìa mềm'}</span>
              </div>
              <div className="grid grid-cols-2 py-3">
                <span className="text-slate-400 font-medium">Ngôn ngữ</span>
                <span className="font-semibold text-slate-800">{book.language || 'Tiếng Việt'}</span>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS & RATINGS */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Rating Summary Breakdown Box */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center md:border-r border-slate-200 pr-0 md:pr-4">
                  <div className="text-5xl font-black text-[#0B1F3A]">{book.avgRating.toFixed(1)}</div>
                  <div className="flex justify-center my-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(book.avgRating)
                            ? 'fill-[#F5A623] text-[#F5A623]'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{book.reviews.length} đánh giá đã được kiểm duyệt</p>
                </div>

                <div className="md:col-span-8 space-y-2 text-xs">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = starCounts[star] || 0;
                    const pct = book.reviews.length > 0 ? Math.round((count / book.reviews.length) * 100) : star === 5 ? 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="w-12 text-slate-600 font-semibold">{star} sao</span>
                        <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#F5A623] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-400 font-mono">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#0B1F3A]">
                  Nhận xét từ bạn đọc ({book.reviews.length})
                </h4>

                {book.reviews.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
                  </div>
                ) : (
                  book.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200/70 bg-white space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-[#F5A623] flex items-center justify-center font-bold text-xs uppercase">
                            {rev.user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-[#0B1F3A] block">{rev.user.fullName}</span>
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                                <Check className="w-3 h-3" /> Đã mua tại Tổ Sách
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        {rev.title && (
                          <span className="text-xs font-bold text-slate-800 ml-1.5">{rev.title}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{rev.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Review Submission Form */}
              <form onSubmit={handleSubmitReview} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <h4 className="font-bold text-[#0B1F3A] text-sm flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#F5A623]" />
                  <span>Viết nhận xét của bạn</span>
                </h4>

                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-semibold">Đánh giá sao:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`w-5 h-5 cursor-pointer transition-transform hover:scale-110 ${
                          star <= newRating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="review-title" className="block text-slate-600 font-semibold">Tiêu đề nhận xét (Tùy chọn):</label>
                  <input
                    id="review-title"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Tóm tắt cảm nhận của bạn (Ví dụ: Nội dung rất sâu sắc, bìa đẹp...)"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="review-comment" className="block text-slate-600 font-semibold">Nội dung chi tiết:</label>
                  <textarea
                    id="review-comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Hãy chia sẻ lý do bạn thích cuốn sách này để giúp độc giả khác lựa chọn..."
                    rows={4}
                    className="w-full bg-white p-3.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:border-[#0B1F3A]"
                    required
                  />
                </div>

                {reviewMessage && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                    reviewMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {reviewMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{reviewMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-[#0B1F3A] hover:bg-[#163156] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                >
                  {reviewSubmitting ? 'Đang gửi nhận xét...' : 'Gửi Nhận Xét'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* 4. RELATED BOOKS SECTION */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              Sách Cùng Thể Loại Có Thể Bạn Thích
            </h3>
            {primaryCategory && (
              <Link
                href={`/catalog?category=${primaryCategory.slug}`}
                className="text-xs font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
