'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, ShieldCheck, ArrowLeft } from 'lucide-react';

interface PolicyPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export const PolicyPageLayout: React.FC<PolicyPageLayoutProps> = ({
  title,
  subtitle,
  badge = 'Thông tin chính thức',
  updatedAt = '15/10/2026',
  children,
}) => {
  return (
    <main className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#0B1F3A] flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[#0B1F3A] font-bold truncate">{title}</span>
        </nav>

        {/* Header Hero Card */}
        <div className="bg-gradient-to-br from-[#0B1F3A] to-[#163156] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{subtitle}</p>
            )}
            <p className="text-[11px] text-slate-400 pt-2 border-t border-white/10">
              Có hiệu lực từ ngày: <strong>{updatedAt}</strong> • Ban hành bởi Ban Quản Trị Tổ Sách
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-6 text-slate-700 leading-relaxed text-sm">
          {children}
        </div>

        {/* Bottom Back Button */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0B1F3A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về trang chủ</span>
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0B1F3A] bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-xl transition-colors shadow-xs"
          >
            <span>Khám phá 5.100+ tựa sách</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
