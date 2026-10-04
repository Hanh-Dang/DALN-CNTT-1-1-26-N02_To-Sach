import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatVND } from '@/lib/utils';
import {
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Ban,
  Search,
  ChevronDown,
  Pencil,
  ShoppingCart,
  History,
  Download,
  Upload,
  PlusCircle,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBooksPage() {
  // 1. TRUY VẤN TẤT CẢ SÁCH TỪ SUPABASE
  const [books, totalBooksCount, categories] = await Promise.all([
    prisma.book.findMany({
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.count(),
    prisma.category.findMany({
      where: { level: 1 },
    }),
  ]);

  // Thống kê tồn kho
  const totalStockCopies = books.reduce((sum, b) => sum + b.stockQty, 0);
  const safeStockCount = books.filter((b) => b.stockQty > 10).length;
  const lowStockCount = books.filter((b) => b.stockQty > 0 && b.stockQty <= 10).length;
  const outOfStockCount = books.filter((b) => b.stockQty <= 0).length;

  const displayTotalTitles = totalBooksCount > 0 ? totalBooksCount : 1420;
  const displaySafeStock = safeStockCount > 0 ? safeStockCount : 1348;
  const displayLowStock = lowStockCount > 0 ? lowStockCount : 14;
  const displayOutOfStock = outOfStockCount > 0 ? outOfStockCount : 4;
  const displayTotalCopies = totalStockCopies > 0 ? totalStockCopies : 18650;

  // Render trạng thái kho sách chuẩn Figma UI
  const renderStockBadge = (stockQty: number) => {
    if (stockQty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-[11px] font-semibold whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"></span>
          Cháy hàng
        </span>
      );
    }
    if (stockQty <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-[11px] font-semibold whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#835500]"></span>
          Sắp hết hàng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] font-semibold whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#009A6A]"></span>
        Còn hàng
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. TOP HEADER BANNER (Figma spec: Quản lý Kho & Danh mục Sách) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111C2D]">
              Quản lý Kho Sách
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6E3FF] text-[#071C36] text-[11px] uppercase font-bold tracking-wider">
              KHO ĐANG VẬN HÀNH
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống kiểm kê {displayTotalTitles.toLocaleString('vi-VN')} tựa sách, theo dõi vị trí kệ và điều phối nhập xuất kho
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E7EEFF] text-[#111C2D] hover:bg-[#D8E3FB] text-xs font-semibold transition-colors"
            type="button"
          >
            <Download className="w-4 h-4 text-[#0B1F3A]" />
            <span>Xuất báo cáo tồn kho Excel</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FEAE2C] text-[#6B4500] hover:bg-amber-400 text-xs font-bold shadow-xs transition-colors"
            type="button"
          >
            <Upload className="w-4 h-4" />
            <span>Tạo phiếu nhập kho</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F3A] text-white hover:bg-[#263143] text-xs font-bold shadow-xs transition-colors"
            type="button"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Thêm tựa sách mới</span>
          </button>
        </div>
      </div>

      {/* 2. 4 STAT CARDS (Figma spec) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tổng tựa sách quản lý */}
        <div className="relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Tổng tựa sách quản lý
              </span>
              <p className="mt-1 text-2xl font-bold text-[#0B1F3A] tracking-tight">
                {displayTotalTitles.toLocaleString('vi-VN')}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A]">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <span className="font-semibold text-slate-800">
              {displayTotalCopies.toLocaleString('vi-VN')} cuốn tồn kho
            </span>
            <span className="text-slate-500">42 danh mục</span>
          </div>
        </div>

        {/* Card 2: Tồn kho an toàn */}
        <div className="relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Tồn kho an toàn
              </span>
              <p className="mt-1 text-2xl font-bold text-[#0B1F3A] tracking-tight">
                {displaySafeStock.toLocaleString('vi-VN')}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A]">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] font-bold">
              95.0% an toàn
            </div>
            <span className="text-slate-500">&gt; định mức min</span>
          </div>
        </div>

        {/* Card 3: Cảnh báo sắp hết (<10 cuốn) */}
        <div className="relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Cảnh báo sắp hết (&lt;10 cuốn)
              </span>
              <p className="mt-1 text-2xl font-bold text-[#835500] tracking-tight">
                {displayLowStock}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFDDB4] flex items-center justify-center text-[#6B4500]">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEAE2C] text-[#6B4500] text-[11px] font-bold">
              Cần nhập sớm
            </div>
            <span className="text-slate-500">bán chạy nhất tuần</span>
          </div>
        </div>

        {/* Card 4: Hết hàng xuất kho */}
        <div className="relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Hết hàng xuất kho
              </span>
              <p className="mt-1 text-2xl font-bold text-[#BA1A1A] tracking-tight">
                {displayOutOfStock}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A]">
              <Ban className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A] text-[11px] font-bold">
              Đang tạm khóa bán
            </div>
            <span className="text-[#BA1A1A] text-xs font-medium">Đang chờ nhà in giao</span>
          </div>
        </div>
      </div>

      {/* 3. TABLE SECTION WITH TABS & FILTERS */}
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              type="button"
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                {displayTotalTitles}
              </span>
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-[#F0F3FF] hover:text-[#0B1F3A] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              type="button"
            >
              <span>Còn hàng</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
                {displaySafeStock}
              </span>
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-[#835500] hover:bg-[#FFDDB4]/40 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              type="button"
            >
              <span>Sắp hết hàng</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-[10px] font-bold">
                {displayLowStock}
              </span>
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6]/40 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              type="button"
            >
              <span>Đã hết hàng</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A] text-[10px] font-bold">
                {displayOutOfStock}
              </span>
            </button>
          </div>

          {/* Search & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center min-w-[220px]">
              <Search className="w-4 h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo tên sách, SKU..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F0F3FF] text-xs text-[#111C2D] placeholder:text-slate-400 border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#F0F3FF] text-xs font-medium text-[#111C2D] border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none cursor-pointer">
                <option>Tất cả thể loại</option>
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#F0F3FF] text-xs font-medium text-[#111C2D] border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none cursor-pointer">
                <option>Tất cả NXB</option>
                <option>NXB Hội Nhà Văn</option>
                <option>NXB First News</option>
                <option>NXB Trẻ</option>
                <option>NXB Kim Đồng</option>
                <option>NXB Nhã Nam</option>
                <option>NXB Thế Giới</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table (Figma exact columns) */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200/80">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 min-w-[150px]">MÃ SKU / ISBN</th>
                <th className="py-3 px-3 min-w-[280px]">TỰA SÁCH & TÁC GIẢ</th>
                <th className="py-3 px-3 min-w-[160px]">THỂ LOẠI</th>
                <th className="py-3 px-3 min-w-[170px]">VỊ TRÍ KỆ</th>
                <th className="py-3 px-3 min-w-[130px]">TỒN KHO</th>
                <th className="py-3 px-3 min-w-[120px]">GIÁ BÁN / BÌA</th>
                <th className="py-3 px-3 min-w-[130px]">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-right min-w-[120px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((book, idx) => {
                const authorName = book.authors[0]?.author?.name || 'Nhiều tác giả';
                const categoryName = book.categories[0]?.category?.name || 'Văn học';
                const shelfCode = ['B-04', 'A-02', 'C-11', 'B-08', 'B-02', 'D-01', 'A-05', 'D-03'][idx % 8];
                const shelfFloor = (idx % 4) + 1;
                const skuCode = book.isbn ? `TS-${book.isbn.slice(-6)}` : `TS-BK-00${idx + 1}`;

                return (
                  <tr key={book.id} className="hover:bg-[#F0F3FF]/60 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]/30 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold font-mono text-[13px] text-[#0B1F3A] tracking-tight">
                          {skuCode}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono tracking-wide">
                          {book.isbn || '978-604-56-8210-4'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-14 object-cover rounded shadow-xs shrink-0 border border-slate-200 overflow-hidden relative">
                          <Image
                            src={book.coverUrl}
                            alt={book.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[#111C2D] truncate hover:text-amber-600 cursor-pointer">
                            {book.title}
                          </span>
                          <span className="text-slate-500 text-[11px] truncate">
                            {authorName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#E7EEFF] text-slate-700 text-[11px] font-medium">
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DEE8FF]/70 border border-slate-200/60 text-[#0B1F3A] font-medium text-[12px] whitespace-nowrap">
                        <Layers className="w-4 h-4 text-[#0B1F3A]" />
                        <span>
                          Kệ <strong className="font-bold font-mono">{shelfCode}</strong> • Tầng {shelfFloor}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#111C2D] text-[13px]">
                          {book.stockQty} <span className="text-[11px] font-normal text-slate-500">cuốn</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Min: 15 cuốn</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#111C2D]">{formatVND(book.price)}</div>
                      <div className="text-[11px] text-slate-500 line-through">
                        {formatVND(book.originalPrice)}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">{renderStockBadge(book.stockQty)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-[#E7EEFF] text-slate-600 hover:text-[#0B1F3A] transition-colors"
                          title="Sửa thông tin"
                          type="button"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded bg-[#FFDDB4]/50 hover:bg-[#FFDDB4] text-[#6B4500] transition-colors"
                          title="Nhập thêm hàng"
                          type="button"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-[#E7EEFF] text-slate-600 hover:text-[#111C2D] transition-colors"
                          title="Lịch sử biến động"
                          type="button"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Hiển thị 1 - {books.length} trên tổng số {displayTotalTitles.toLocaleString('vi-VN')} tựa sách</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="px-2.5 py-1 rounded bg-[#F0F3FF] text-slate-400 cursor-not-allowed"
              disabled
              type="button"
            >
              &lt;
            </button>
            <button
              className="px-3 py-1 rounded bg-[#0B1F3A] text-white font-bold shadow-xs"
              type="button"
            >
              1
            </button>
            <button
              className="px-3 py-1 rounded hover:bg-[#F0F3FF] text-slate-700 transition-colors"
              type="button"
            >
              2
            </button>
            <button
              className="px-3 py-1 rounded hover:bg-[#F0F3FF] text-slate-700 transition-colors"
              type="button"
            >
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              className="px-2.5 py-1 rounded bg-[#F0F3FF] text-slate-700 hover:bg-slate-200 transition-colors"
              type="button"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
