import React from 'react';
import { Ticket, Sparkles, CheckCircle2, ShieldCheck, Tag, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminPromotionsPage() {
  const activePrograms = [
    {
      id: 'FREESHIP-150K',
      title: 'Miễn Phí Vận Chuyển Toàn Quốc',
      badge: 'ĐANG ÁP DỤNG TỰ ĐỘNG',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Đơn hàng có tổng tiền sách từ 150.000đ trở lên được tự động miễn phí 100% phí vận chuyển tiêu chuẩn 25.000đ - 30.000đ.',
      condition: 'Tổng giỏ hàng >= 150.000đ',
      benefit: 'Freeship 0đ (Tiết kiệm tới 30.000đ/đơn)',
      type: 'Tự động (Zero-voucher)',
    },
    {
      id: 'DISCOUNT-COVER',
      title: 'Chiết Khấu Giá Bìa Nhà Xuất Bản',
      badge: 'ĐANG ÁP DỤNG TỰ ĐỘNG',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Tất cả các tựa sách chính hãng từ NXB Trẻ, Nhã Nam, Kim Đồng, Hội Nhà Văn đều được chiết khấu trực tiếp 10% - 15% so với giá bìa in niêm yết.',
      condition: 'Áp dụng cho 100% đầu sách đang kinh doanh',
      benefit: 'Giá bán thực tế luôn thấp hơn giá bìa gốc',
      type: 'Chiết khấu trực tiếp trên sản phẩm',
    },
    {
      id: 'SECURE-PACKAGE',
      title: 'Cam Kết Đóng Gói 3 Lớp Chống Sốc',
      badge: 'CHÍNH SÁCH B2C',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Tặng kèm màng co bọc sách và 3 lớp bóng khí bảo vệ chống gãy gập góc sách, kèm đồng kiểm khi nhận hàng COD.',
      condition: 'Mọi đơn hàng xuất kho',
      benefit: '100% Sách mới nguyên vẹn',
      type: 'Dịch vụ gia tăng',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0B1F3A]">
              <Ticket className="w-5 h-5 text-[#F5A623]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              Chính Sách Khuyến Mãi & Trợ Giá B2C
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mô hình Tổ Sách áp dụng cơ chế trợ giá tự động (Zero-code Frictionless Discount) giúp tối ưu tỷ lệ chuyển đổi đơn hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>3 Chương Trình Đang Chạy</span>
          </span>
        </div>
      </div>

      {/* Grid of Programs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activePrograms.map((prog) => (
          <div
            key={prog.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-[#F5A623] transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{prog.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${prog.badgeColor}`}>
                  {prog.badge}
                </span>
              </div>

              <h3 className="font-black text-base text-[#0B1F3A]">{prog.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{prog.benefit}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Tag className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                <span>{prog.condition}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
