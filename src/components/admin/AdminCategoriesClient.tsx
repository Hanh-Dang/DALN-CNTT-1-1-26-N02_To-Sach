'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderTree,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface AdminCategoryData {
  id: string;
  name: string;
  slug: string;
  level: number;
  sortOrder: number;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string; slug: string; level: number } | null;
  _count: {
    books: number;
    children: number;
  };
}

interface AdminCategoriesClientProps {
  initialCategories: AdminCategoryData[];
  canManageCategories: boolean;
  currentUser: { fullName: string; role: string } | null;
}

export function AdminCategoriesClient({
  initialCategories,
  canManageCategories,
  currentUser,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategoryData[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryData | null>(null);

  // Loading & Toast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    level: 1,
    sortOrder: 0,
    imageUrl: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stats
  const stats = useMemo(() => {
    const total = categories.length;
    const l1 = categories.filter((c) => c.level === 1).length;
    const l2 = categories.filter((c) => c.level === 2).length;
    const l3 = categories.filter((c) => c.level === 3).length;
    const totalBooks = categories.reduce((sum, c) => sum + c._count.books, 0);
    return { total, l1, l2, l3, totalBooks };
  }, [categories]);

  // Candidates for parent category (Levels 1 and 2 only)
  const potentialParents = useMemo(() => {
    return categories.filter((c) => c.level < 3);
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (selectedLevel !== 'ALL' && c.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = c.name.toLowerCase().includes(q);
        const slugMatch = c.slug.toLowerCase().includes(q);
        const parentMatch = c.parent?.name?.toLowerCase().includes(q) || false;
        if (!nameMatch && !slugMatch && !parentMatch) return false;
      }
      return true;
    });
  }, [categories, selectedLevel, searchQuery]);

  // Phân trang 10 danh mục / trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  // Open Create Modal
  const handleOpenCreateModal = (presetParentId?: string) => {
    let presetLevel = 1;
    if (presetParentId) {
      const p = categories.find((c) => c.id === presetParentId);
      if (p) presetLevel = Math.min(3, p.level + 1);
    }
    setFormData({
      name: '',
      slug: '',
      parentId: presetParentId || '',
      level: presetLevel,
      sortOrder: 0,
      imageUrl: '',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: AdminCategoryData) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId || '',
      level: cat.level,
      sortOrder: cat.sortOrder,
      imageUrl: cat.imageUrl || '',
    });
    setIsEditModalOpen(true);
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo danh mục');

      setCategories((prev) => [...prev, data.category]);
      setIsCreateModalOpen(false);
      showToast(`Đã thêm danh mục "${data.category.name}" thành công!`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCategory.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật danh mục');

      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory.id ? data.category : c))
      );
      setIsEditModalOpen(false);
      showToast(`Đã cập nhật danh mục "${data.category.name}" thành công!`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: AdminCategoryData) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa');

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast(data.message || 'Đã xóa danh mục thành công!');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const renderLevelBadge = (level: number) => {
    if (level === 1) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0B1F3A] text-white text-[10px] font-bold tracking-wide">
          CẤP 1 • NGÀNH HÀNG
        </span>
      );
    }
    if (level === 2) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FEAE2C] text-[#523300] text-[10px] font-bold tracking-wide">
          CẤP 2 • CHUYÊN MỤC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E7EEFF] text-[#071C36] text-[10px] font-bold tracking-wide">
        CẤP 3 • CHI TIẾT
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full gap-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === 'success'
              ? 'bg-[#0B1F3A] text-white border border-white/10'
              : 'bg-[#BA1A1A] text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111C2D]">
              Quản lý Cây Danh Mục Sách
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6E3FF] text-[#071C36] text-[11px] uppercase font-bold tracking-wider">
              3 CẤP ĐỘ PHÂN TẦNG
            </span>
            {!canManageCategories && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-medium">
                Chế độ xem (Chỉ đọc)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tổ chức toàn diện {stats.total} danh mục, bao gồm {stats.l1} ngành hàng cha,{' '}
            {stats.l2} chuyên mục và {stats.l3} thể loại chi tiết
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenCreateModal()}
            disabled={!canManageCategories}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors ${
              canManageCategories
                ? 'bg-[#0B1F3A] text-white hover:bg-[#263143] cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Thêm Danh Mục Mới</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng Danh Mục
          </span>
          <p className="mt-1 text-2xl font-bold text-[#0B1F3A]">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Trên toàn hệ thống</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cấp 1: Ngành Hàng
          </span>
          <p className="mt-1 text-2xl font-bold text-[#0B1F3A]">{stats.l1}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Mega Menu chính</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cấp 2: Chuyên Mục
          </span>
          <p className="mt-1 text-2xl font-bold text-[#835500]">{stats.l2}</p>
          <span className="text-[11px] text-slate-400">Nhánh phân loại phụ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cấp 3: Chi Tiết
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.l3}</p>
          <span className="text-[11px] text-slate-400">Thể loại gắn sách</span>
        </div>
      </div>

      {/* 3. TABLE / LIST SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Level Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedLevel === 'ALL'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setSelectedLevel(1)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedLevel === 1
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
            >
              Cấp 1 • Ngành hàng ({stats.l1})
            </button>
            <button
              onClick={() => setSelectedLevel(2)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedLevel === 2
                  ? 'bg-[#FEAE2C] text-[#523300] shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
            >
              Cấp 2 • Chuyên mục ({stats.l2})
            </button>
            <button
              onClick={() => setSelectedLevel(3)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedLevel === 3
                  ? 'bg-[#DEE8FF] text-[#071C36] shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
            >
              Cấp 3 • Thể loại ({stats.l3})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-4 h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên danh mục, slug..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F0F3FF] text-xs text-[#111C2D] placeholder:text-slate-400 border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200/80">
                <th className="py-3 px-3 min-w-[220px]">TÊN DANH MỤC</th>
                <th className="py-3 px-3 min-w-[150px]">PHÂN CẤP</th>
                <th className="py-3 px-3 min-w-[200px]">DANH MỤC CHA (PARENT)</th>
                <th className="py-3 px-3 min-w-[150px]">ĐƯỜNG DẪN (SLUG)</th>
                <th className="py-3 px-3 text-center min-w-[100px]">MỤC CON</th>
                <th className="py-3 px-3 text-center min-w-[100px]">SÁCH TRỰC THUỘC</th>
                <th className="py-3 px-3 text-right min-w-[120px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">Không tìm thấy danh mục nào</p>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F0F3FF]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {cat.level === 2 && <span className="text-slate-300 pl-4">↳</span>}
                        {cat.level === 3 && <span className="text-slate-300 pl-8">↳</span>}
                        <span className="font-bold text-[#111C2D]">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{renderLevelBadge(cat.level)}</td>
                    <td className="py-3 px-3">
                      {cat.parent ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {cat.parent.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">-- (Là gốc) --</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      /{cat.slug}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-[#0B1F3A]">{cat._count.children}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {cat._count.books} sách
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Thêm con (nếu level < 3) */}
                        {cat.level < 3 && canManageCategories && (
                          <button
                            onClick={() => handleOpenCreateModal(cat.id)}
                            className="p-1.5 rounded hover:bg-[#E7EEFF] text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                            title={`Thêm danh mục con vào "${cat.name}"`}
                            type="button"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Sửa */}
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          disabled={!canManageCategories}
                          className={`p-1.5 rounded transition-colors ${
                            canManageCategories
                              ? 'hover:bg-[#E7EEFF] text-slate-600 hover:text-[#0B1F3A] cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title="Sửa danh mục"
                          type="button"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Xóa */}
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={!canManageCategories}
                          className={`p-1.5 rounded transition-colors ${
                            canManageCategories
                              ? 'hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title="Xóa danh mục"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination (10 danh mục / trang) */}
        {filteredCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>
                Hiển thị{' '}
                {(currentPage - 1) * pageSize + 1}{' '}
                - {Math.min(currentPage * pageSize, filteredCategories.length)} trên tổng số{' '}
                <strong className="text-slate-800">{filteredCategories.length}</strong> danh mục
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

      {/* ======================================================== */}
      {/* 4. MODAL: THÊM DANH MỤC MỚI                              */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111C2D]">Thêm Danh Mục Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Khoa Học & Viễn Tưởng"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Danh mục cha (Trực thuộc)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => {
                    const parentId = e.target.value;
                    let level = 1;
                    if (parentId) {
                      const p = categories.find((c) => c.id === parentId);
                      if (p) level = Math.min(3, p.level + 1);
                    }
                    setFormData({ ...formData, parentId, level });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                >
                  <option value="">-- Không có (Tạo Ngành hàng Cấp 1 gốc) --</option>
                  {potentialParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.level === 1 ? '• ' : '   -- '}
                      {p.name} (Cấp {p.level})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dự kiến phân cấp: Cấp {formData.level}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đường dẫn Slug (Tùy chọn)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Để trống hệ thống sẽ tự sinh tự động"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thứ tự sắp xếp (Số nhỏ xếp trước)</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#263143] text-white font-bold flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Tạo Danh Mục</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: SỬA DANH MỤC                                   */}
      {/* ======================================================== */}
      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#111C2D]">Chỉnh Sửa Danh Mục</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Danh mục cha</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                >
                  <option value="">-- Không có (Cấp 1 Gốc) --</option>
                  {potentialParents
                    .filter((p) => p.id !== selectedCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Cấp {p.level})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đường dẫn Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#263143] text-white font-bold flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
