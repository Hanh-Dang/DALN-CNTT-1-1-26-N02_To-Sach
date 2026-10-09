'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, Cpu } from 'lucide-react';
import { BookCard } from '@/components/book/BookCard';

export function RecommendedForYou() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [algorithmInfo, setAlgorithmInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      try {
        const res = await fetch('/api/books/recommendations');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setRecommendations(data.recommendations || []);
          setAlgorithmInfo(data.algorithm || null);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50/60 rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1F3A] text-[#F5A623] flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                  Gợi Ý Dành Riêng Cho Bạn
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0B1F3A] bg-[#F5A623] px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Cpu className="w-3 h-3 text-[#0B1F3A]" />
                  <span>5 Trọng Số AI • Proposal 3.1</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cá nhân hóa từ lịch sử tương tác: Collab (35%) + Thể loại (25%) + Hành vi (15%) + Đánh giá (20%) + Xu hướng (5%)
              </p>
            </div>
          </div>

          <Link
            href="/catalog"
            className="text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Xem thêm gợi ý</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid Sách Gợi Ý */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {recommendations.slice(0, 5).map((book) => (
            <div key={book.id} className="relative group">
              {book.recommendationScore && (
                <div className="absolute top-2 right-2 z-10 bg-[#0B1F3A]/90 backdrop-blur-xs text-[#F5A623] text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs border border-white/20 pointer-events-none">
                  ⚡ {book.recommendationScore}% phù hợp
                </div>
              )}
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
