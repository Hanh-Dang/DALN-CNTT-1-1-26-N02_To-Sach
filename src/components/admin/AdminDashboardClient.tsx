'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  ShoppingBag,
  Clock3,
  AlertTriangle,
  ArrowRight,
  Download,
  Send,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  Truck,
  Sparkles,
  Zap,
  Check,
  X,
  Radio,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { CountUpNumber } from './CountUpNumber';
import { playNotificationSound } from '@/lib/sound';

export interface RecentOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  firstBookTitle: string;
  extraItemsCount: number;
  totalAmount: number;
  status: string;
  createdAt: string | Date;
  timeAgo: string;
  isNew?: boolean;
}

export interface LowStockBookItem {
  id: string;
  title: string;
  shelf: string;
  coverUrl: string;
  stockQty: number;
  minStock: number;
}

export interface DashboardChartBar {
  label: string;
  revTarget: string;
  qtyTarget: string;
  revVal: string;
  qtyVal: string;
  isToday?: boolean;
}

interface AdminDashboardClientProps {
  user: {
    fullName?: string;
    role?: string;
  } | null;
  initialData: {
    revenue: number;
    ordersCount: number;
    pendingCount: number;
    lowStockCount: number;
    totalCirculatedBooks?: number;
    chartData?: DashboardChartBar[];
    lowStockList: LowStockBookItem[];
    recentOrders: RecentOrderItem[];
    canViewRevenue?: boolean;
  };
}

export function AdminDashboardClient({ user, initialData }: AdminDashboardClientProps) {
  const canViewRevenue = initialData.canViewRevenue !== false;
  // State số liệu thực tế từ Database
  const [revenue, setRevenue] = useState(initialData.revenue);
  const [ordersCount, setOrdersCount] = useState(initialData.ordersCount);
  const [pendingCount, setPendingCount] = useState(initialData.pendingCount);
  const [lowStockCount, setLowStockCount] = useState(initialData.lowStockCount);
  const [lowStockList, setLowStockList] = useState(initialData.lowStockList);
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>(initialData.recentOrders);
  const [chartData, setChartData] = useState<DashboardChartBar[]>(
    initialData.chartData || [
      { label: 'T.07', revTarget: '40%', qtyTarget: '25%', revVal: '2.5M', qtyVal: '14 cuốn' },
      { label: 'T.08', revTarget: '55%', qtyTarget: '38%', revVal: '4.2M', qtyVal: '26 cuốn' },
      { label: 'T.09', revTarget: '78%', qtyTarget: '58%', revVal: '8.8M', qtyVal: '48 cuốn' },
      { label: '01/10', revTarget: '48%', qtyTarget: '32%', revVal: '2.0M', qtyVal: '12 cuốn' },
      { label: '04/10', revTarget: '68%', qtyTarget: '50%', revVal: '3.2M', qtyVal: '18 cuốn' },
      { label: '07/10', revTarget: '50%', qtyTarget: '35%', revVal: '2.1M', qtyVal: '11 cuốn' },
      { label: 'Hôm nay', revTarget: '88%', qtyTarget: '65%', revVal: '3.8M', qtyVal: '20 cuốn', isToday: true },
    ]
  );
  const [totalCirculatedBooks, setTotalCirculatedBooks] = useState(
    initialData.totalCirculatedBooks || 158
  );

  // State hiệu ứng hoạt họa biểu đồ (chạy từ 0 lên)
  const [chartsAnimated, setChartsAnimated] = useState(false);

  // State Realtime & Polling
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Vừa xong');
  const [newOrderToast, setNewOrderToast] = useState<{
    visible: boolean;
    orderCode: string;
    customerName: string;
    amount: number;
    bookTitle: string;
  } | null>(null);

  const prevOrderCountRef = useRef(initialData.ordersCount);
  const isSimulatingRef = useRef(false);

  // 1. KÍCH HOẠT HIỆU ỨNG BIỂU ĐỒ MỌC TỪ 0 LÊN KHI VÀO TRANG
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartsAnimated(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // 2. HÀM TẢI DỮ LIỆU REALTIME TỪ API
  const fetchRealtimeData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/dashboard/realtime');
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;

        // Kiểm tra xem có đơn hàng mới phát sinh không
        if (d.ordersCount > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
          const newestOrder = d.recentOrders[0];
          if (newestOrder) {
            // Phát âm thanh chuông báo tinh tế
            playNotificationSound();

            // Hiển thị Toast thông báo đơn hàng mới
            setNewOrderToast({
              visible: true,
              orderCode: newestOrder.orderCode,
              customerName: newestOrder.customerName,
              amount: newestOrder.totalAmount,
              bookTitle: newestOrder.firstBookTitle,
            });

            // Đánh dấu dòng đơn hàng mới có hiệu ứng highlight
            newestOrder.isNew = true;
          }
        }

        prevOrderCountRef.current = d.ordersCount;
        if (d.canViewRevenue !== false) {
          setRevenue(d.revenue);
        }
        setOrdersCount(d.ordersCount);
        setPendingCount(d.pendingCount);
        setLowStockCount(d.lowStockCount);
        if (d.lowStockList?.length) setLowStockList(d.lowStockList);
        if (d.recentOrders?.length) setRecentOrders(d.recentOrders);
        if (d.chartData?.length) setChartData(d.chartData);
        if (d.totalCirculatedBooks) setTotalCirculatedBooks(d.totalCirculatedBooks);

        const now = new Date();
        setLastSyncTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      }
    } catch (err) {
      console.error('Lỗi khi fetch realtime dashboard:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  // 3. TỰ ĐỘNG LẬP LỊCH POLLING REALTIME MỖI 8 GIÂY
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeData(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  // 4. HÀM GIẢ LẬP ĐƠN HÀNG MỚI (DÀNH CHO BẢO VỆ ĐỒ ÁN / DEMO TRỰC TIẾP)
  const handleSimulateNewOrder = async () => {
    if (isSimulatingRef.current) return;
    isSimulatingRef.current = true;
    setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/dashboard/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_order' }),
      });
      const json = await res.json();

      if (json.success && json.order) {
        // Cập nhật ngay lập tức các chỉ số trên màn hình
        playNotificationSound();
        const o = json.order;

        setNewOrderToast({
          visible: true,
          orderCode: o.orderCode,
          customerName: o.customerName,
          amount: o.totalAmount,
          bookTitle: o.firstBookTitle,
        });

        // Kích hoạt đồng bộ lại toàn bộ số liệu
        await fetchRealtimeData(false);
      }
    } catch (error) {
      console.error('Lỗi giả lập đơn mới:', error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        isSimulatingRef.current = false;
      }, 600);
    }
  };

  // Helper render trạng thái đơn hàng
  const renderOrderStatusBadge = (status: string, idx: number) => {
    if (status === 'PENDING' || idx === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#835500] animate-pulse"></span>
          Chờ đóng gói
        </span>
      );
    }
    if (status === 'CONFIRMED' || idx === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DEE8FF] text-[#111C2D] text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4D5F7D]"></span>
          Đang soạn hàng
        </span>
      );
    }
    if (status === 'SHIPPING' || idx === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
          <Truck className="w-3 h-3 text-sky-700" />
          Đang giao hàng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
        Đã hoàn tất
      </span>
    );
  };



  // Tỷ trọng thể loại sách bán chạy
  const categoryRatios = [
    { name: 'Văn học kinh điển', targetPercent: '38%', color: 'bg-[#0B1F3A]', textColor: 'text-[#0B1F3A]' },
    { name: 'Tâm lý - Kỹ năng sống', targetPercent: '28%', color: 'bg-[#FEAE2C]', textColor: 'text-[#835500]' },
    { name: 'Triết học & Khoa học', targetPercent: '20%', color: 'bg-[#4D5F7D]', textColor: 'text-slate-800' },
    { name: 'Kinh tế - Đầu tư', targetPercent: '14%', color: 'bg-[#CFDAF2]', textColor: 'text-slate-800' },
  ];

  return (
    <div className="flex flex-col w-full gap-6 relative">
      {/* 🔔 FLOATING REALTIME TOAST NOTIFICATION (KHI CÓ ĐƠN HÀNG MỚI) */}
      {newOrderToast?.visible && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full bg-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-500/80 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                ĐƠN HÀNG MỚI PHÁT SINH!
              </span>
              <button
                onClick={() => setNewOrderToast(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-[#111C2D] mt-1 truncate">
              #{newOrderToast.orderCode} · {newOrderToast.customerName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {newOrderToast.bookTitle}
            </p>
            <div className="mt-1 text-xs font-bold text-emerald-600">
              +{formatVND(newOrderToast.amount)}
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER BANNER (Xin chào + Indicator Realtime + Buttons) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111C2D]">
              Xin chào, Quản trị viên {user?.fullName || 'Nguyễn Minh Triết'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] uppercase font-bold">
              Trực ca kho
            </span>
          </div>

          {/* CHỈ BÁO REALTIME LIVE BADGE */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>TRỰC TIẾP (REALTIME)</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px]">
              Đồng bộ lúc: <strong className="text-slate-700">{lastSyncTime}</strong> (Tự động cập nhật mỗi 8s)
            </span>
          </div>
        </div>

        {/* NÚT THAO TÁC & GIẢ LẬP DEMO */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Làm mới thủ công */}
          <button
            type="button"
            onClick={() => fetchRealtimeData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Đồng bộ dữ liệu ngay lập tức"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0B1F3A]' : ''}`} />
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          {/* NÚT GIẢ LẬP ĐƠN HÀNG MỚI ĐẶC BIỆT CHO BẢO VỆ ĐỒ ÁN */}
          <button
            type="button"
            onClick={handleSimulateNewOrder}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            title="Tạo đơn hàng khách mới vào database để biểu diễn số nhảy & âm thanh realtime"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>⚡ Giả lập đơn khách mới (Demo)</span>
          </button>

          {/* Xuất báo cáo */}
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E7EEFF] text-[#111C2D] hover:bg-[#D8E3FB] text-xs font-semibold transition-colors"
            type="button"
          >
            <Download className="w-4 h-4 text-[#0B1F3A]" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#18365f] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Xuất kho nhanh</span>
          </Link>
        </div>
      </div>

      {/* 2. CÁC THẺ CHỈ SỐ CỐT LÕI (4 THẺ CHO ADMIN, 3 THẺ CHO NHÂN VIÊN) */}
      <div
        className={`grid gap-4 sm:gap-5 ${
          canViewRevenue
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {/* CARD 1: DOANH THU (CHỈ HIỂN THỊ VỚI ADMIN / NGƯỜI CÓ QUYỀN VIEW_REVENUE, BỎ HẲN Ở NHÂN VIÊN) */}
        {canViewRevenue && (
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  Doanh thu tháng này
                </span>
                <p className="mt-1 text-2xl font-black text-[#0B1F3A] tracking-tight">
                  <CountUpNumber value={revenue} duration={1500} formatType="currency" />
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A] group-hover:scale-110 transition-transform shadow-2xs">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-slate-50 text-xs">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                +18.4%
              </div>
              <span className="text-slate-500 text-xs font-medium">so với tháng 09</span>
            </div>
          </div>
        )}

        {/* CARD 2: ĐƠN HÀNG HOÀN TẤT */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Đơn hàng hoàn tất
              </span>
              <p className="mt-1 text-2xl font-black text-[#0B1F3A] tracking-tight flex items-baseline gap-1.5">
                <CountUpNumber value={ordersCount} duration={1400} formatType="number" />
                <span className="text-sm font-normal text-slate-500">đơn</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F0F3FF] flex items-center justify-center text-[#0B1F3A] group-hover:scale-110 transition-transform shadow-2xs">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6FFBBE]/40 text-[#005236] text-[11px] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              +12.6%
            </div>
            <span className="text-slate-500 text-xs font-medium">tỷ lệ giao đạt 99.1%</span>
          </div>
        </div>

        {/* CARD 3: CHỜ XỬ LÝ & ĐÓNG GÓI */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Chờ xử lý & đóng gói
              </span>
              <p className="mt-1 text-2xl font-black text-[#835500] tracking-tight flex items-baseline gap-1.5">
                <CountUpNumber value={pendingCount} duration={1200} formatType="number" />
                <span className="text-sm font-normal text-slate-500">đơn</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FFDDB4] flex items-center justify-center text-[#6B4500] group-hover:scale-110 transition-transform shadow-2xs">
              <Clock3 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEAE2C] text-[#6B4500] text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              Cần duyệt trong ca
            </div>
            <span className="text-slate-500 text-xs font-medium">SLA &lt; 2 giờ</span>
          </div>
        </div>

        {/* CARD 4: TỒN KHO CẢNH BÁO ĐỎ */}
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Tồn kho cảnh báo đỏ
              </span>
              <p className="mt-1 text-2xl font-black text-[#BA1A1A] tracking-tight flex items-baseline gap-1.5">
                <CountUpNumber value={lowStockCount} duration={1200} formatType="number" />
                <span className="text-sm font-normal text-slate-500">tựa sách</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A] group-hover:scale-110 transition-transform shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-slate-50 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A] text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Dưới định mức min (10)
            </div>
            <span className="text-[#BA1A1A] text-xs font-bold">Cần nhập sớm</span>
          </div>
        </div>
      </div>

      {/* 3. KHU VỰC TRUNG TÂM (8 CỘT BÊN TRÁI, 4 CỘT BÊN PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (8 CỘT): BIỂU ĐỒ DOANH SỐ CHẠY TỪ 0 & DANH SÁCH ĐƠN HÀNG */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* BIỂU ĐỒ DOANH THU & LƯỢNG SÁCH (CHẠY TỪ 0 LÊN VỚI HIỆU ỨNG LƯỢN SÓNG) */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#111C2D] flex items-center gap-2">
                  <span>
                    {canViewRevenue
                      ? 'Biểu đồ Doanh thu & Lượng sách bán ra (30 ngày qua)'
                      : 'Biểu đồ Lượng sách bán ra (30 ngày qua)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                    Live Wave
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đã luân chuyển thành công tổng cộng {totalCirculatedBooks.toLocaleString('vi-VN')} cuốn sách ra thị trường
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {canViewRevenue && (
                  <span className="flex items-center gap-1.5 text-[#111C2D] font-medium">
                    <span className="w-3 h-3 rounded-full bg-[#0B1F3A] inline-block shadow-2xs"></span>
                    Doanh thu (triệu đồng)
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[#111C2D] font-medium">
                  <span className="w-3 h-3 rounded-full bg-[#FEAE2C] inline-block shadow-2xs"></span>
                  Lượng bán (cuốn)
                </span>
              </div>
            </div>

            {/* Khung vẽ cột biểu đồ động */}
            <div className="w-full h-56 flex flex-col justify-end pt-6">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-slate-100 pb-1">
                {chartData.map((bar, idx) => {
                  const targetRevHeight = chartsAnimated ? bar.revTarget : '0%';
                  const targetQtyHeight = chartsAnimated ? bar.qtyTarget : '0%';

                  return (
                    <div
                      key={bar.label}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip khi rê chuột vào cột */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 bg-[#0B1F3A] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
                        {canViewRevenue && <div>Doanh thu: {bar.revVal}</div>}
                        <div className="text-amber-300">Bán: {bar.qtyVal}</div>
                      </div>

                      {/* Cột Doanh thu (Màu Xanh Hải Quân #0B1F3A) */}
                      {canViewRevenue && (
                        <div
                          className={`w-full max-w-[14px] bg-[#0B1F3A] rounded-t transition-all duration-1000 ease-out group-hover:brightness-125 shadow-xs`}
                          style={{
                            height: targetRevHeight,
                            transitionDelay: `${idx * 100}ms`,
                          }}
                        ></div>
                      )}

                      {/* Cột Số lượng (Màu Vàng Cam #FEAE2C) */}
                      <div
                        className={`w-full max-w-[14px] bg-[#FEAE2C] rounded-t -mt-1 transition-all duration-1000 ease-out group-hover:brightness-110 shadow-xs`}
                        style={{
                          height: targetQtyHeight,
                          transitionDelay: `${idx * 100 + 50}ms`,
                        }}
                      ></div>

                      {/* Nhãn ngày bên dưới */}
                      <span
                        className={`text-[10px] pt-1.5 transition-colors ${
                          bar.isToday ? 'text-[#0B1F3A] font-bold' : 'text-slate-500 font-semibold group-hover:text-[#0B1F3A]'
                        }`}
                      >
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BẢNG ĐƠN HÀNG CẦN XỬ LÝ (CẬP NHẬT TRỰC TIẾP KHI CÓ ĐƠN MỚI) */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111C2D]">
                  Đơn hàng cần xử lý xuất kho mới nhất
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEAE2C] text-[#6B4500] text-[11px] font-bold">
                  {pendingCount} đơn mới
                </span>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#0B1F3A] hover:text-amber-600 inline-flex items-center gap-1 transition-colors"
              >
                <span>Xem tất cả đơn</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">Mã đơn</th>
                    <th className="py-2.5 px-3">Khách hàng</th>
                    <th className="py-2.5 px-3">Tựa sách chính</th>
                    <th className="py-2.5 px-3">Tổng tiền</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-[#111C2D] divide-y divide-slate-100">
                  {recentOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`transition-all duration-500 hover:bg-[#F0F3FF]/60 ${
                        order.isNew ? 'bg-emerald-50/70 font-semibold ring-1 ring-emerald-300' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-[#0B1F3A] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {order.isNew && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          )}
                          <span>#{order.orderCode}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-[#111C2D] truncate max-w-[140px]">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {order.customerPhone}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="font-medium text-[#111C2D] truncate block">
                          {order.firstBookTitle}
                        </span>
                        {order.extraItemsCount > 0 && (
                          <span className="text-slate-400 text-[10px]">
                            + {order.extraItemsCount} quyển khác
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-extrabold text-[#0B1F3A] whitespace-nowrap">
                        {formatVND(order.totalAmount)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderOrderStatusBadge(order.status, idx)}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {order.timeAgo}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders`}
                          className="px-2.5 py-1 bg-[#0B1F3A] hover:bg-[#1f3f6c] text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs inline-block"
                        >
                          Duyệt & In
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 CỘT): SÁCH SẮP HẾT & TỶ TRỌNG THỂ LOẠI FILL ĐỘNG */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* SÁCH SẮP HẾT KHO CẦN NHẬP */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#BA1A1A] stroke-[2.5]" />
                <h3 className="text-sm font-bold text-[#111C2D]">Sách sắp hết kho cần nhập</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-[10px] font-bold">
                {lowStockList.length} tựa gấp
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {lowStockList.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F3FF] border border-slate-100/60 hover:bg-[#DEE8FF]/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-12 rounded-lg bg-slate-200 shrink-0 overflow-hidden relative shadow-2xs border border-slate-200">
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="36px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#111C2D] truncate">
                        {book.title}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {book.shelf}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A]">
                      Còn {book.stockQty} cuốn
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Min: {book.minStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/admin/books"
              className="w-full py-2.5 bg-[#0B1F3A] hover:bg-[#1a3860] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1 shadow-xs"
            >
              <span>+ Tạo phiếu nhập hàng ngay</span>
            </Link>
          </div>

          {/* TỶ TRỌNG THỂ LOẠI BÁN CHẠY (THANH TIẾN ĐỘ TRƯỢT FILL TỪ 0%) */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111C2D]">Tỷ trọng thể loại bán chạy</h3>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Top 4</span>
            </div>

            <div className="flex flex-col gap-3">
              {categoryRatios.map((cat, idx) => {
                const targetWidth = chartsAnimated ? cat.targetPercent : '0%';

                return (
                  <div key={cat.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-medium">{cat.name}</span>
                      <span className={`font-bold ${cat.textColor}`}>{cat.targetPercent}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#F0F3FF] overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full ${cat.color} transition-all duration-1000 ease-out`}
                        style={{
                          width: targetWidth,
                          transitionDelay: `${idx * 150}ms`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NHẬT KÝ CA TRỰC KHO */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-[#835500]" />
              <h3 className="text-sm font-bold text-[#111C2D]">Nhật ký ca trực kho</h3>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F0F3FF]">
                <CheckCircle2 className="w-4 h-4 text-[#009A6A] shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs">
                  <p className="text-[#111C2D]">
                    <span className="font-bold">Hoàng Nam</span> đã kiểm kê Kệ A-12
                  </p>
                  <span className="text-[10px] text-slate-500">Khớp dữ liệu 100% (13:10 hôm nay)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F0F3FF]">
                <Truck className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs">
                  <p className="text-[#111C2D]">
                    Đối tác <span className="font-bold">GHTK</span> đã nhận đợt 1
                  </p>
                  <span className="text-[10px] text-slate-500">Bàn giao 45 kiện hàng (11:45 hôm nay)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
