'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Download,
  Upload,
  PlusCircle,
  Layers,
  X,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react';

export interface AdminBookItem {
  id: string;
  title: string;
  slug: string;
  isbn: string | null;
  publisher: string | null;
  publishYear: number | null;
  pageCount: number | null;
  originalPrice: number;
  price: number;
  stockQty: number;
  soldCount: number;
  coverUrl: string;
  format: string | null;
  description: string | null;
  authors: { author: { id: string; name: string } }[];
  categories: { category: { id: string; name: string } }[];
  createdAt: string;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

interface AdminBooksClientProps {
  initialBooks: AdminBookItem[];
  categories: AdminCategoryItem[];
  canManageBooks: boolean;
  currentUser: { fullName: string; role: string } | null;
  initialQuery?: string;
}

type StockFilterType = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function AdminBooksClient({
  initialBooks,
  categories,
  canManageBooks,
  currentUser,
  initialQuery = '',
}: AdminBooksClientProps) {
  const router = useRouter();
  const [books, setBooks] = useState<AdminBookItem[]>(initialBooks);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedStatus, setSelectedStatus] = useState<StockFilterType>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [selectedPublisher, setSelectedPublisher] = useState('ALL');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Đồng bộ tìm kiếm khi có initialQuery từ URL hoặc từ Notification Bell
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setSelectedStatus('ALL');
    }
  }, [initialQuery]);

  useEffect(() => {
    const handleCustomBook = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      const q = customEvent.detail?.query;
      if (q) {
        setSearchQuery(q);
        setSelectedStatus('ALL');
      }
    };
    window.addEventListener('tosach_open_book', handleCustomBook);
    return () => window.removeEventListener('tosach_open_book', handleCustomBook);
  }, []);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedBookForAction, setSelectedBookForAction] = useState<AdminBookItem | null>(null);

  // Loading & Notification states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for Create / Edit
  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    categoryId: categories[0]?.id || '',
    publisher: 'NXB Trẻ',
    isbn: '',
    originalPrice: 120000,
    price: 99000,
    stockQty: 25,
    coverUrl: '',
    description: '',
    format: 'Bìa mềm',
    pageCount: 320,
    publishYear: 2024,
  });

  // Form state for Restock
  const [restockData, setRestockData] = useState({
    addedQty: 50,
    supplier: 'NXB Trẻ',
    note: 'Nhập bổ sung đơn hàng bán chạy',
  });

  // Form state for CSV Import
  const [csvRawText, setCsvRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Unique publishers list
  const publishers = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.publisher) set.add(b.publisher);
    });
    return Array.from(set);
  }, [books]);

  // Stock counts
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalStock = books.reduce((sum, b) => sum + b.stockQty, 0);
    const safeStock = books.filter((b) => b.stockQty > 10).length;
    const lowStock = books.filter((b) => b.stockQty > 0 && b.stockQty <= 10).length;
    const outOfStock = books.filter((b) => b.stockQty <= 0).length;
    return { totalTitles, totalStock, safeStock, lowStock, outOfStock };
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const author = b.authors[0]?.author?.name?.toLowerCase() || '';
        const titleMatch = b.title.toLowerCase().includes(query);
        const isbnMatch = (b.isbn || '').toLowerCase().includes(query);
        const authorMatch = author.includes(query);
        const pubMatch = (b.publisher || '').toLowerCase().includes(query);
        if (!titleMatch && !isbnMatch && !authorMatch && !pubMatch) return false;
      }

      // 2. Status filter
      if (selectedStatus === 'IN_STOCK' && b.stockQty <= 10) return false;
      if (selectedStatus === 'LOW_STOCK' && (b.stockQty <= 0 || b.stockQty > 10)) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && b.stockQty > 0) return false;

      // 3. Category filter
      if (selectedCategoryId !== 'ALL') {
        const hasCat = b.categories.some((c) => c.category.id === selectedCategoryId);
        if (!hasCat) return false;
      }

      // 4. Publisher filter
      if (selectedPublisher !== 'ALL' && b.publisher !== selectedPublisher) {
        return false;
      }

      return true;
    });
  }, [books, searchQuery, selectedStatus, selectedCategoryId, selectedPublisher]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / pageSize) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  // Handlers for selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBookIds(paginatedBooks.map((b) => b.id));
    } else {
      setSelectedBookIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      authorName: '',
      categoryId: categories[0]?.id || '',
      publisher: 'NXB Trẻ',
      isbn: '',
      originalPrice: 120000,
      price: 99000,
      stockQty: 25,
      coverUrl: '',
      description: '',
      format: 'Bìa mềm',
      pageCount: 320,
      publishYear: 2024,
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (book: AdminBookItem) => {
    setSelectedBookForAction(book);
    setFormData({
      title: book.title,
      authorName: book.authors[0]?.author?.name || '',
      categoryId: book.categories[0]?.category?.id || categories[0]?.id || '',
      publisher: book.publisher || 'NXB Trẻ',
      isbn: book.isbn || '',
      originalPrice: book.originalPrice,
      price: book.price,
      stockQty: book.stockQty,
      coverUrl: book.coverUrl,
      description: book.description || '',
      format: book.format || 'Bìa mềm',
      pageCount: book.pageCount || 300,
      publishYear: book.publishYear || 2024,
    });
    setIsEditModalOpen(true);
  };

  // Open Restock Modal
  const handleOpenRestockModal = (book?: AdminBookItem) => {
    const target = book || paginatedBooks[0];
    setSelectedBookForAction(target || null);
    setRestockData({
      addedQty: 50,
      supplier: target?.publisher || 'NXB Trẻ',
      note: 'Nhập bổ sung kho định kỳ',
    });
    setIsRestockModalOpen(true);
  };

  // Submit Create Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.coverUrl.trim()) {
      showToast('Vui lòng nhập tựa sách và link ảnh bìa!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo sách');

      setBooks((prev) => [data.book, ...prev]);
      setIsCreateModalOpen(false);
      showToast(`Đã thêm sách "${data.book.title}" thành công!`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Book
  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForAction) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_BOOK',
          bookId: selectedBookForAction.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật sách');

      setBooks((prev) =>
        prev.map((b) => (b.id === selectedBookForAction.id ? data.book : b))
      );
      setIsEditModalOpen(false);
      showToast(`Đã cập nhật sách "${data.book.title}" thành công!`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Restock
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForAction) {
      showToast('Vui lòng chọn sách cần nhập kho!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESTOCK',
          bookId: selectedBookForAction.id,
          addedQty: restockData.addedQty,
          supplier: restockData.supplier,
          note: restockData.note,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi nhập kho');

      setBooks((prev) =>
        prev.map((b) => (b.id === selectedBookForAction.id ? data.book : b))
      );
      setIsRestockModalOpen(false);
      showToast(data.message || 'Nhập kho thành công!');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (books.length === 0) {
      showToast('Không có dữ liệu để xuất!', 'error');
      return;
    }

    const headers = [
      'ID',
      'Mã SKU/ISBN',
      'Tựa sách',
      'Tác giả',
      'Thể loại',
      'Nhà xuất bản',
      'Giá bìa (VND)',
      'Giá bán (VND)',
      'Tồn kho (Cuốn)',
      'Đã bán',
      'Trạng thái kho',
    ];

    const rows = books.map((b) => {
      const author = b.authors[0]?.author?.name || 'Nhiều tác giả';
      const category = b.categories[0]?.category?.name || 'Văn học';
      const statusText =
        b.stockQty <= 0
          ? 'Cháy hàng'
          : b.stockQty <= 10
          ? 'Sắp hết hàng'
          : 'Còn hàng';
      return [
        b.id,
        b.isbn || 'N/A',
        `"${b.title.replace(/"/g, '""')}"`,
        `"${author.replace(/"/g, '""')}"`,
        `"${category.replace(/"/g, '""')}"`,
        `"${(b.publisher || '').replace(/"/g, '""')}"`,
        b.originalPrice,
        b.price,
        b.stockQty,
        b.soldCount,
        statusText,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Bao_cao_ton_kho_ToSach_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất báo cáo tồn kho thành công!');
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
    };
    reader.readAsText(file);
  };

  // Submit CSV Import
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) {
      showToast('Vui lòng chọn file CSV hoặc dán nội dung CSV!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/books/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvRawText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi nạp CSV');

      showToast(data.message || 'Nạp sách từ CSV thành công!');
      setIsCsvModalOpen(false);
      setCsvRawText('');
      window.location.reload();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Helper
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
              Quản lý Kho Sách
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6E3FF] text-[#071C36] text-[11px] uppercase font-bold tracking-wider">
              KHO ĐANG VẬN HÀNH
            </span>
            {!canManageBooks && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-medium">
                Chế độ xem (Chỉ đọc)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống theo dõi {stats.totalTitles.toLocaleString('vi-VN')} tựa sách, tổng cộng{' '}
            <strong className="text-slate-700">{stats.totalStock.toLocaleString('vi-VN')}</strong> cuốn trong kho
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Xuất Excel */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E7EEFF] text-[#111C2D] hover:bg-[#D8E3FB] text-xs font-semibold transition-colors cursor-pointer"
            type="button"
            title="Xuất file báo cáo toàn bộ tồn kho"
          >
            <Download className="w-4 h-4 text-[#0B1F3A]" />
            <span>Xuất Excel / CSV</span>
          </button>

          {/* Nút Import CSV */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            disabled={!canManageBooks}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              canManageBooks
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
            title="Nạp nhanh danh sách sách từ file CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ CSV</span>
          </button>

          {/* Nút Tạo phiếu nhập kho */}
          <button
            onClick={() => handleOpenRestockModal()}
            disabled={!canManageBooks}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors ${
              canManageBooks
                ? 'bg-[#FEAE2C] text-[#6B4500] hover:bg-amber-400 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
          >
            <Upload className="w-4 h-4" />
            <span>Tạo phiếu nhập kho</span>
          </button>

          {/* Nút Thêm tựa sách mới */}
          <button
            onClick={handleOpenCreateModal}
            disabled={!canManageBooks}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors ${
              canManageBooks
                ? 'bg-[#0B1F3A] text-white hover:bg-[#263143] cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Thêm tựa sách mới</span>
          </button>
        </div>
      </div>

      {/* 2. 4 STAT CARDS (CLICKABLE FOR QUICK FILTER) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tổng tựa sách quản lý */}
        <div
          onClick={() => {
            setSelectedStatus('ALL');
            setCurrentPage(1);
          }}
          className={`cursor-pointer relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border transition-all ${
            selectedStatus === 'ALL'
              ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/10'
              : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Tổng tựa sách quản lý
              </span>
              <p className="mt-1 text-2xl font-bold text-[#0B1F3A] tracking-tight">
                {stats.totalTitles.toLocaleString('vi-VN')}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A]">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <span className="font-semibold text-slate-800">
              {stats.totalStock.toLocaleString('vi-VN')} cuốn tồn kho
            </span>
            <span className="text-slate-500">{categories.length} danh mục</span>
          </div>
        </div>

        {/* Card 2: Tồn kho an toàn */}
        <div
          onClick={() => {
            setSelectedStatus('IN_STOCK');
            setCurrentPage(1);
          }}
          className={`cursor-pointer relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border transition-all ${
            selectedStatus === 'IN_STOCK'
              ? 'border-emerald-600 ring-2 ring-emerald-600/10'
              : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Tồn kho an toàn (&gt;10)
              </span>
              <p className="mt-1 text-2xl font-bold text-[#0B1F3A] tracking-tight">
                {stats.safeStock.toLocaleString('vi-VN')}{' '}
                <span className="text-sm font-normal text-slate-500">tựa</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A]">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] font-bold">
              {stats.totalTitles > 0
                ? ((stats.safeStock / stats.totalTitles) * 100).toFixed(1)
                : 0}
              % an toàn
            </div>
            <span className="text-slate-500">&gt; định mức min</span>
          </div>
        </div>

        {/* Card 3: Cảnh báo sắp hết */}
        <div
          onClick={() => {
            setSelectedStatus('LOW_STOCK');
            setCurrentPage(1);
          }}
          className={`cursor-pointer relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border transition-all ${
            selectedStatus === 'LOW_STOCK'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Cảnh báo sắp hết (&le;10 cuốn)
              </span>
              <p className="mt-1 text-2xl font-bold text-[#835500] tracking-tight">
                {stats.lowStock}{' '}
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
            <span className="text-slate-500">ưu tiên tiếp tế</span>
          </div>
        </div>

        {/* Card 4: Hết hàng xuất kho */}
        <div
          onClick={() => {
            setSelectedStatus('OUT_OF_STOCK');
            setCurrentPage(1);
          }}
          className={`cursor-pointer relative overflow-hidden bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border transition-all ${
            selectedStatus === 'OUT_OF_STOCK'
              ? 'border-red-500 ring-2 ring-red-500/10'
              : 'border-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Hết hàng xuất kho (0 cuốn)
              </span>
              <p className="mt-1 text-2xl font-bold text-[#BA1A1A] tracking-tight">
                {stats.outOfStock}{' '}
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
            <span className="text-[#BA1A1A] text-xs font-medium">Cần tạo phiếu nhập</span>
          </div>
        </div>
      </div>

      {/* 3. TABLE SECTION WITH TABS & FILTERS */}
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
              type="button"
            >
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedStatus === 'ALL' ? 'bg-white/20' : 'bg-slate-100'
                }`}
              >
                {stats.totalTitles}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedStatus('IN_STOCK');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === 'IN_STOCK'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#F0F3FF]'
              }`}
              type="button"
            >
              <span>Còn hàng</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedStatus === 'IN_STOCK' ? 'bg-white/20' : 'bg-slate-100'
                }`}
              >
                {stats.safeStock}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedStatus('LOW_STOCK');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === 'LOW_STOCK'
                  ? 'bg-[#835500] text-white shadow-xs'
                  : 'text-[#835500] hover:bg-[#FFDDB4]/40'
              }`}
              type="button"
            >
              <span>Sắp hết hàng</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'LOW_STOCK' ? 'bg-white/20' : 'bg-[#FFDDB4] text-[#6B4500]'
                }`}
              >
                {stats.lowStock}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedStatus('OUT_OF_STOCK');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === 'OUT_OF_STOCK'
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'text-[#BA1A1A] hover:bg-[#FFDAD6]/40'
              }`}
              type="button"
            >
              <span>Đã hết hàng</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'OUT_OF_STOCK' ? 'bg-white/20' : 'bg-[#FFDAD6] text-[#93000A]'
                }`}
              >
                {stats.outOfStock}
              </span>
            </button>
          </div>

          {/* Search & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center min-w-[220px]">
              <Search className="w-4 h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên sách, SKU, tác giả..."
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

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#F0F3FF] text-xs font-medium text-[#111C2D] border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả thể loại</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Publisher Dropdown */}
            <div className="relative">
              <select
                value={selectedPublisher}
                onChange={(e) => {
                  setSelectedPublisher(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#F0F3FF] text-xs font-medium text-[#111C2D] border border-transparent focus:border-[#0B1F3A]/30 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả NXB</option>
                {publishers.map((pub) => (
                  <option key={pub} value={pub}>
                    {pub}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200/80">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedBooks.length > 0 &&
                      paginatedBooks.every((b) => selectedBookIds.includes(b.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 min-w-[140px]">MÃ SKU / ISBN</th>
                <th className="py-3 px-3 min-w-[280px]">TỰA SÁCH & TÁC GIẢ</th>
                <th className="py-3 px-3 min-w-[150px]">THỂ LOẠI</th>
                <th className="py-3 px-3 min-w-[150px]">VỊ TRÍ KỆ</th>
                <th className="py-3 px-3 min-w-[120px]">TỒN KHO</th>
                <th className="py-3 px-3 min-w-[130px]">GIÁ BÁN / BÌA</th>
                <th className="py-3 px-3 min-w-[120px]">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-right min-w-[140px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">Không tìm thấy sách nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc trạng thái.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book, idx) => {
                  const authorName = book.authors[0]?.author?.name || 'Nhiều tác giả';
                  const categoryName = book.categories[0]?.category?.name || 'Văn học';
                  const shelfCode = ['B-04', 'A-02', 'C-11', 'B-08', 'B-02', 'D-01', 'A-05', 'D-03'][idx % 8];
                  const shelfFloor = (idx % 4) + 1;
                  const skuCode = book.isbn ? `TS-${book.isbn.slice(-6)}` : `TS-BK-00${idx + 1}`;
                  const isSelected = selectedBookIds.includes(book.id);

                  return (
                    <tr
                      key={book.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-50/50' : 'hover:bg-[#F0F3FF]/60'
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(book.id)}
                          className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]/30 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold font-mono text-[13px] text-[#0B1F3A] tracking-tight">
                            {skuCode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono tracking-wide">
                            {book.isbn || 'Chưa có ISBN'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-14 rounded shadow-xs shrink-0 border border-slate-200 overflow-hidden relative bg-slate-50">
                            {book.coverUrl ? (
                              <Image
                                src={book.coverUrl}
                                alt={book.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <BookOpen className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 max-w-[200px] sm:max-w-[240px]">
                            <span
                              onClick={() => handleOpenEditModal(book)}
                              className="font-bold text-[#111C2D] truncate hover:text-amber-600 cursor-pointer transition-colors"
                              title={book.title}
                            >
                              {book.title}
                            </span>
                            <span className="text-slate-500 text-[11px] truncate">
                              {authorName}
                            </span>
                            <span className="text-slate-400 text-[10px] truncate">
                              {book.publisher || 'NXB'} • {book.publishYear || ''}
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
                          <span
                            className={`font-bold text-[13px] ${
                              book.stockQty <= 0
                                ? 'text-red-600'
                                : book.stockQty <= 10
                                ? 'text-amber-600'
                                : 'text-[#111C2D]'
                            }`}
                          >
                            {book.stockQty}{' '}
                            <span className="text-[11px] font-normal text-slate-500">cuốn</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Đã bán: {book.soldCount}
                          </span>
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
                          {/* Sửa thông tin */}
                          <button
                            onClick={() => handleOpenEditModal(book)}
                            disabled={!canManageBooks}
                            className={`p-1.5 rounded transition-colors ${
                              canManageBooks
                                ? 'hover:bg-[#E7EEFF] text-slate-600 hover:text-[#0B1F3A] cursor-pointer'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={canManageBooks ? 'Sửa thông tin sách' : 'Cần quyền MANAGE_BOOKS'}
                            type="button"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Nhập thêm hàng */}
                          <button
                            onClick={() => handleOpenRestockModal(book)}
                            disabled={!canManageBooks}
                            className={`p-1.5 rounded transition-colors ${
                              canManageBooks
                                ? 'bg-[#FFDDB4]/50 hover:bg-[#FFDDB4] text-[#6B4500] cursor-pointer'
                                : 'text-slate-300 bg-slate-100 cursor-not-allowed'
                            }`}
                            title={canManageBooks ? 'Nhập thêm vào kho' : 'Cần quyền MANAGE_BOOKS'}
                            type="button"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>

                          {/* Xem trên storefront */}
                          <Link
                            href={`/book/${book.slug}`}
                            target="_blank"
                            className="p-1.5 rounded hover:bg-[#E7EEFF] text-slate-600 hover:text-[#111C2D] transition-colors"
                            title="Xem trang bán của độc giả"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>
              Hiển thị{' '}
              {filteredBooks.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}{' '}
              - {Math.min(currentPage * pageSize, filteredBooks.length)} trên tổng số{' '}
              <strong className="text-slate-800">{filteredBooks.length}</strong> tựa sách
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-2.5 py-1 rounded transition-colors ${
                currentPage <= 1
                  ? 'bg-[#F0F3FF] text-slate-400 cursor-not-allowed'
                  : 'bg-[#F0F3FF] text-slate-700 hover:bg-slate-200 cursor-pointer'
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
                        : 'hover:bg-[#F0F3FF] text-slate-700'
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
                  ? 'bg-[#F0F3FF] text-slate-400 cursor-not-allowed'
                  : 'bg-[#F0F3FF] text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
              type="button"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL: THÊM TỰA SÁCH MỚI                               */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111C2D]">Thêm Tựa Sách Mới Vào Kho</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tựa sách */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tựa sách <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Hoàng Tử Bé (Bản kỷ niệm 80 năm)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Tác giả */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tác giả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Ví dụ: Antoine de Saint-Exupéry"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Thể loại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Danh mục / Thể loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nhà xuất bản */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Ví dụ: NXB Kim Đồng, NXB Trẻ..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* ISBN */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="Ví dụ: 978-604-2-08567-8"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Giá bìa gốc */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bìa (VND)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, originalPrice: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Giá bán thực tế */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giá bán thực tế (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Số lượng nhập ban đầu */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số lượng nhập kho ban đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQty}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQty: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Định dạng */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Định dạng sách</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  >
                    <option value="Bìa mềm">Bìa mềm</option>
                    <option value="Bìa cứng">Bìa cứng</option>
                    <option value="Boxset">Boxset (Bộ hộp)</option>
                  </select>
                </div>

                {/* Ảnh bìa URL */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    URL Ảnh bìa <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={formData.coverUrl}
                      onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                      placeholder="https://... hoặc /images/books/..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                    />
                    {formData.coverUrl && (
                      <div className="w-9 h-10 rounded border border-slate-200 overflow-hidden relative shrink-0">
                        <Image
                          src={formData.coverUrl}
                          alt="preview"
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mô tả sách */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tóm tắt / Giới thiệu sách</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Nội dung giới thiệu tác phẩm..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#263143] text-white font-bold flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu Sách Vào Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: SỬA THÔNG TIN SÁCH                              */}
      {/* ======================================================== */}
      {isEditModalOpen && selectedBookForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111C2D]">Chỉnh Sửa Thông Tin Sách</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedBookForAction.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditBook} className="mt-4 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tựa sách */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tựa sách</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Tác giả */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Thể loại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thể loại</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giá bìa */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bìa gốc (VND)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, originalPrice: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Giá bán */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bán (VND)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Tồn kho */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQty}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQty: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Nhà xuất bản */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>

                {/* Ảnh bìa URL */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">URL Ảnh bìa</label>
                  <input
                    type="text"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                  />
                </div>
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
                  <span>Cập Nhật Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: PHIẾU NHẬP KHO / RESTOCK                       */}
      {/* ======================================================== */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FEAE2C] text-[#6B4500] flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111C2D]">Tạo Phiếu Nhập Kho</h3>
                  <p className="text-[11px] text-slate-500">Cộng dồn số lượng tồn kho theo thực tế</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="mt-4 flex flex-col gap-4 text-xs">
              {/* Chọn tựa sách */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn Tựa Sách Cần Nhập <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBookForAction?.id || ''}
                  onChange={(e) => {
                    const b = books.find((item) => item.id === e.target.value);
                    if (b) {
                      setSelectedBookForAction(b);
                      setRestockData((prev) => ({
                        ...prev,
                        supplier: b.publisher || 'NXB Trẻ',
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (Hiện còn: {b.stockQty} cuốn)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBookForAction && (
                <div className="p-3 bg-[#F0F3FF] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-11 relative rounded overflow-hidden shrink-0">
                      <Image
                        src={selectedBookForAction.coverUrl}
                        alt="cover"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#0B1F3A] truncate max-w-[200px]">
                        {selectedBookForAction.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Tồn kho hiện tại:{' '}
                        <strong className="text-slate-800">{selectedBookForAction.stockQty}</strong>{' '}
                        cuốn
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Dự kiến sau nhập:</span>
                    <p className="font-bold text-emerald-600 text-sm">
                      {selectedBookForAction.stockQty + (restockData.addedQty || 0)} cuốn
                    </p>
                  </div>
                </div>
              )}

              {/* Số lượng nhập */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số lượng nhập thêm (+ cuốn) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockData.addedQty}
                  onChange={(e) =>
                    setRestockData({
                      ...restockData,
                      addedQty: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              {/* Nhà cung cấp / NXB */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Đơn vị tiếp tế / Nhà in</label>
                <input
                  type="text"
                  value={restockData.supplier}
                  onChange={(e) =>
                    setRestockData({ ...restockData, supplier: e.target.value })
                  }
                  placeholder="Ví dụ: NXB Trẻ, Công ty Phát hành FAHASA..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú phiếu nhập</label>
                <input
                  type="text"
                  value={restockData.note}
                  onChange={(e) => setRestockData({ ...restockData, note: e.target.value })}
                  placeholder="Ví dụ: Đợt hàng định kỳ Q4/2026..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#FEAE2C] hover:bg-amber-400 text-[#6B4500] font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Xác Nhận Nhập Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: NẠP DỮ LIỆU TỪ CSV                              */}
      {/* ======================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111C2D]">Nhập Sách Hàng Loạt Từ CSV</h3>
                  <p className="text-[11px] text-slate-500">
                    Tương thích với định dạng file <code className="bg-slate-100 px-1 py-0.5 rounded">books.csv</code> của dự án
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn file CSV từ máy tính:
                </label>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0B1F3A] file:text-white hover:file:bg-[#263143] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Hoặc dán trực tiếp nội dung CSV vào đây:
                  </label>
                  {csvRawText && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Đã nạp {csvRawText.split('\n').filter((l) => l.trim()).length - 1} dòng sách
                    </span>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder="title,slug,author,isbn,publisher,originalPrice,price,stockQty..."
                  className="w-full font-mono text-[11px] p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-lg text-amber-800 text-[11px] leading-relaxed">
                💡 <strong>Quy tắc nạp:</strong> Nếu tựa sách hoặc slug đã tồn tại trong Database, hệ thống sẽ tự động cập nhật lại giá và số lượng tồn kho. Nếu là tựa sách mới, hệ thống sẽ tạo mới và tự động gán vào Thể loại & Tác giả tương ứng!
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !csvRawText.trim()}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Bắt Đầu Nạp Vào DB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
