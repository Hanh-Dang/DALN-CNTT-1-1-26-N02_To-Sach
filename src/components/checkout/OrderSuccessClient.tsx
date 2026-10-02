'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, Copy, Check, Truck, ShieldCheck, 
  ArrowRight, CreditCard, Sparkles, MapPin, 
  Package, Calendar, HelpCircle, PhoneCall
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { getEstimatedDeliveryText } from '@/lib/provinces';

interface OrderItemData {
  id: string;
  bookId: string;
  bookTitle: string;
  coverUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
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
  paymentStatus: string;
  status: string;
  note?: string | null;
  createdAt: string | Date;
  items: OrderItemData[];
}

interface OrderSuccessClientProps {
  order: OrderData;
}

export default function OrderSuccessClient({ order }: OrderSuccessClientProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  const deliveryEstimate = getEstimatedDeliveryText(order.shippingAddress);
  const vietQrUrl = '/images/qr/vietqr-mb.png';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.orderCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0388272905');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(order.orderCode);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* 1. CELEBRATION HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 text-center space-y-4 shadow-sm relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/60 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2 relative">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full inline-block">
            Đã Tiếp Nhận Đơn Hàng
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
            Cảm Ơn Bạn Đã Mua Sách Tại Tổ Sách!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Đơn hàng của bạn đã được ghi nhận trên hệ thống. Chúng tôi sẽ nhanh chóng chuẩn bị sách, đóng gói 3 lớp chống sốc và bàn giao cho đơn vị vận chuyển.
          </p>
        </div>

        {/* ORDER CODE QUICK BADGE */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 relative">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs">
            <span className="text-slate-500 font-medium">Mã đơn hàng:</span>
            <strong className="text-sm font-black text-[#0B1F3A] tracking-wider">{order.orderCode}</strong>
            <button
              onClick={handleCopyCode}
              type="button"
              className="text-slate-400 hover:text-[#0B1F3A] p-1 transition-colors cursor-pointer"
              title="Sao chép mã đơn hàng"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-50/70 border border-blue-200/60 text-blue-900 rounded-2xl px-4 py-2 text-xs">
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Dự kiến: <strong className="font-bold">{deliveryEstimate.timeframe}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. VIETQR PAYMENT CARD (IF METHOD IS BANK TRANSFER) */}
      {order.paymentMethod === 'BANK_TRANSFER' && (
        <div className="bg-linear-to-br from-emerald-50/80 via-white to-amber-50/40 rounded-3xl border-2 border-emerald-400/50 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0B1F3A]">
                Quét Mã VietQR Để Hoàn Tất Thanh Toán
              </h2>
              <p className="text-xs text-slate-500">
                Hệ thống tự động kích hoạt xử lý đơn hàng ngay khi nhận được thông báo từ ngân hàng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Image Column */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm text-center">
                <div className="relative w-56 h-72 sm:w-60 sm:h-76 mx-auto rounded-xl overflow-hidden bg-slate-50">
                  <Image
                    src={vietQrUrl}
                    alt={`VietQR ${order.orderCode}`}
                    fill
                    sizes="(max-width: 768px) 240px, 260px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã
                </p>
              </div>
            </div>

            {/* Bank details Column */}
            <div className="md:col-span-7 space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <strong className="font-extrabold text-[#0B1F3A]">MBBank (Ngân hàng Quân Đội)</strong>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <strong className="font-extrabold text-[#0B1F3A]">TO SACH - MBBANK</strong>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-sm font-black text-emerald-700">0388272905</strong>
                    <button
                      onClick={handleCopyAccount}
                      type="button"
                      className="text-slate-400 hover:text-[#0B1F3A] p-1 transition-colors cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Số tiền chuyển khoản:</span>
                  <strong className="text-base font-black text-[#F5A623]">
                    {formatVND(order.totalAmount)}
                  </strong>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-sm font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      {order.orderCode}
                    </strong>
                    <button
                      onClick={handleCopyContent}
                      type="button"
                      className="text-slate-400 hover:text-[#0B1F3A] p-1 transition-colors cursor-pointer"
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                💡 <strong>Mẹo:</strong> Hãy giữ nguyên nội dung chuyển khoản là mã <strong>{order.orderCode}</strong> để hệ thống tự động xác nhận trong vòng 1-3 phút.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDER DETAILS & ITEMS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Book Items List (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-[#0B1F3A] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#F5A623]" />
              <span>Kiện Sách Đã Đặt ({order.items.length} cuốn)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Bản quyền 100%</span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5">
                <div className="relative w-14 h-19 sm:w-16 sm:h-22 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
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

          {/* Pricing Calculation Breakdown */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính tiền sách:</span>
              <span className="font-bold">{formatVND(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-bold">
                {order.shippingFee === 0 ? (
                  <span className="text-emerald-700 font-extrabold">Miễn phí (Freeship)</span>
                ) : (
                  formatVND(order.shippingFee)
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
              <span className="font-black text-[#0B1F3A]">Tổng thanh toán:</span>
              <span className="font-black text-base text-[#F5A623]">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Shipping Address & Support (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
            <h3 className="font-extrabold text-sm text-[#0B1F3A] flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Địa Chỉ Giao Hàng</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Người nhận:</span>
                <p className="font-bold text-[#0B1F3A] text-sm">{order.customerName}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Số điện thoại:</span>
                <p className="font-semibold text-slate-800">{order.customerPhone}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Địa chỉ nhận sách:</span>
                <p className="font-medium text-slate-800 leading-relaxed">{order.shippingAddress}</p>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Hình thức thanh toán:</span>
                <p className="font-bold text-[#0B1F3A]">
                  {order.paymentMethod === 'COD' 
                    ? '💵 Thanh toán khi nhận hàng (COD)' 
                    : '💳 Chuyển khoản Ngân hàng (VietQR 24/7)'}
                </p>
              </div>

              {order.note && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 italic">
                  Ghi chú: "{order.note}"
                </div>
              )}
            </div>
          </div>

          {/* Value Assurance Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-[#0B1F3A]">Cam Kết Đồng Kiểm</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Bạn được quyền kiểm tra tình trạng sách nguyên vẹn trước khi thanh toán.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/account/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-extrabold px-7 py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          <Package className="w-4 h-4 text-[#F5A623]" />
          <span>Theo dõi đơn mua trong tài khoản</span>
        </Link>

        <Link
          href="/catalog"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-7 py-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm transition-all"
        >
          <span>Tiếp tục chọn thêm sách khác</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
