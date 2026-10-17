'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home, ChevronRight, LayoutGrid, List,
  ChevronLeft, ArrowUpDown, Filter, Sparkles, BookOpen,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { CatalogBookCard, CatalogBookItem } from './CatalogBookCard';
import {
  CatalogFilterSidebar,
  CatalogFilterState,
  CategoryFilterItem,
  PublisherFilterItem
} from './CatalogFilterSidebar';
import { removeVietnameseTones } from '@/lib/utils';

interface CatalogClientProps {
  initialBooks: CatalogBookItem[];
  serverTotalResults?: number;
  serverCurrentPage?: number;
  serverPageSize?: number;
  categoriesData?: CategoryFilterItem[];
  publishersData?: PublisherFilterItem[];
  authorsData?: string[];
}

export const CatalogClient: React.FC<CatalogClientProps> = ({
  initialBooks,
  serverTotalResults,
  serverCurrentPage = 1,
  serverPageSize = 24,
  categoriesData = [],
  publishersData = [],
  authorsData = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters (hỗ trợ cả ?category= và ?cat=)
  const initialCategory = searchParams.get('category') || searchParams.get('cat') || undefined;
  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(serverCurrentPage);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const pageSize = serverPageSize;

  const [filters, setFilters] = useState<CatalogFilterState>({
    category: initialCategory,
    priceRange: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    publishers: [],
    authors: [],
    rating: undefined,
    inStockOnly: false,
    preOrder: false,
  });

  // Sync state if searchParams or server props change
  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('cat') || undefined;
    const q = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || 'newest';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    setFilters((prev) => ({ ...prev, category: cat }));
    setSearchQuery(q);
    setSortOption(sort);
    setCurrentPage(pageParam > 0 ? pageParam : serverCurrentPage);
  }, [searchParams, serverCurrentPage]);

  // Update URL params when filters, sort or page change (Trigger Server-side re-render - H12)
  const updateUrl = (
    newFilters: CatalogFilterState,
    newSort: string,
    query: string,
    newPage: number = 1
  ) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('page', String(newPage));
    if (query.trim()) params.set('q', query.trim());
    if (newFilters.category) params.set('category', newFilters.category);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    if (newFilters.priceRange) params.set('priceRange', newFilters.priceRange);
    if (newFilters.minPrice) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.publishers && newFilters.publishers.length > 0) {
      params.set('publisher', newFilters.publishers[0]);
    }
    if (newFilters.inStockOnly) params.set('inStock', 'true');

    const newUrl = params.toString() ? `/catalog?${params.toString()}` : '/catalog';
    router.push(newUrl, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filters, sortOption, searchQuery, page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 160, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (newFilters: CatalogFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, sortOption, searchQuery, 1);
  };

  const handleResetFilters = () => {
    const emptyFilters: CatalogFilterState = {
      category: undefined,
      priceRange: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      publishers: [],
      authors: [],
      rating: undefined,
      inStockOnly: false,
      preOrder: false,
    };
    setFilters(emptyFilters);
    setSearchQuery('');
    setCurrentPage(1);
    updateUrl(emptyFilters, sortOption, '', 1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    setCurrentPage(1);
    updateUrl(filters, newSort, searchQuery, 1);
  };

  // Filter and Sort execution
  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      // 1. Search Query (Hỗ trợ tiếng Việt không dấu & có dấu chuẩn xác)
      if (searchQuery.trim()) {
        const cleanQ = removeVietnameseTones(searchQuery);
        const normTitle = removeVietnameseTones(book.title);
        const normAuthor = removeVietnameseTones(book.author);
        const normPublisher = removeVietnameseTones(book.publisher);
        const matchTitle = normTitle.includes(cleanQ);
        const matchAuthor = normAuthor.includes(cleanQ);
        const matchPublisher = normPublisher.includes(cleanQ);
        if (!matchTitle && !matchAuthor && !matchPublisher) return false;
      }

      // 2. Category (Hỗ trợ cả alias kinh-te-ky-nang, kinh-te, ky-nang - M11)
      if (filters.category) {
        const cat = filters.category.toLowerCase().trim();
        const bookSlugs = (book.categorySlug || '').toLowerCase().split(/\s+/);
        
        let matchesCategory = bookSlugs.includes(cat);
        if (!matchesCategory) {
          if (cat === 'kinh-te-ky-nang' || cat === 'kinh-te') {
            matchesCategory = bookSlugs.includes('kinh-te-khoi-nghiep') || bookSlugs.includes('ky-nang-song');
          } else if (cat === 'ky-nang') {
            matchesCategory = bookSlugs.includes('ky-nang-song');
          }
        }
        if (!matchesCategory) return false;
      }

      // 3. Price Range
      if (filters.minPrice !== undefined && book.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && book.price > filters.maxPrice) return false;

      // 4. Publishers
      if (filters.publishers.length > 0) {
        if (!filters.publishers.includes(book.publisher)) return false;
      }

      // 5. Authors
      if (filters.authors.length > 0) {
        const matchAny = filters.authors.some((a) => book.author.includes(a));
        if (!matchAny) return false;
      }

      // 6. Rating
      if (filters.rating !== undefined && book.rating < filters.rating) return false;

      // 7. Stock status
      if (filters.inStockOnly && !book.inStock) return false;
      if (filters.preOrder && book.inStock) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'rating') return b.rating - a.rating;
      if (sortOption === 'bestseller') return b.ratingCount - a.ratingCount;
      return 0; // default newest
    });
  }, [initialBooks, searchQuery, filters, sortOption]);

  // Pagination (Server-side Pagination H12 hoặc Fallback Client)
  const isServerPagination = serverTotalResults !== undefined;
  const totalResults = isServerPagination ? serverTotalResults : filteredBooks.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBooks = isServerPagination ? initialBooks : filteredBooks.slice(startIndex, startIndex + pageSize);

  // Category Title
  const categoryTitle = useMemo(() => {
    if (searchQuery.trim()) return `Kết quả tìm kiếm: "${searchQuery}"`;
    if (!filters.category) return 'Tất cả Sách & Tác Phẩm';

    // Tìm tên chính xác từ categoriesData (dữ liệu thật từ DB)
    for (const root of categoriesData) {
      if (root.slug === filters.category) return root.name;
      const sub = root.subs?.find((s) => s.slug === filters.category);
      if (sub) return `${root.name} › ${sub.name}`;
    }

    if (filters.category.includes('kinh-te')) return 'Kinh Tế & Kỹ Năng';
    if (filters.category.includes('van-hoc')) return 'Văn Học & Tiểu Thuyết';
    if (filters.category.includes('cong-nghe') || filters.category.includes('lap-trinh')) return 'Công Nghệ & Lập Trình';
    if (filters.category.includes('lich-su') || filters.category.includes('van-hoa')) return 'Lịch Sử & Văn Hóa';
    if (filters.category.includes('tam-ly') || filters.category.includes('triet-hoc')) return 'Tâm Lý & Triết Học';
    if (filters.category.includes('thieu-nhi')) return 'Thiếu Nhi & Truyện Tranh';
    return `Danh Mục Sách: ${filters.category}`;
  }, [searchQuery, filters.category, categoriesData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[#0B1F3A] flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
        <Link href="/catalog" className="hover:text-[#0B1F3A] transition-colors">
          Danh mục sách
        </Link>
        {filters.category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-[#0B1F3A] font-bold truncate">
              {categoryTitle}
            </span>
          </>
        )}
      </nav>

      {/* 2. PAGE TITLE & TOP TOOLBAR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 bg-[#F5A623] rounded-full"></span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              {categoryTitle}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Tìm thấy <strong className="text-[#0B1F3A]">{totalResults}</strong> tựa sách chính hãng từ <strong className="text-[#F5A623]">Tổ Sách</strong> Bookstore
          </p>
        </div>

        {/* Toolbar: Sort + View Mode */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Sort Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <label htmlFor="sort-select" className="text-xs text-slate-500 font-medium shrink-0">
              Sắp xếp:
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={handleSortChange}
              className="bg-transparent text-xs font-bold text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất lên kệ</option>
              <option value="bestseller">Sách bán chạy</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN LAYOUT: Sidebar (w-72) + Books Grid */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar */}
        <CatalogFilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          categoriesData={categoriesData}
          publishersData={publishersData}
          authorsData={authorsData}
        />

        {/* Books Section */}
        <section className="flex-1 w-full space-y-6">
          {paginatedBooks.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'flex flex-col gap-3'
              }
            >
              {paginatedBooks.map((book) => (
                <CatalogBookCard key={book.id} book={book} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            /* Empty State khi không có sách phù hợp */
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0B1F3A] flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-8 h-8 text-[#F5A623]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A]">
                  Không tìm thấy tựa sách phù hợp
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Bạn vui lòng thử lại với mức giá khác, xóa bớt điều kiện lọc hoặc tìm kiếm theo từ khóa phổ biến hơn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            </div>
          )}

          {/* 4. PAGINATION */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 whitespace-nowrap">
                Hiển thị <strong className="text-[#0B1F3A]">{startIndex + 1} - {Math.min(startIndex + pageSize, totalResults)}</strong> trên <strong className="text-[#0B1F3A]">{totalResults}</strong> cuốn sách
              </p>

              <div className="flex items-center gap-3 flex-wrap justify-center">
                {/* Thanh điều hướng trang thông minh có dấu '...' */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {/* Về trang đầu tiên */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                    aria-label="Về trang đầu"
                    title="Về trang đầu"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Về trang trước */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                    aria-label="Trang trước"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dãy số trang với thuật toán Windowing & Ellipsis '...' */}
                  {(() => {
                    const getPageNumbers = () => {
                      if (totalPages <= 7) {
                        return Array.from({ length: totalPages }, (_, i) => i + 1);
                      }
                      if (currentPage <= 4) {
                        return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
                      }
                      if (currentPage >= totalPages - 3) {
                        return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                      }
                      return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
                    };

                    return getPageNumbers().map((item, idx) => {
                      if (typeof item === 'string') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="w-7 h-8 flex items-center justify-center text-slate-400 font-bold select-none text-xs"
                          >
                            ...
                          </span>
                        );
                      }

                      const isCurrent = currentPage === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePageChange(item)}
                          className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#0B1F3A] text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    });
                  })()}

                  {/* Sang trang sau */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                    aria-label="Trang sau"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Đến trang cuối cùng */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                    aria-label="Đến trang cuối"
                    title="Đến trang cuối"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Nhập trang trực tiếp (Jump to page) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const p = parseInt(jumpPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= totalPages) {
                      handlePageChange(p);
                      setJumpPageInput('');
                    }
                  }}
                  className="flex items-center gap-1.5 pl-3 border-l border-slate-200"
                >
                  <span className="text-xs text-slate-500 whitespace-nowrap">Đến trang:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder={currentPage.toString()}
                    className="w-14 h-8 px-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white text-slate-800 transition-colors"
                  />
                  <span className="text-xs text-slate-400 font-medium">/{totalPages}</span>
                  <button
                    type="submit"
                    className="h-8 px-2.5 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Đi
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
