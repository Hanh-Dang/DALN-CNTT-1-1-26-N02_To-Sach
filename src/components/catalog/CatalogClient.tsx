'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home, ChevronRight, LayoutGrid, List,
  ChevronLeft, ArrowUpDown, Filter, Sparkles, BookOpen
} from 'lucide-react';
import { CatalogBookCard, CatalogBookItem } from './CatalogBookCard';
import {
  CatalogFilterSidebar,
  CatalogFilterState,
  CategoryFilterItem,
  PublisherFilterItem
} from './CatalogFilterSidebar';

interface CatalogClientProps {
  initialBooks: CatalogBookItem[];
  categoriesData?: CategoryFilterItem[];
  publishersData?: PublisherFilterItem[];
  authorsData?: string[];
}

export const CatalogClient: React.FC<CatalogClientProps> = ({
  initialBooks,
  categoriesData = [],
  publishersData = [],
  authorsData = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const initialCategory = searchParams.get('category') || undefined;
  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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

  // Sync state if searchParams change from outside (e.g. Header navigation)
  useEffect(() => {
    const cat = searchParams.get('category') || undefined;
    const q = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || 'newest';

    setFilters((prev) => ({ ...prev, category: cat }));
    setSearchQuery(q);
    setSortOption(sort);
    setCurrentPage(1);
  }, [searchParams]);

  // Update URL params when filters or sort change
  const updateUrl = (newFilters: CatalogFilterState, newSort: string, query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (newFilters.category) params.set('category', newFilters.category);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    if (newFilters.priceRange) params.set('priceRange', newFilters.priceRange);
    if (newFilters.minPrice) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice) params.set('maxPrice', String(newFilters.maxPrice));

    const newUrl = params.toString() ? `/catalog?${params.toString()}` : '/catalog';
    window.history.replaceState(null, '', newUrl);
  };

  const handleFilterChange = (newFilters: CatalogFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, sortOption, searchQuery);
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
    updateUrl(emptyFilters, sortOption, '');
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    setCurrentPage(1);
    updateUrl(filters, newSort, searchQuery);
  };

  // Filter and Sort execution
  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = book.title.toLowerCase().includes(q);
        const matchAuthor = book.author.toLowerCase().includes(q);
        const matchPublisher = book.publisher.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchPublisher) return false;
      }

      // 2. Category
      if (filters.category) {
        const cat = filters.category.toLowerCase();
        // Check exact or partial slug match
        if (book.categorySlug && !book.categorySlug.toLowerCase().includes(cat) && !cat.includes(book.categorySlug.toLowerCase())) {
          return false;
        }
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

  // Pagination
  const totalResults = filteredBooks.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + pageSize);

  // Category Title
  const categoryTitle = useMemo(() => {
    if (searchQuery.trim()) return `Kết quả tìm kiếm: "${searchQuery}"`;
    if (!filters.category) return 'Tất cả Sách & Tác Phẩm';
    if (filters.category.includes('kinh-te')) return 'Sách Kinh Tế - Khởi Nghiệp';
    if (filters.category.includes('van-hoc')) return 'Sách Văn Học & Tiểu Thuyết';
    if (filters.category.includes('ky-nang') || filters.category.includes('tam-ly')) return 'Phát Triển Bản Thân & Tâm Lý';
    if (filters.category.includes('manga')) return 'Truyện Tranh - Manga';
    if (filters.category.includes('ngoai-van')) return 'Sách Ngoại Văn';
    return `Danh Mục Sách: ${filters.category}`;
  }, [searchQuery, filters.category]);

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
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Hiển thị <strong className="text-[#0B1F3A]">{startIndex + 1} - {Math.min(startIndex + pageSize, totalResults)}</strong> trên <strong className="text-[#0B1F3A]">{totalResults}</strong> kết quả
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                        ? 'bg-[#0B1F3A] text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
