import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, BookOpen, Sparkles, Award, 
  ChevronRight, ShieldCheck, Truck, RefreshCw, Layers
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { BookCard } from '@/components/book/BookCard';
import { formatVND } from '@/lib/utils';

export const revalidate = 60; // Tự động làm mới cache mỗi 60 giây (ISR)

export default async function HomePage() {
  // 1. Truy vấn dữ liệu thực tế từ Supabase PostgreSQL qua Prisma
  const [bestsellers, categories, newBooks] = await Promise.all([
    // Top sách bán chạy nhất
    prisma.book.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: 5,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    }),

    // Các ngành hàng cha (Cấp 1)
    prisma.category.findMany({
      where: { level: 1 },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      include: {
        _count: { select: { books: true } },
      },
    }),

    // Sách mới lên kệ
    prisma.book.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    }),
  ]);

  const spotlightBook = bestsellers.length > 0 ? bestsellers[0] : null;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO BANNER B2C */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0B1F3A] to-[#173059] text-white rounded-3xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-4 sm:mt-6 shadow-xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative px-6 sm:px-12 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs text-[#F5A623] font-bold">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span>Chào mừng bạn đến với Nhà Sách Tổ Sách</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Sách Về Tổ, <br />
                <span className="text-[#F5A623]">Tri Thức Bay Xa</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
                Không gian văn hóa đọc tuyển chọn những đầu sách giá trị nhất từ văn học, kinh tế, tâm lý đến khoa học. Cam kết 100% sách mới chính hãng, đóng gói 3 lớp và giao nhanh tận nơi.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/catalog"
                className="bg-[#F5A623] hover:bg-[#e09419] text-[#0B1F3A] font-extrabold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <span>Khám Phá Tủ Sách Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/catalog?sort=bestseller"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors border border-white/20"
              >
                Sách Bán Chạy Nhất
              </Link>
            </div>

            {/* Micro stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="block text-xl font-black text-[#F5A623]">100%</span>
                <span className="text-slate-400">Sách thật bản quyền</span>
              </div>
              <div>
                <span className="block text-xl font-black text-[#F5A623]">Freeship</span>
                <span className="text-slate-400">Đơn từ 250.000đ</span>
              </div>
              <div>
                <span className="block text-xl font-black text-[#F5A623]">7 Ngày</span>
                <span className="text-slate-400">Đổi trả bảo hành</span>
              </div>
            </div>
          </div>

          {/* Spotlight Book Card */}
          {spotlightBook && (
            <div className="lg:col-span-5 flex justify-center">
              <Link
                href={`/book/${spotlightBook.slug}`}
                className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 max-w-sm w-full hover:bg-white/15 transition-all group block shadow-2xl"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 shadow-xl">
                  <img
                    src={spotlightBook.coverUrl}
                    alt={spotlightBook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-[#F5A623] text-[#0B1F3A] text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
                    ⭐ ĐỀ CỬ NỔI BẬT
                  </span>
                </div>

                <div className="space-y-1 text-left">
                  <span className="text-xs text-[#F5A623] font-bold uppercase tracking-wider block">
                    {spotlightBook.categories?.[0]?.category?.name || 'Tổ Sách Tuyển Chọn'}
                  </span>
                  <h3 className="font-extrabold text-base text-white group-hover:text-[#F5A623] transition-colors truncate">
                    {spotlightBook.title}
                  </h3>
                  <p className="text-xs text-slate-300 truncate">
                    {spotlightBook.authors?.[0]?.author?.name || 'Nhiều Tác Giả'}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 mt-2">
                    <span className="text-lg font-black text-[#F5A623]">
                      {formatVND(spotlightBook.price)}
                    </span>
                    <span className="text-xs bg-white/20 px-3 py-1.5 rounded-lg text-white font-bold group-hover:bg-[#F5A623] group-hover:text-[#0B1F3A] transition-colors">
                      Xem Chi Tiết →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. SÁCH NỔI BẬT TỔ SÁCH (Top Bestsellers từ Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B1F3A] text-[#F5A623] flex items-center justify-center font-bold shadow-sm">
                <Award className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                  Sách Nổi Bật Tổ Sách
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Những cuốn sách bán chạy nhất và được độc giả săn đón nhiều nhất
                </p>
              </div>
            </div>

            <Link
              href="/catalog?sort=bestseller"
              className="text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid sách nổi bật */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {bestsellers.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC THỂ LOẠI NỔI BẬT (Cây danh mục thực tế từ Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#F5A623]" />
                <span>Danh Mục Sách Chọn Lọc</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khám phá kho tàng tri thức được phân loại khoa học theo từng chủ đề
              </p>
            </div>

            <Link
              href="/catalog"
              className="text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors"
            >
              <span>Tất cả thể loại</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?cat=${cat.slug}`}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-[#0B1F3A] hover:shadow-md transition-all group flex flex-col items-center text-center justify-center min-h-[120px]"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 text-[#0B1F3A] flex items-center justify-center mb-3 group-hover:bg-[#0B1F3A] group-hover:text-[#F5A623] transition-colors shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0B1F3A] transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {cat._count?.books || 0} tựa sách
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MỚI LÊN KỆ (Sách mới nhất từ Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                Mới Cập Bến Tổ Sách
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các ấn phẩm mới xuất bản từ các nhà xuất bản uy tín
              </p>
            </div>

            <Link
              href="/catalog?sort=newest"
              className="text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-[#F5A623] flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {newBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMMITMENT BANNER (Cam kết B2C) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F5A623]">
              CAM KẾT CHẤT LƯỢNG DỊCH VỤ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Trải Nghiệm Mua Sách An Tâm, Tinh Tế & Chu Đáo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mỗi cuốn sách bạn nhận được từ Tổ Sách đều là sản phẩm chính hãng, được tuyển lựa kỹ càng và bảo bọc cẩn thận qua 3 lớp chống sốc trước khi lên đường đến tay độc giả.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <ShieldCheck className="w-5 h-5 text-[#F5A623] shrink-0" />
                <span>Bản quyền 100% NXB</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <Truck className="w-5 h-5 text-[#F5A623] shrink-0" />
                <span>Giao hàng toàn quốc</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <RefreshCw className="w-5 h-5 text-[#F5A623] shrink-0" />
                <span>Đổi trả 7 ngày miễn phí</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
