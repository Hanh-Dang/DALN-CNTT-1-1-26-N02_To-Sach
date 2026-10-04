'use client';

import React, { useState } from 'react';
import { 
  SlidersHorizontal, X, ChevronUp, ChevronDown, 
  Star, ShieldCheck, Check
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

export interface CatalogFilterState {
  category?: string;
  priceRange?: string; // '<50k' | '50k-100k' | '100k-200k' | '>200k' | 'custom'
  minPrice?: number;
  maxPrice?: number;
  publishers: string[];
  authors: string[];
  rating?: number;
  inStockOnly: boolean;
  preOrder: boolean;
}

export interface CategoryFilterItem {
  name: string;
  slug: string;
  count: number;
  subs?: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

export interface PublisherFilterItem {
  name: string;
  count: number;
}

interface CatalogFilterSidebarProps {
  filters: CatalogFilterState;
  onChange: (newFilters: CatalogFilterState) => void;
  onReset: () => void;
  categoriesData?: CategoryFilterItem[];
  publishersData?: PublisherFilterItem[];
  authorsData?: string[];
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  categoriesData = [],
  publishersData = [],
  authorsData = [],
}) => {
  // Collapsible sections
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [publisherOpen, setPublisherOpen] = useState(true);
  const [authorOpen, setAuthorOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  // Custom price input buffers
  const [minInput, setMinInput] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [maxInput, setMaxInput] = useState(filters.maxPrice ? String(filters.maxPrice) : '');

  // Check how many filters are active
  const hasActiveFilters = 
    Boolean(filters.category) || 
    Boolean(filters.priceRange) || 
    filters.publishers.length > 0 || 
    filters.authors.length > 0 || 
    Boolean(filters.rating) || 
    filters.inStockOnly || 
    filters.preOrder;

  // Toggle Category
  const handleSelectCategory = (catSlug: string) => {
    onChange({
      ...filters,
      category: filters.category === catSlug ? undefined : catSlug,
    });
  };

  // Toggle Quick Price
  const handleSelectPriceRange = (range: string, min?: number, max?: number) => {
    if (filters.priceRange === range) {
      onChange({
        ...filters,
        priceRange: undefined,
        minPrice: undefined,
        maxPrice: undefined,
      });
      setMinInput('');
      setMaxInput('');
    } else {
      onChange({
        ...filters,
        priceRange: range,
        minPrice: min,
        maxPrice: max,
      });
      setMinInput(min ? String(min) : '');
      setMaxInput(max ? String(max) : '');
    }
  };

  // Apply custom price
  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = minInput ? parseInt(minInput.replace(/\D/g, ''), 10) : undefined;
    const maxVal = maxInput ? parseInt(maxInput.replace(/\D/g, ''), 10) : undefined;

    onChange({
      ...filters,
      priceRange: 'custom',
      minPrice: minVal,
      maxPrice: maxVal,
    });
  };

  // Toggle Publisher
  const handleTogglePublisher = (pubName: string) => {
    const exists = filters.publishers.includes(pubName);
    const updated = exists
      ? filters.publishers.filter((p) => p !== pubName)
      : [...filters.publishers, pubName];
    onChange({ ...filters, publishers: updated });
  };

  // Toggle Author
  const handleToggleAuthor = (authorName: string) => {
    const exists = filters.authors.includes(authorName);
    const updated = exists
      ? filters.authors.filter((a) => a !== authorName)
      : [...filters.authors, authorName];
    onChange({ ...filters, authors: updated });
  };

  // Toggle Rating
  const handleSelectRating = (stars: number) => {
    onChange({
      ...filters,
      rating: filters.rating === stars ? undefined : stars,
    });
  };

  // Toggle Stock Status
  const handleToggleStock = () => {
    onChange({ ...filters, inStockOnly: !filters.inStockOnly });
  };

  const handleTogglePreOrder = () => {
    onChange({ ...filters, preOrder: !filters.preOrder });
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* 1. BỘ LỌC ĐANG CHỌN */}
      {hasActiveFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-[#0B1F3A] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Bộ lọc đang chọn</span>
            </span>
            <button
              onClick={onReset}
              className="text-xs font-bold text-[#F5A623] hover:text-[#d48811] transition-colors"
            >
              Xóa tất cả
            </button>
          </div>

          {/* Active Chips */}
          <div className="flex flex-wrap gap-1.5">
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>Ngành hàng: {filters.category}</span>
                <button
                  onClick={() => onChange({ ...filters, category: undefined })}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.priceRange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>
                  {filters.priceRange === '<50k' && '< 50.000đ'}
                  {filters.priceRange === '50k-100k' && '50k - 100.000đ'}
                  {filters.priceRange === '100k-200k' && '100k - 200.000đ'}
                  {filters.priceRange === '>200k' && '> 200.000đ'}
                  {filters.priceRange === 'custom' && `${minInput || '0'}đ - ${maxInput || '∞'}đ`}
                </span>
                <button
                  onClick={() => {
                    onChange({ ...filters, priceRange: undefined, minPrice: undefined, maxPrice: undefined });
                    setMinInput('');
                    setMaxInput('');
                  }}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.publishers.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>{p}</span>
                <button
                  onClick={() => handleTogglePublisher(p)}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.authors.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>{a}</span>
                <button
                  onClick={() => handleToggleAuthor(a)}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.rating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>Từ {filters.rating} sao</span>
                <button
                  onClick={() => onChange({ ...filters, rating: undefined })}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>Còn hàng trong kho</span>
                <button
                  onClick={handleToggleStock}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.preOrder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
                <span>Đặt trước (Pre-order)</span>
                <button
                  onClick={handleTogglePreOrder}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN ACCORDION CARD */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-6">
        
        {/* A. DANH MỤC SÁCH */}
        <div className="space-y-3">
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#0B1F3A] text-left"
          >
            <span>Danh mục sách</span>
            {catOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {catOpen && (
            <div className="space-y-3 pt-1">
              {categoriesData.map((cat) => {
                const isSelected = filters.category === cat.slug;
                return (
                  <div key={cat.slug} className="space-y-1.5">
                    <button
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`w-full flex items-center justify-between text-xs font-bold text-left transition-colors ${
                        isSelected ? 'text-[#F5A623]' : 'text-[#0B1F3A] hover:text-[#F5A623]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({cat.count})</span>
                    </button>

                    {cat.subs && cat.subs.length > 0 && (
                      <div className="pl-3 space-y-1 text-xs text-slate-600 border-l-2 border-slate-100">
                        {cat.subs.map((sub) => {
                          const isSubSelected = filters.category === sub.slug;
                          return (
                            <label
                              key={sub.slug}
                              className="flex items-center gap-2 cursor-pointer group py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={isSubSelected}
                                onChange={() => handleSelectCategory(sub.slug)}
                                className="w-3.5 h-3.5 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
                              />
                              <span className={`group-hover:text-[#0B1F3A] ${isSubSelected ? 'font-bold text-[#0B1F3A]' : ''}`}>
                                {sub.name}
                              </span>
                              <span className="ml-auto text-[10px] text-slate-400">({sub.count})</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* B. KHOẢNG GIÁ */}
        <div className="space-y-3">
          <button
            onClick={() => setPriceOpen(!priceOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#0B1F3A] text-left"
          >
            <span>Khoảng giá</span>
            {priceOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {priceOpen && (
            <div className="space-y-3 pt-1">
              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPriceRange('<50k', 0, 50000)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    filters.priceRange === '<50k'
                      ? 'bg-[#0B1F3A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  &lt; 50k
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPriceRange('50k-100k', 50000, 100000)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    filters.priceRange === '50k-100k'
                      ? 'bg-[#0B1F3A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  50k - 100k
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPriceRange('100k-200k', 100000, 200000)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    filters.priceRange === '100k-200k'
                      ? 'bg-[#0B1F3A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  100k - 200k
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPriceRange('>200k', 200000, 1000000)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    filters.priceRange === '>200k'
                      ? 'bg-[#0B1F3A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  &gt; 200k
                </button>
              </div>

              {/* Custom Min/Max Form */}
              <form onSubmit={handleApplyCustomPrice} className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Từ</span>
                    <input
                      type="text"
                      value={minInput}
                      onChange={(e) => setMinInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-xs font-bold text-[#0B1F3A] focus:outline-none"
                    />
                  </div>
                  <span className="text-slate-300 font-bold">-</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Đến</span>
                    <input
                      type="text"
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value)}
                      placeholder="500.000"
                      className="w-full bg-transparent text-xs font-bold text-[#0B1F3A] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-xs rounded-xl transition-colors"
                >
                  Lọc theo giá
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* C. NHÀ XUẤT BẢN */}
        <div className="space-y-3">
          <button
            onClick={() => setPublisherOpen(!publisherOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#0B1F3A] text-left"
          >
            <span>Nhà xuất bản</span>
            {publisherOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {publisherOpen && (
            <div className="space-y-2 pt-1">
              {publishersData.map((pub) => {
                const isChecked = filters.publishers.includes(pub.name);
                return (
                  <label
                    key={pub.name}
                    className="flex items-center gap-2 cursor-pointer group text-xs text-slate-700 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePublisher(pub.name)}
                      className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
                    />
                    <span className={`group-hover:text-[#0B1F3A] ${isChecked ? 'font-bold text-[#0B1F3A]' : ''}`}>
                      {pub.name}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-400 font-normal">({pub.count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* D. TÁC GIẢ TIÊU BIỂU */}
        <div className="space-y-3">
          <button
            onClick={() => setAuthorOpen(!authorOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#0B1F3A] text-left"
          >
            <span>Tác giả tiêu biểu</span>
            {authorOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {authorOpen && (
            <div className="space-y-2 pt-1">
              {authorsData.map((author) => {
                const isChecked = filters.authors.includes(author);
                return (
                  <label
                    key={author}
                    className="flex items-center gap-2 cursor-pointer group text-xs text-slate-700 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleAuthor(author)}
                      className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
                    />
                    <span className={`group-hover:text-[#0B1F3A] ${isChecked ? 'font-bold text-[#0B1F3A]' : ''}`}>
                      {author}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* E. ĐÁNH GIÁ SÁCH */}
        <div className="space-y-3">
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#0B1F3A] text-left"
          >
            <span>Đánh giá sách</span>
            {ratingOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {ratingOpen && (
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={filters.rating === 5}
                  onChange={() => handleSelectRating(5)}
                  className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
                />
                <span className="flex items-center gap-1 text-[#F5A623]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </span>
                <span className="text-[11px] text-slate-400">(Từ 5 sao)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={filters.rating === 4}
                  onChange={() => handleSelectRating(4)}
                  className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
                />
                <span className="flex items-center gap-1 text-[#F5A623]">
                  {[1, 2, 3, 4].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <Star className="w-3.5 h-3.5 text-slate-200" />
                </span>
                <span className="text-[11px] text-slate-400">Từ 4 sao trở lên</span>
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* F. TÌNH TRẠNG KHO */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#0B1F3A]">Tình trạng kho</h4>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-700">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={handleToggleStock}
                className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
              />
              <span className={`group-hover:text-[#0B1F3A] ${filters.inStockOnly ? 'font-bold text-[#0B1F3A]' : ''}`}>
                Còn hàng trong kho
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-700">
              <input
                type="checkbox"
                checked={filters.preOrder}
                onChange={handleTogglePreOrder}
                className="w-4 h-4 rounded text-[#0B1F3A] accent-[#0B1F3A] cursor-pointer"
              />
              <span className={`group-hover:text-[#0B1F3A] ${filters.preOrder ? 'font-bold text-[#0B1F3A]' : ''}`}>
                Có thể đặt trước (Pre-order)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. CAM KẾT CHÍNH HÃNG TRUST CARD */}
      <div className="bg-[#E8F0FE] rounded-2xl p-4.5 shadow-sm border border-blue-100 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-[#0B1F3A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-xs text-[#0B1F3A]">Cam kết chính hãng</h5>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            100% sách phát hành chính thức từ các nhà xuất bản uy tín. Đổi trả miễn phí trong vòng 7 ngày nếu có lỗi in ấn.
          </p>
        </div>
      </div>
    </aside>
  );
};
