'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  CreditCard,
  Printer,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { formatVND, formatDateVN, formatDateTimeVN } from '@/lib/utils';

export interface AdminOrderItem {
  id: string;
  bookId: string;
  bookTitle?: string;
  coverUrl?: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  book?: {
    id: string;
    title: string;
    coverUrl: string;
    publisher?: string | null;
  } | null;
}

export interface AdminTimelineEvent {
  status?: string;
  title: string;
  description?: string;
  desc?: string;
  operator?: string;
  timestamp?: string;
  time?: string;
}

export interface AdminOrderData {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  subtotal: number | null;
  shippingFee: number | null;
  totalAmount: number | null;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  trackingCode?: string | null;
  note?: string | null;
  timeline?: AdminTimelineEvent[] | null;
  createdAt: string;
  items: AdminOrderItem[];
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
  } | null;
}

interface AdminOrdersClientProps {
  initialOrders: AdminOrderData[];
  initialPagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  initialCounts?: Record<string, number>;
  canManageOrders: boolean;
  currentUser: {
    fullName: string;
    role: string;
  } | null;
  initialOrderCode?: string;
  initialStatus?: string;
}

type TabType = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'ALL', label: 'Tất cả đơn', color: 'bg-slate-100 text-slate-800' },
  { id: 'PENDING', label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-900' },
  { id: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-900' },
  { id: 'SHIPPING', label: 'Đang giao', color: 'bg-sky-100 text-sky-900' },
  { id: 'DELIVERED', label: 'Đã giao thành công', color: 'bg-emerald-100 text-emerald-900' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'bg-rose-100 text-rose-900' },
];

export function AdminOrdersClient({
  initialOrders,
  initialPagination,
  initialCounts,
  canManageOrders,
  currentUser,
  initialOrderCode = '',
  initialStatus = '',
}: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<AdminOrderData[]>(initialOrders);
  const [pagination, setPagination] = useState(
    initialPagination || {
      page: 1,
      limit: 10,
      totalCount: initialOrders.length,
      totalPages: Math.ceil(initialOrders.length / 10) || 1,
    }
  );
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    initialCounts || { ALL: initialOrders.length }
  );
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(false);

  const [activeTab, setActiveTab] = useState<TabType>(
    ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(initialStatus)
      ? (initialStatus as TabType)
      : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(initialOrderCode);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'BANK_TRANSFER'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Drawer states
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // Order ID being updated
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScanningExpired, setIsScanningExpired] = useState(false);

  // Xử lý quét hủy đơn chuyển khoản quá hạn 24h (M10)
  const handleScanExpiredOrders = async () => {
    if (
      !confirm(
        'Bạn có chắc chắn muốn quét và tự động hủy các đơn hàng chuyển khoản VietQR quá hạn 24 giờ chưa thanh toán? Số sách trong các đơn này sẽ được tự động hoàn trả về kho.'
      )
    ) {
      return;
    }

    setIsScanningExpired(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/orders/cancel-expired', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi quét đơn quá hạn');
      }

      setToastMessage(data.message);
      if (data.cancelledCount > 0 && Array.isArray(data.cancelledOrderCodes)) {
        const cancelledSet = new Set(data.cancelledOrderCodes);
        setOrders((prev) =>
          prev.map((o) =>
            cancelledSet.has(o.orderCode)
              ? { ...o, status: 'CANCELLED', paymentStatus: 'FAILED' }
              : o
          )
        );
        // Cập nhật lại đếm
        setStatusCounts((prev) => ({
          ...prev,
          PENDING: Math.max(0, (prev.PENDING || 0) - data.cancelledCount),
          CANCELLED: (prev.CANCELLED || 0) + data.cancelledCount,
        }));
      }
    } catch (err: any) {
      setActionError(err.message || 'Không thể quét đơn quá hạn');
    } finally {
      setIsScanningExpired(false);
    }
  };

  // Tự động mở drawer chi tiết đơn hàng khi có initialOrderCode từ URL
  useEffect(() => {
    if (initialOrderCode) {
      const targetCode = initialOrderCode.trim().toLowerCase();
      setSearchQuery(initialOrderCode.trim());
      setActiveTab('ALL');
      const found = orders.find(
        (o) =>
          o.orderCode.toLowerCase() === targetCode ||
          o.id.toLowerCase() === targetCode
      );
      if (found) {
        setSelectedOrder(found);
      }
    }
  }, [initialOrderCode, orders]);

  // Lắng nghe sự kiện click từ chuông thông báo khi Admin đang ở cùng trang /admin/orders
  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ orderCode?: string }>;
      const code = customEvent.detail?.orderCode;
      if (code) {
        const targetCode = code.trim().toLowerCase();
        setSearchQuery(code.trim());
        setActiveTab('ALL');
        const found = orders.find(
          (o) =>
            o.orderCode.toLowerCase() === targetCode ||
            o.id.toLowerCase() === targetCode
        );
        if (found) {
          setSelectedOrder(found);
        }
      }
    };
    window.addEventListener('tosach_open_order', handleCustomOpen);
    return () => window.removeEventListener('tosach_open_order', handleCustomOpen);
  }, [orders]);

  // Modal Giao hàng kèm mã vận đơn
  const [shippingModalOrder, setShippingModalOrder] = useState<AdminOrderData | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Modal Hủy đơn Admin
  const [cancellingModalOrder, setCancellingModalOrder] = useState<AdminOrderData | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Khách hàng yêu cầu hủy đơn');

  // Gọi API lấy dữ liệu động từ CSDL khi chuyển tab, tìm kiếm, đổi phương thức hoặc đổi trang (M14)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('limit', '10');
        if (activeTab !== 'ALL') params.set('status', activeTab);
        if (paymentFilter !== 'ALL') params.set('paymentMethod', paymentFilter);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          if (data.pagination) setPagination(data.pagination);
          if (data.counts) setStatusCounts(data.counts);
        }
      } catch (err) {
        console.error('Lỗi khi tải đơn hàng:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, activeTab, paymentFilter, searchQuery]);

  // Tự động reset về trang 1 khi thay đổi điều kiện lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, paymentFilter, searchQuery]);

  const counts = statusCounts;
  const totalPages = pagination.totalPages;

  // Hàm gọi API chuyển trạng thái đơn hàng
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED',
    options?: { note?: string; trackingCode?: string }
  ) => {
    setIsUpdatingStatus(orderId);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: options?.note,
          trackingCode: options?.trackingCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật trạng thái đơn hàng');
      }

      // Cập nhật state cục bộ
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
      );

      // Nếu đang mở modal chi tiết đơn này thì cập nhật luôn
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...data.order } : null));
      }

      // Đóng các modal phụ
      setShippingModalOrder(null);
      setCancellingModalOrder(null);

      const statusLabels = {
        CONFIRMED: 'Đã duyệt đơn và chuyển sang bộ phận kho chuẩn bị sách!',
        SHIPPING: 'Đã bàn giao đơn hàng cho đơn vị vận chuyển!',
        DELIVERED: 'Đã hoàn tất đơn hàng thành công!',
        CANCELLED: 'Đã hủy đơn hàng và hoàn trả số lượng sách về kho!',
      };

      setToastMessage(statusLabels[newStatus] || 'Cập nhật thành công!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi thao tác');
      alert('Không thể cập nhật đơn: ' + err.message);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Mở modal giao hàng
  const handleOpenShippingModal = (order: AdminOrderData) => {
    setShippingModalOrder(order);
    const randomTracking = `GHTK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setTrackingInput(order.trackingCode || randomTracking);
  };

  // Badge hiển thị trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Chờ duyệt</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Đã xác nhận</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>Đang giao</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã giao</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A]">
              Quản Lý Đơn Hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-xs font-black">
              {counts.PENDING || 0} đơn chờ duyệt
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Xác nhận đơn, chuyển kho đóng gói và cập nhật hành trình vận chuyển cho độc giả Tổ Sách.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!canManageOrders && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Chế độ Chỉ Xem (Cần quyền MANAGE_ORDERS để duyệt đơn)</span>
            </div>
          )}

          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl bg-[#F0F3FF] text-[#0B1F3A] hover:bg-[#DEE8FF] text-xs font-bold transition-colors shadow-2xs"
          >
            ← Về Dashboard
          </Link>
        </div>
      </div>

      {/* 2. TABS & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 space-y-4">
        {/* TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {TABS.map((tab) => {
            const count = counts[tab.id] || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-[#FEAE2C] text-[#291800]' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn #TS..., tên khách, SĐT..."
              className="w-full pl-9 pr-3 py-2 bg-[#F0F3FF] text-xs text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1F3A]/20 border border-transparent focus:border-slate-300 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 flex-wrap">
            <span className="font-semibold">Thanh toán:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="p-1.5 bg-[#F0F3FF] border border-slate-200 rounded-xl text-xs font-bold text-[#0B1F3A] focus:outline-none"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="COD">Thu tiền khi giao (COD)</option>
              <option value="BANK_TRANSFER">Chuyển khoản VietQR</option>
            </select>

            {/* Nút quét hủy đơn quá hạn 24h (Quyền canManageOrders) */}
            {canManageOrders && (
              <button
                type="button"
                disabled={isScanningExpired}
                onClick={handleScanExpiredOrders}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-auto sm:ml-2"
                title="Quét và tự động hủy các đơn hàng chuyển khoản VietQR quá hạn 24 giờ để hoàn kho sách (M10)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningExpired ? 'animate-spin' : ''}`} />
                <span>{isScanningExpired ? 'Đang quét...' : 'Quét hủy đơn quá hạn 24h'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-[#0B1F3A] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F5A623]" />
              <span>Đang tải dữ liệu đơn hàng...</span>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700">
              Không tìm thấy đơn hàng nào phù hợp
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc bấm tab "Tất cả đơn" để xem toàn bộ danh sách.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3 px-3.5">MÃ ĐƠN & PHƯƠNG THỨC</th>
                  <th className="py-3 px-3">KHÁCH HÀNG & LIÊN HỆ</th>
                  <th className="py-3 px-3">SẢN PHẨM SÁCH</th>
                  <th className="py-3 px-3">TỔNG TIỀN</th>
                  <th className="py-3 px-3">TRẠNG THÁI</th>
                  <th className="py-3 px-3">NGÀY ĐẶT</th>
                  <th className="py-3 px-3.5 text-right">THAO TÁC DUYỆT ĐƠN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const customerName = order.customerName || order.user?.fullName || 'Khách vãng lai';
                  const firstItem = order.items[0];
                  const bookTitle = firstItem?.bookTitle || firstItem?.book?.title || 'Tổ Sách Tuyển Chọn';
                  const bookCover = firstItem?.coverUrl || firstItem?.book?.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                  const totalCopies = order.items.reduce((s, i) => s + i.quantity, 0);
                  const isUpdating = isUpdatingStatus === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F0F3FF]/40 transition-colors group"
                    >
                      {/* Cột 1: Mã đơn & Phương thức */}
                      <td className="py-3.5 px-3.5 font-mono">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-bold text-[#0B1F3A] hover:underline text-xs flex items-center gap-1 text-left cursor-pointer"
                        >
                          <span>#{order.orderCode}</span>
                        </button>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              order.paymentMethod === 'COD'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-sky-50 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {order.paymentMethod === 'COD' ? 'COD' : 'VietQR'}
                          </span>
                          {order.paymentStatus === 'PAID' && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded">
                              ✓ Đã TT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#111C2D] truncate max-w-[150px]">
                          {customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.customerPhone}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[180px]">
                          {order.shippingAddress}
                        </div>
                      </td>

                      {/* Cột 3: Sản phẩm sách */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-11 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                            <Image
                              src={bookCover}
                              alt={bookTitle}
                              fill
                              sizes="32px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[190px]">
                              {bookTitle}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {firstItem?.quantity} cuốn{' '}
                              {totalCopies > (firstItem?.quantity || 1) && (
                                <strong className="text-[#0B1F3A]">
                                  (+{totalCopies - (firstItem?.quantity || 1)} cuốn khác)
                                </strong>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Tổng tiền */}
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-[#0B1F3A] text-xs">
                          {order.totalAmount != null ? formatVND(order.totalAmount) : '—'}
                        </span>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3.5 px-3">{renderStatusBadge(order.status)}</td>

                      {/* Cột 6: Ngày đặt */}
                      <td className="py-3.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateTimeVN(order.createdAt)}
                      </td>

                      {/* Cột 7: Thao tác nhanh (Quyền MANAGE_ORDERS) */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Nút DUYỆT ĐƠN (PENDING -> CONFIRMED) */}
                          {canManageOrders && order.status === 'PENDING' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                              type="button"
                              className="px-2.5 py-1.5 bg-[#0B1F3A] hover:bg-[#1E3A5F] text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Xác nhận đơn và chuyển cho kho chuẩn bị sách"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>Duyệt đơn</span>
                            </button>
                          )}

                          {/* Nút GIAO HÀNG (CONFIRMED -> SHIPPING) */}
                          {canManageOrders && order.status === 'CONFIRMED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleOpenShippingModal(order)}
                              type="button"
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Bàn giao đơn hàng cho shipper"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Giao hàng</span>
                            </button>
                          )}

                          {/* Nút HOÀN TẤT (SHIPPING -> DELIVERED) */}
                          {canManageOrders && order.status === 'SHIPPING' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              type="button"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Xác nhận khách đã nhận sách thành công"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã giao xong</span>
                            </button>
                          )}

                          {/* Nút HỦY ĐƠN (Chỉ cho phép khi PENDING hoặc CONFIRMED) */}
                          {canManageOrders &&
                            (order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                              <button
                                disabled={isUpdating}
                                onClick={() => setCancellingModalOrder(order)}
                                type="button"
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                title="Hủy đơn hàng này và hoàn lại sách vào kho"
                              >
                                Hủy
                              </button>
                            )}

                          {/* Nút Xem chi tiết */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            type="button"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Xem chi tiết đơn hàng & In phiếu xuất kho"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination (10 đơn hàng / trang) */}
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-100 text-xs bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500">
              <span>
                Hiển thị{' '}
                {(currentPage - 1) * pagination.limit + 1}{' '}
                - {Math.min(currentPage * pagination.limit, pagination.totalCount)} trên tổng số{' '}
                <strong className="text-slate-800">{pagination.totalCount}</strong> đơn hàng
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

      {/* 4. MODAL CHI TIẾT ĐƠN HÀNG & IN PHIẾU XUẤT KHO (ORDER DETAIL DRAWER) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-[#0B1F3A]">
                    Đơn hàng #{selectedOrder.orderCode}
                  </span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Ngày đặt:{' '}
                  {formatDateTimeVN(selectedOrder.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                {/* Nút in phiếu đóng gói */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="In phiếu xuất kho và đóng gói"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In phiếu</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Thông tin người nhận & Vận chuyển */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F0F3FF]/50 border border-slate-100 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-[#0B1F3A] uppercase text-[10px] tracking-wider block">
                  Người nhận hàng:
                </span>
                <p className="font-bold text-slate-800 text-sm">
                  {selectedOrder.customerName || selectedOrder.user?.fullName}
                </p>
                <p className="text-slate-600 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedOrder.customerPhone}</span>
                </p>
                <p className="text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedOrder.shippingAddress}</span>
                </p>
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                <span className="font-bold text-[#0B1F3A] uppercase text-[10px] tracking-wider block">
                  Thông tin giao dịch:
                </span>
                <p className="text-slate-700">
                  Phương thức:{' '}
                  <strong>
                    {selectedOrder.paymentMethod === 'COD'
                      ? 'Thu tiền khi giao hàng (COD)'
                      : 'Chuyển khoản VietQR'}
                  </strong>
                </p>
                <p className="text-slate-700">
                  Thanh toán:{' '}
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      selectedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                  </span>
                </p>
                {selectedOrder.trackingCode && (
                  <p className="text-slate-700">
                    Mã vận đơn:{' '}
                    <strong className="font-mono text-blue-700">
                      {selectedOrder.trackingCode}
                    </strong>
                  </p>
                )}
                {selectedOrder.note && (
                  <p className="text-slate-500 italic">
                    Ghi chú: "{selectedOrder.note}"
                  </p>
                )}
              </div>
            </div>

            {/* Danh sách sách trong đơn */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#0B1F3A] uppercase tracking-wider">
                Sản phẩm trong kiện hàng ({selectedOrder.items.length} đầu sách):
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item) => {
                  const title = item.bookTitle || item.book?.title || 'Tổ Sách';
                  const cover = item.coverUrl || item.book?.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                  return (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-14 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <Image
                            src={cover}
                            alt={title}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {title}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {item.unitPrice != null ? formatVND(item.unitPrice) : '••••'} ×{' '}
                            <strong className="text-[#0B1F3A]">{item.quantity}</strong>
                          </span>
                        </div>
                      </div>

                      <strong className="font-bold text-[#0B1F3A] shrink-0">
                        {item.totalPrice != null ? formatVND(item.totalPrice) : '••••'}
                      </strong>
                    </div>
                  );
                })}
              </div>

              {/* Tổng kết tiền */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính tiền sách:</span>
                  <span>{selectedOrder.subtotal != null ? formatVND(selectedOrder.subtotal) : '••••'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span>{selectedOrder.shippingFee != null ? formatVND(selectedOrder.shippingFee) : '••••'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-[#0B1F3A]">
                  <span>Tổng thanh toán:</span>
                  <span className="text-[#F5A623]">
                    {selectedOrder.totalAmount != null ? formatVND(selectedOrder.totalAmount) : '••••'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Lịch sử duyệt đơn */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#0B1F3A] uppercase tracking-wider">
                Lịch sử hành trình:
              </h4>
              <div className="space-y-2 text-xs">
                {Array.isArray(selectedOrder.timeline) && selectedOrder.timeline.length > 0 ? (
                  selectedOrder.timeline.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800">{evt.title}</strong>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTimeVN(evt.timestamp || evt.time)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {evt.description || evt.desc}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Chưa có nhật ký ghi nhận thêm.
                  </p>
                )}
              </div>
            </div>

            {/* Footer hành động của Modal */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {/* Các nút duyệt trực tiếp từ trong Modal */}
              {canManageOrders && selectedOrder.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                  className="px-4 py-2 bg-[#0B1F3A] text-white rounded-xl text-xs font-bold hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                >
                  ✓ Duyệt đơn ngay
                </button>
              )}

              {canManageOrders && selectedOrder.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleOpenShippingModal(selectedOrder)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  🚚 Giao hàng cho Shipper
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL NHẬP MÃ VẬN ĐƠN KHI CHUYỂN SANG GIAO HÀNG (SHIPPING) */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-[#0B1F3A] flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Bàn Giao Vận Chuyển: #{shippingModalOrder.orderCode}</span>
              </h3>
              <button
                onClick={() => setShippingModalOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Mã vận đơn bưu cục (GHTK / GHN / ViettelPost):
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="VD: GHTK-89218491"
                className="w-full p-2.5 bg-[#F0F3FF] border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              />
              <p className="text-[11px] text-slate-400">
                Mã này sẽ hiển thị trực tiếp cho khách hàng trong lịch sử đơn mua để theo dõi định vị kiện sách.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(shippingModalOrder.id, 'SHIPPING', {
                    trackingCode: trackingInput.trim() || undefined,
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Xuất kho & Giao hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL HỦY ĐƠN TỪ PHÍA ADMIN */}
      {cancellingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-rose-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Hủy Đơn Hàng: #{cancellingModalOrder.orderCode}</span>
              </h3>
              <button
                onClick={() => setCancellingModalOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl text-xs text-rose-800">
              ⚠️ Lưu ý: Sau khi xác nhận hủy, toàn bộ số lượng sách trong đơn này sẽ được tự động hoàn lại vào tồn kho (Stock Rollback).
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Lý do hủy đơn quản trị:
              </label>
              <textarea
                rows={2}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingModalOrder(null)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(cancellingModalOrder.id, 'CANCELLED', {
                    note: cancelReasonInput.trim(),
                  })
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TOAST THÔNG BÁO HOÀN TẤT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1F3A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
