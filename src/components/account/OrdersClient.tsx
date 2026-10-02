'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, Truck, Clock, CheckCircle2, XCircle, 
  ChevronRight, ArrowRight, ShoppingBag, ExternalLink,
  CreditCard, MapPin, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface OrderItemData {
  id: string;
  bookId: string;
  bookTitle: string;
  coverUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface TimelineEvent {
  status: string;
  title: string;
  description: string;
  timestamp: string;
}

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  trackingCode?: string | null;
  note?: string | null;
  timeline?: TimelineEvent[] | null;
  createdAt: string;
  items: OrderItemData[];
}

interface OrdersClientProps {
  initialOrders: OrderData[];
  userName: string;
}

type TabType = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

const TABS: { id: TabType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'SHIPPING', label: 'Đang vận chuyển' },
  { id: 'DELIVERED', label: 'Đã giao thành công' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export default function OrdersClient({ initialOrders, userName }: OrdersClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<OrderData | null>(null);

  // Lọc đơn hàng theo tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return initialOrders;
    return initialOrders.filter((order) => order.status === activeTab);
  }, [initialOrders, activeTab]);

  // Đếm số lượng theo trạng thái
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: initialOrders.length };
    initialOrders.forEach((order) => {
      map[order.status] = (map[order.status] || 0) + 1;
    });
    return map;
  }, [initialOrders]);

  // Render badge trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Chờ xác nhận</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Đã xác nhận</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đang giao hàng</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã giao thành công</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
            Lịch Sử Đơn Mua
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xin chào <strong className="text-[#0B1F3A]">{userName}</strong>, theo dõi hành trình những cuốn sách của bạn tại đây.
          </p>
        </div>

        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors self-start sm:self-auto shadow-xs"
        >
          <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
          <span>Mua thêm sách mới</span>
        </Link>
      </div>

      {/* 2. TABS NAV */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map((tab) => {
            const count = counts[tab.id] || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? 'bg-amber-400 text-[#0B1F3A]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#F5A623] mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0B1F3A]">Không tìm thấy đơn hàng nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bạn chưa có đơn đặt sách nào trong mục này. Hãy ghé thăm kho tri thức của Tổ Sách nhé!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <span>Khám phá sách ngay</span>
              <ArrowRight className="w-4 h-4 text-[#F5A623]" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-2xs hover:border-slate-300 transition-all"
            >
              {/* Order Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-[#0B1F3A]">
                    {order.orderCode}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(order.createdAt)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {renderStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="relative w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <Image
                        src={item.coverUrl}
                        alt={item.bookTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0B1F3A] line-clamp-2">
                        {item.bookTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Số lượng: <strong className="text-[#0B1F3A]">{item.quantity}</strong> × {formatVND(item.unitPrice)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="text-xs sm:text-sm font-black text-[#0B1F3A]">
                        {formatVND(item.totalPrice)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{order.shippingAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Thanh toán:</span>
                    <strong className="text-slate-700">
                      {order.paymentMethod === 'COD' ? 'Khi nhận hàng (COD)' : 'Chuyển khoản VietQR'}
                    </strong>
                    {order.paymentStatus === 'PAID' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded">
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Tổng thanh toán:</span>
                    <strong className="text-base sm:text-lg font-black text-[#F5A623]">
                      {formatVND(order.totalAmount)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút xem hành trình */}
                    <button
                      onClick={() => setSelectedOrderForTimeline(order)}
                      type="button"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Hành trình
                    </button>

                    {/* Nút xem chi tiết / QR nếu cần */}
                    <Link
                      href={`/order/success?code=${order.orderCode}`}
                      className="px-3.5 py-2 bg-[#0B1F3A] hover:bg-[#163156] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL XEM HÀNH TRÌNH ĐƠN HÀNG (TIMELINE DRAWER) */}
      {selectedOrderForTimeline && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-[#0B1F3A] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F5A623]" />
                  <span>Hành Trình Đơn Hàng</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Mã đơn: <strong>{selectedOrderForTimeline.orderCode}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderForTimeline(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Timeline steps */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {Array.isArray(selectedOrderForTimeline.timeline) && selectedOrderForTimeline.timeline.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrderForTimeline.timeline.map((event, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100 flex items-center justify-center" />
                      <div className="flex items-baseline justify-between gap-2">
                        <strong className="text-xs text-[#0B1F3A] font-bold">{event.title}</strong>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Chưa có cập nhật mới về hành trình giao hàng.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrderForTimeline(null)}
                className="px-5 py-2 bg-[#0B1F3A] text-white rounded-xl text-xs font-bold hover:bg-[#163156] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
