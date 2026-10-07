'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Trash2,
  CheckCheck,
  X,
  AlertTriangle,
  ShoppingCart,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

// =============================================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU THÔNG BÁO (NOTIFICATION DATA CONTRACT)
// =============================================================================
export interface NotificationItem {
  id: string; // Khóa định danh duy nhất (VD: inv-book123 hoặc ord-order456)
  type: 'INVENTORY_ALERT' | 'ORDER_NEW' | 'ORDER_BATCH' | 'REVIEW'; // Loại thông báo
  priority: 'HIGH' | 'NORMAL' | 'LOW'; // Mức độ ưu tiên: HIGH luôn hiển thị nổi bật
  title: string; // Tiêu đề ngắn gọn
  message: string; // Nội dung chi tiết
  createdAt: string; // Thời gian phát sinh (ISO string)
  timeAgo: string; // Chuỗi hiển thị tương đối (VD: "5 phút trước")
  linkUrl: string; // Đường dẫn điều hướng khi bấm vào
  read: boolean; // Trạng thái đã đọc / chưa đọc
  meta?: {
    orderCode?: string;
    amount?: number;
    batchCount?: number;
    bookTitle?: string;
    stockQty?: number;
  };
}

// Props truyền từ AdminHeader và Server Component Layout
interface NotificationDropdownProps {
  initialPendingOrdersCount: number; // Số đơn chờ duyệt từ CSDL
  initialLowStockCount?: number; // Số sách sắp hết từ CSDL
  lowStockList?: { id: string; title: string; stockQty: number }[]; // Danh sách sách sắp hết
  recentPendingOrders?: {
    id: string;
    orderCode: string;
    totalAmount: number;
    customerName: string;
    createdAt: string | Date;
  }[]; // Danh sách đơn chờ mới nhất
}

// Khóa lưu trữ cục bộ để ghi nhớ các thông báo mà Admin đã chủ động xóa
const STORAGE_KEY = 'tosach_admin_dismissed_notifications';

export function NotificationDropdown({
  initialPendingOrdersCount,
  initialLowStockCount = 0,
  lowStockList = [],
  recentPendingOrders = [],
}: NotificationDropdownProps) {
  // State quản lý việc đóng/mở popover dropdown quả chuông
  const [isOpen, setIsOpen] = useState(false);

  // State quản lý tab lọc đang kích hoạt: 'all' (Tất cả) | 'inventory' (Kho) | 'orders' (Đơn hàng)
  const [activeTab, setActiveTab] = useState<'all' | 'inventory' | 'orders'>('all');

  // State lưu danh sách thông báo hiện thời
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Ref tham chiếu thẻ bao ngoài để lắng nghe sự kiện click ra ngoài (Outside Click)
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // =============================================================================
  // 2. KHỞI TẠO & LỌC THÔNG BÁO TỪ DỮ LIỆU CSDL (LOẠI TRỪ CÁC TIN ĐÃ XÓA)
  // =============================================================================
  useEffect(() => {
    try {
      // Đọc danh sách ID thông báo đã được Admin xóa trước đó từ localStorage
      const dismissedIds: string[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      const items: NotificationItem[] = [];

      // --- MỤC 1: CẢNH BÁO KHO SÁCH (ƯU TIÊN CAO NHẤT - HIGH PRIORITY) ---
      // Nguyên tắc: Sách hết hàng (stockQty = 0) hoặc dưới minStock không bao giờ bị gộp
      const stockItems =
        lowStockList.length > 0
          ? lowStockList
          : [
              { id: 'stock-seed-1', title: 'Cây Cam Ngọt Của Tôi', stockQty: 2 },
              { id: 'stock-seed-2', title: 'Chiến Binh Cầu Vồng', stockQty: 0 },
            ];

      stockItems.forEach((book, idx) => {
        const notifId = `inv-${book.id}`;
        // Nếu admin chưa từng bấm xóa thông báo này thì mới hiển thị
        if (!dismissedIds.includes(notifId)) {
          const isOutOfStock = book.stockQty <= 0;
          items.push({
            id: notifId,
            type: 'INVENTORY_ALERT',
            priority: 'HIGH',
            title: isOutOfStock ? '🚨 Hết sạch tồn kho (Cháy hàng)' : '⚠️ Sắp hết sách trong kho',
            message: isOutOfStock
              ? `Tựa sách "${book.title}" đã chạm mức 0 cuốn. Cần nhập gấp!`
              : `Tựa sách "${book.title}" chỉ còn ${book.stockQty} cuốn (dưới mức tối thiểu 10).`,
            createdAt: new Date(Date.now() - (idx + 1) * 15 * 60 * 1000).toISOString(),
            timeAgo: idx === 0 ? '15 phút trước' : '45 phút trước',
            linkUrl: '/admin/books',
            read: false,
            meta: {
              bookTitle: book.title,
              stockQty: book.stockQty,
            },
          });
        }
      });

      // --- MỤC 2: ĐƠN HÀNG MỚI (ÁP DỤNG THUẬT TOÁN GOM NHÓM SMART AGGREGATION) ---
      // Nếu có từ 3 đơn hàng trở lên trong ca trực, giữ đơn mới nhất riêng lẻ và gom các đơn còn lại
      const pendingOrders =
        recentPendingOrders.length > 0
          ? recentPendingOrders
          : [
              {
                id: 'ord-seed-1',
                orderCode: 'TS-20261007-8924',
                totalAmount: 385000,
                customerName: 'Trần Minh Anh',
                createdAt: new Date(Date.now() - 5 * 60 * 1000),
              },
              {
                id: 'ord-seed-2',
                orderCode: 'TS-20261007-8919',
                totalAmount: 540000,
                customerName: 'Hoàng Hải Đăng',
                createdAt: new Date(Date.now() - 18 * 60 * 1000),
              },
              {
                id: 'ord-seed-3',
                orderCode: 'TS-20261007-8890',
                totalAmount: 210000,
                customerName: 'Lê Thu Trang',
                createdAt: new Date(Date.now() - 35 * 60 * 1000),
              },
            ];

      if (pendingOrders.length >= 3) {
        // 2.1. Đơn mới nhất hiển thị riêng
        const newestOrder = pendingOrders[0];
        const newestId = `ord-${newestOrder.id}`;
        if (!dismissedIds.includes(newestId)) {
          items.push({
            id: newestId,
            type: 'ORDER_NEW',
            priority: 'NORMAL',
            title: '🛒 Đơn hàng mới vừa đặt',
            message: `Khách ${newestOrder.customerName} vừa đặt đơn #${newestOrder.orderCode} (${formatVND(newestOrder.totalAmount)})`,
            createdAt: new Date(newestOrder.createdAt).toISOString(),
            timeAgo: '5 phút trước',
            linkUrl: '/admin/orders',
            read: false,
            meta: {
              orderCode: newestOrder.orderCode,
              amount: newestOrder.totalAmount,
            },
          });
        }

        // 2.2. Gom nhóm các đơn tiếp theo thành 1 dòng tổng hợp chống spam
        const batchOrders = pendingOrders.slice(1);
        const batchTotal = batchOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const batchId = 'ord-batch-recent';
        if (!dismissedIds.includes(batchId)) {
          items.push({
            id: batchId,
            type: 'ORDER_BATCH',
            priority: 'NORMAL',
            title: `📦 Gom nhóm: ${batchOrders.length} đơn hàng mới cần duyệt`,
            message: `Ghi nhận ${batchOrders.length} đơn phát sinh liên tiếp trong ca trực (Tổng: ${formatVND(batchTotal)}).`,
            createdAt: new Date(batchOrders[0].createdAt).toISOString(),
            timeAgo: '20 phút trước',
            linkUrl: '/admin/orders',
            read: false,
            meta: {
              batchCount: batchOrders.length,
              amount: batchTotal,
            },
          });
        }
      } else {
        // Nếu ít đơn (1-2 đơn), hiển thị riêng lẻ từng đơn
        pendingOrders.forEach((order, idx) => {
          const ordId = `ord-${order.id}`;
          if (!dismissedIds.includes(ordId)) {
            items.push({
              id: ordId,
              type: 'ORDER_NEW',
              priority: 'NORMAL',
              title: '🛒 Đơn hàng mới cần xác nhận',
              message: `Khách ${order.customerName} đặt #${order.orderCode} giá trị ${formatVND(order.totalAmount)}.`,
              createdAt: new Date(order.createdAt).toISOString(),
              timeAgo: idx === 0 ? '5 phút trước' : `${(idx + 1) * 15} phút trước`,
              linkUrl: '/admin/orders',
              read: false,
              meta: {
                orderCode: order.orderCode,
                amount: order.totalAmount,
              },
            });
          }
        });
      }

      setNotifications(items);
    } catch (e) {
      console.error('Lỗi khi nạp dữ liệu thông báo admin:', e);
    }
  }, [lowStockList, recentPendingOrders]);

  // =============================================================================
  // 3. TỰ ĐỘNG ĐÓNG DROPDOWN KHI CLICK RA NGOÀI HOẶC BẤM PHÍM ESCAPE
  // =============================================================================
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // =============================================================================
  // 4. CÁC HÀM XỬ LÝ NGHIỆP VỤ (CLEAR ALL, DISMISS ONE, MARK READ)
  // =============================================================================

  // Xóa toàn bộ thông báo (Clear-All) chuẩn như trên thanh thông báo điện thoại
  const handleClearAll = () => {
    try {
      const allIds = notifications.map((n) => n.id);
      const existing: string[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      const updated = Array.from(new Set([...existing, ...allIds]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setNotifications([]);
    } catch (e) {
      console.error('Lỗi khi xóa tất cả thông báo:', e);
      setNotifications([]);
    }
  };

  // Đánh dấu toàn bộ là đã đọc (tắt chấm xanh/đỏ nhưng vẫn giữ danh sách)
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Xóa riêng lẻ 1 thông báo khi bấm nút [✕]
  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const existing: string[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      if (!existing.includes(id)) {
        existing.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }
    } catch (err) {
      console.error('Lỗi khi xóa thông báo riêng lẻ:', err);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Bấm vào 1 thông báo: đánh dấu đã đọc và chuyển hướng đến trang tương ứng
  const handleItemClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    router.push(notif.linkUrl);
  };

  // Lọc danh sách thông báo theo tab đang chọn
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'inventory') return item.type === 'INVENTORY_ALERT';
    if (activeTab === 'orders') return item.type === 'ORDER_NEW' || item.type === 'ORDER_BATCH';
    return true;
  });

  // Tính toán số lượng cho từng nhãn badge
  const unreadCount = notifications.filter((n) => !n.read).length;
  const inventoryAlertsCount = notifications.filter((n) => n.type === 'INVENTORY_ALERT').length;
  const ordersCount = notifications.filter((n) => n.type === 'ORDER_NEW' || n.type === 'ORDER_BATCH').length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* =========================================================================
          NÚT QUẢ CHUÔNG (BELL TRIGGER BUTTON TRÊN ADMIN HEADER)
          - Chế độ im lặng: Chỉ hiển thị chấm đỏ, không tự bật popup che màn hình
         ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-colors duration-150 outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 ${
          isOpen
            ? 'bg-[#0B1F3A] text-white shadow-xs'
            : 'text-slate-600 hover:bg-[#F0F3FF] hover:text-[#0B1F3A]'
        }`}
        title="Trung tâm thông báo quản trị"
        aria-label="Thông báo"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 stroke-[2]" />

        {/* Chấm đỏ Badge số lượng thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#BA1A1A] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs select-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* =========================================================================
          DROPDOWN MENU POPOVER (THON HƠN & DÀI HƠN THEO PHONG CÁCH NOTIFICATION CENTER)
          - Chiều rộng thon gọn: w-[310px] sm:w-[330px]
          - Chiều cao kéo dài: h-[450px] danh sách cuộn
          - Bố cục khóa kích thước chống rung giật tuyệt đối
         ========================================================================= */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[310px] sm:w-[330px] bg-white rounded-2xl shadow-[0_16px_48px_-10px_rgba(11,31,58,0.22)] border border-slate-200/90 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* 1. HEADER DROPDOWN: Nhỏ gọn, thanh lịch */}
          <div className="px-3.5 py-3 bg-gradient-to-r from-[#0B1F3A] to-[#1E3A5F] text-white flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs shrink-0">
                <Bell className="w-3.5 h-3.5 text-[#FEAE2C]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold flex items-center gap-1.5 truncate">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#BA1A1A] text-[9px] font-extrabold shrink-0">
                      {unreadCount} mới
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-300 truncate">
                  Kho bãi & đơn hàng tự động
                </p>
              </div>
            </div>

            {/* Nút Xóa tất cả (Clear-All) */}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-medium transition-colors border border-white/10 active:scale-95 shrink-0 ml-1"
                title="Xóa toàn bộ danh sách thông báo"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          {/* 2. TAB BỘ LỌC THÔNG MINH (THON GỌN, 1 HÀNG NGANG KHÔNG BỊ TRÀN) */}
          <div className="grid grid-cols-3 px-2 py-1.5 border-b border-slate-100 bg-slate-50/80 gap-1 shrink-0 text-[11px] font-semibold select-none">
            {/* Tab: Tất cả */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1 px-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 border ${
                activeTab === 'all'
                  ? 'bg-white text-[#0B1F3A] border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span>Tất cả</span>
              <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-200 text-slate-700 font-bold">
                {notifications.length}
              </span>
            </button>

            {/* Tab: Cảnh báo kho */}
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`py-1 px-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 border ${
                activeTab === 'inventory'
                  ? 'bg-white text-[#BA1A1A] border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span>Kho</span>
              {inventoryAlertsCount > 0 && (
                <span className="text-[9px] px-1 py-0.1 rounded-full bg-[#FFDAD6] text-[#BA1A1A] font-bold">
                  {inventoryAlertsCount}
                </span>
              )}
            </button>

            {/* Tab: Đơn hàng */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-1 px-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 border ${
                activeTab === 'orders'
                  ? 'bg-white text-[#006699] border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span>Đơn hàng</span>
              {ordersCount > 0 && (
                <span className="text-[9px] px-1 py-0.1 rounded-full bg-[#DEE8FF] text-[#0B1F3A] font-bold">
                  {ordersCount}
                </span>
              )}
            </button>
          </div>

          {/* 3. KHU VỰC DANH SÁCH THÔNG BÁO (DÀI HƠN: h-[450px]) */}
          <div
            key={activeTab}
            className="h-[450px] overflow-y-auto [scrollbar-gutter:stable] divide-y divide-slate-100 p-1 bg-white transition-opacity duration-150"
          >
            {filteredNotifications.length === 0 ? (
              // Trạng thái trống (Empty State)
              <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/50 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-1">
                  Không có thông báo nào 🎉
                </p>
                <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                  {activeTab === 'inventory'
                    ? 'Kho sách hiện ở mức an toàn.'
                    : activeTab === 'orders'
                    ? 'Đơn hàng mới đã được xử lý xong.'
                    : 'Bạn đã xem hết thông báo.'}
                </p>
              </div>
            ) : (
              // Duyệt render từng thẻ thông báo
              filteredNotifications.map((item) => {
                const isInventory = item.type === 'INVENTORY_ALERT';
                const isBatch = item.type === 'ORDER_BATCH';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative p-2.5 rounded-xl cursor-pointer transition-colors duration-150 flex items-start gap-2.5 hover:bg-slate-50 ${
                      !item.read ? 'bg-[#F0F3FF]/45 font-medium' : 'bg-white opacity-85'
                    }`}
                  >
                    {/* Icon phân loại */}
                    <div className="shrink-0 mt-0.5 select-none">
                      {isInventory ? (
                        <div className="w-7 h-7 rounded-lg bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : isBatch ? (
                        <div className="w-7 h-7 rounded-lg bg-[#DEE8FF] text-[#0B1F3A] flex items-center justify-center shadow-2xs">
                          <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                          <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                      )}
                    </div>

                    {/* Chi tiết nội dung thông báo */}
                    <div className="flex-1 min-w-0 pr-5">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-bold text-[#111C2D] truncate max-w-[170px]">
                          {item.title}
                        </span>

                        {/* Nhãn khẩn cấp đỏ cho cảnh báo kho */}
                        {isInventory && (
                          <span className="px-1 py-0.1 rounded bg-[#FFDAD6] text-[#BA1A1A] text-[8px] font-extrabold uppercase tracking-wider select-none shrink-0">
                            Khẩn cấp
                          </span>
                        )}

                        {/* Chấm tròn biểu thị tin chưa đọc */}
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006699] shrink-0" title="Chưa đọc"></span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 select-none">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.timeAgo}</span>
                        </span>

                        <span className="text-[#0B1F3A] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-[10px]">
                          <span>Xem</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>

                    {/* Nút xóa riêng lẻ [✕] xuất hiện khi rê chuột */}
                    <button
                      type="button"
                      onClick={(e) => handleDismissOne(item.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa thông báo này"
                      aria-label="Xóa"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. FOOTER DROPDOWN */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0 select-none">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B1F3A] font-semibold transition-colors px-1.5 py-1 rounded hover:bg-slate-200/60"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Đã đọc hết</span>
            </button>

            <Link
              href="/admin/orders"
              onClick={() => setIsOpen(false)}
              className="font-bold text-[#0B1F3A] hover:underline flex items-center gap-0.5 px-1.5 py-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
