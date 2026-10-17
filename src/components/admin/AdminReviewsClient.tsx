'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  MessageSquareText,
  BadgeCheck,
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';

export interface AdminReviewData {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  title?: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  book: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    price: number;
    avgRating?: number | null;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface AdminReviewsClientProps {
  initialReviews: AdminReviewData[];
  canManageReviews: boolean;
  currentUser: {
    fullName: string;
    role: string;
  } | null;
}

type TabType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { id: TabType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả đánh giá' },
  { id: 'PENDING', label: 'Chờ kiểm duyệt' },
  { id: 'APPROVED', label: 'Đã duyệt công khai' },
  { id: 'REJECTED', label: 'Đã từ chối / Ẩn' },
];

export function AdminReviewsClient({
  initialReviews,
  canManageReviews,
  currentUser,
}: AdminReviewsClientProps) {
  const [reviews, setReviews] = useState<AdminReviewData[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal xem chi tiết review
  const [selectedReview, setSelectedReview] = useState<AdminReviewData | null>(null);

  // Loading & Toast state
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.status === 'REJECTED').length;
    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = total > 0 ? (totalRatingSum / total).toFixed(1) : '5.0';
    return { total, pending, approved, rejected, avg };
  }, [reviews]);

  // Bộ lọc danh sách
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Lọc tab trạng thái
      if (activeTab !== 'ALL' && r.status !== activeTab) return false;

      // 2. Lọc số sao
      if (ratingFilter !== 'ALL' && r.rating !== parseInt(ratingFilter, 10)) return false;

      // 3. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const bookMatch = r.book.title.toLowerCase().includes(q);
        const nameMatch = r.user.fullName.toLowerCase().includes(q);
        const emailMatch = r.user.email.toLowerCase().includes(q);
        const contentMatch = (r.body || '').toLowerCase().includes(q) || (r.title || '').toLowerCase().includes(q);
        return bookMatch || nameMatch || emailMatch || contentMatch;
      }

      return true;
    });
  }, [reviews, activeTab, ratingFilter, searchQuery]);

  // Phân trang 10 đánh giá / trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, ratingFilter, searchQuery]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  // Cập nhật trạng thái đánh giá (Duyệt / Từ chối / Hoàn về Pending)
  const handleUpdateStatus = async (
    reviewId: string,
    newStatus: 'APPROVED' | 'REJECTED' | 'PENDING'
  ) => {
    setIsUpdatingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật trạng thái đánh giá');

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );

      if (selectedReview && selectedReview.id === reviewId) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showToast(data.message || 'Cập nhật thành công!');
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật đánh giá', 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Xóa đánh giá vĩnh viễn
  const handleDeleteReview = async (review: AdminReviewData) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này của "${review.user.fullName}"?`)) {
      return;
    }

    setIsUpdatingId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa đánh giá');

      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      if (selectedReview?.id === review.id) {
        setSelectedReview(null);
      }
      showToast('Đã xóa đánh giá vĩnh viễn khỏi hệ thống!');
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa đánh giá', 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Badge hiển thị trạng thái đánh giá
  const renderStatusBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Chờ duyệt</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã duyệt</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Đã ẩn</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#0B1F3A] text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#FEAE2C]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A]">
              Kiểm Duyệt Đánh Giá Bạn Đọc
            </h1>
            {stats.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-xs font-black animate-pulse">
                {stats.pending} đánh giá chờ duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm tra và phê duyệt nhận xét của độc giả, lọc bỏ nội dung spam để bảo đảm văn hóa đọc văn minh tại Tổ Sách.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!canManageReviews && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Chế độ Chỉ Xem (Cần quyền MANAGE_REVIEWS để duyệt)</span>
            </div>
          )}

          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl bg-[#F0F3FF] text-[#0B1F3A] hover:bg-[#DEE8FF] text-xs font-bold transition-colors shadow-2xs"
          >
            ← Về Dashboard
          </Link>
        </div>
      </div>

      {/* 2. 4 STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đánh giá */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setRatingFilter('ALL');
          }}
          className={`cursor-pointer bg-white p-4.5 rounded-2xl border transition-all shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] ${
            activeTab === 'ALL' ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/10' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Đánh Giá
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-[#0B1F3A] flex items-center justify-center">
              <MessageSquareText className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B1F3A]">{stats.total}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Trên toàn hệ thống</span>
        </div>

        {/* Card 2: Chờ kiểm duyệt */}
        <div
          onClick={() => {
            setActiveTab('PENDING');
            setRatingFilter('ALL');
          }}
          className={`cursor-pointer bg-white p-4.5 rounded-2xl border transition-all shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] ${
            activeTab === 'PENDING' ? 'border-[#F5A623] ring-2 ring-amber-500/20' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Chờ Kiểm Duyệt
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-[#F5A623] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#B07200]">{stats.pending}</p>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">Cần ban biên tập duyệt</span>
        </div>

        {/* Card 3: Đã duyệt công khai */}
        <div
          onClick={() => {
            setActiveTab('APPROVED');
            setRatingFilter('ALL');
          }}
          className={`cursor-pointer bg-white p-4.5 rounded-2xl border transition-all shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] ${
            activeTab === 'APPROVED' ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Đã Duyệt Công Khai
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{stats.approved}</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Hiển thị ở trang sách</span>
        </div>

        {/* Card 4: Điểm hài lòng trung bình */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Điểm Đánh Giá TB
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-[#0B1F3A]">{stats.avg}</p>
            <span className="text-xs text-amber-500 font-bold">/ 5.0 ⭐</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Độ hài lòng chung</span>
        </div>
      </div>

      {/* 3. TABS & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 space-y-4">
        {/* TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            let count = stats.total;
            if (tab.id === 'PENDING') count = stats.pending;
            if (tab.id === 'APPROVED') count = stats.approved;
            if (tab.id === 'REJECTED') count = stats.rejected;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-[#FEAE2C] text-[#291800]' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH & RATING FILTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tựa sách, tên độc giả, nội dung..."
              className="w-full pl-9 pr-3 py-2 bg-[#F0F3FF] text-xs text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1F3A]/20 border border-transparent focus:border-slate-300 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo số sao */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600">
            <span className="font-semibold">Mức đánh giá:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="p-1.5 bg-[#F0F3FF] border border-slate-200 rounded-xl text-xs font-bold text-[#0B1F3A] focus:outline-none"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
              <option value="3">⭐⭐⭐ (3 sao)</option>
              <option value="2">⭐⭐ (2 sao)</option>
              <option value="1">⭐ (1 sao)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <MessageSquareText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700">
              Không tìm thấy đánh giá nào phù hợp
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc bấm tab "Tất cả đánh giá" để xem toàn bộ danh sách.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3 px-3.5 min-w-[200px]">TỰA SÁCH LIÊN QUAN</th>
                  <th className="py-3 px-3 min-w-[170px]">ĐỘC GIẢ ĐÁNH GIÁ</th>
                  <th className="py-3 px-3 min-w-[120px]">MỨC SAO</th>
                  <th className="py-3 px-3 min-w-[260px]">NỘI DUNG NHẬN XÉT</th>
                  <th className="py-3 px-3 min-w-[110px]">TRẠNG THÁI</th>
                  <th className="py-3 px-3.5 text-right min-w-[150px]">THAO TÁC DUYỆT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReviews.map((rev) => {
                  const isUpdating = isUpdatingId === rev.id;

                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-[#F0F3FF]/40 transition-colors group"
                    >
                      {/* Cột 1: Sách */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={rev.book.coverUrl || '/placeholder-book.jpg'}
                              alt={rev.book.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/book/${rev.book.slug}`}
                              target="_blank"
                              className="font-bold text-[#0B1F3A] hover:underline line-clamp-2 leading-tight block text-xs"
                              title={rev.book.title}
                            >
                              {rev.book.title}
                            </Link>
                            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <span>Xem trên web</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Độc giả */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#111C2D] truncate max-w-[160px]">
                          {rev.user.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">
                          {rev.user.email}
                        </div>
                        {rev.isVerifiedPurchase && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <BadgeCheck className="w-3 h-3 text-emerald-600" />
                            <span>Đã mua sách</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 3: Mức sao */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 stroke-amber-400'
                                  : 'fill-slate-100 stroke-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          {formatDateVN(rev.createdAt)}
                        </span>
                      </td>

                      {/* Cột 4: Nội dung nhận xét */}
                      <td className="py-3.5 px-3">
                        {rev.title && (
                          <h4 className="font-bold text-slate-800 text-xs line-clamp-1 mb-0.5">
                            {rev.title}
                          </h4>
                        )}
                        <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                          {rev.body}
                        </p>
                        <button
                          onClick={() => setSelectedReview(rev)}
                          className="text-[11px] font-bold text-[#0B1F3A] hover:underline mt-1 cursor-pointer"
                        >
                          Xem chi tiết toàn văn →
                        </button>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3.5 px-3">
                        {renderStatusBadge(rev.status)}
                      </td>

                      {/* Cột 6: Thao tác duyệt */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Nút DUYỆT (Nếu chưa duyệt) */}
                          {canManageReviews && rev.status !== 'APPROVED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(rev.id, 'APPROVED')}
                              type="button"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Duyệt hiển thị đánh giá này trên trang sản phẩm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </button>
                          )}

                          {/* Nút TỪ CHỐI / ẨN (Nếu đang duyệt hoặc pending) */}
                          {canManageReviews && rev.status !== 'REJECTED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(rev.id, 'REJECTED')}
                              type="button"
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              title="Ẩn đánh giá này khỏi trang sản phẩm"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Ẩn</span>
                            </button>
                          )}

                          {/* Nút XÓA VĨNH VIỄN */}
                          {canManageReviews && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleDeleteReview(rev)}
                              type="button"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-all cursor-pointer"
                              title="Xóa vĩnh viễn đánh giá spam này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination (10 đánh giá / trang) */}
        {filteredReviews.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-100 text-xs bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500">
              <span>
                Hiển thị{' '}
                {(currentPage - 1) * pageSize + 1}{' '}
                - {Math.min(currentPage * pageSize, filteredReviews.length)} trên tổng số{' '}
                <strong className="text-slate-800">{filteredReviews.length}</strong> đánh giá
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currentPage <= 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                }`}
                type="button"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'bg-[#0B1F3A] text-white shadow-xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                      type="button"
                    >
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return (
                    <span key={p} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currentPage >= totalPages
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                }`}
                type="button"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL XEM CHI TIẾT ĐÁNH GIÁ (DETAIL MODAL) */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="font-bold text-[#0B1F3A] text-base flex items-center gap-2">
                  <span>Chi tiết nhận xét từ độc giả</span>
                  {renderStatusBadge(selectedReview.status)}
                </span>
                <p className="text-xs text-slate-400">
                  Thời gian: {formatDateTimeVN(selectedReview.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedReview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin sách */}
            <div className="p-3 bg-[#F0F3FF] rounded-2xl flex items-center gap-3">
              <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                <Image
                  src={selectedReview.book.coverUrl || '/placeholder-book.jpg'}
                  alt={selectedReview.book.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-[#0B1F3A] line-clamp-1">
                  {selectedReview.book.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < selectedReview.rating
                            ? 'fill-amber-400 stroke-amber-400'
                            : 'fill-slate-200 stroke-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">
                    {selectedReview.rating} / 5 sao
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin độc giả */}
            <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Độc giả: {selectedReview.user.fullName}
                </span>
                {selectedReview.isVerifiedPurchase && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ✓ Đã mua hàng
                  </span>
                )}
              </div>
              <p className="text-slate-400 font-mono text-[11px]">
                Email: {selectedReview.user.email}
              </p>
            </div>

            {/* Nội dung nhận xét */}
            <div className="space-y-2">
              {selectedReview.title && (
                <h3 className="font-black text-sm text-[#0B1F3A]">
                  "{selectedReview.title}"
                </h3>
              )}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                {selectedReview.body}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              {canManageReviews && selectedReview.status !== 'APPROVED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedReview.id, 'APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Duyệt hiển thị</span>
                </button>
              )}

              {canManageReviews && selectedReview.status !== 'REJECTED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedReview.id, 'REJECTED')}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ẩn vi phạm</span>
                </button>
              )}

              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
