'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, ChevronRight, Zap } from 'lucide-react';
import { BookCard } from '@/components/book/BookCard';

export function RecentlyViewedCarousel({ currentBookId }: { currentBookId?: string }) {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentlyViewed = async () => {
      try {
        const res = await fetch('/api/books/recently-viewed');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data.books)) {
          // Lọc bỏ cuốn sách hiện tại nếu đang ở trang chi tiết cuốn đó
          const filtered = currentBookId
            ? data.books.filter((b: any) => b.id !== currentBookId)
            : data.books;
          setBooks(filtered);
        }
      } catch (err) {
        console.error('Error fetching recently viewed books:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecentlyViewed();

    // Lắng nghe sự kiện xem sách mới
    const handleBookViewed = () => {
      fetchRecentlyViewed();
    };
    window.addEventListener('tosach_book_viewed', handleBookViewed);

    return () => {
      isMounted = false;
      window.removeEventListener('tosach_book_viewed', handleBookViewed);
    };
  }, [currentBookId]);

  if (isLoading || books.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1F3A] text-[#F5A623] flex items-center justify-center font-bold shadow-sm">
              <History className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                  Sách Bạn Vừa Xem Gần Đây
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-[#F5A623]" />
                  <span>Redis Cache • TTL 30 Ngày</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lịch sử duyệt sách được đồng bộ thời gian thực qua In-Memory Cache
              </p>
            </div>
          </div>

          <Link
            href="/catalog"
            className="text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Tiếp tục khám phá</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid hiển thị sách vừa xem */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {books.slice(0, 5).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
}
