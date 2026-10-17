import React from 'react';
import type { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';
import { BookOpen, Search, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hướng dẫn mua hàng | Tổ Sách Studio',
  description: 'Các bước đặt mua sách dễ dàng, nhanh chóng và tiện lợi tại Tổ Sách.',
};

export default function GuidePage() {
  const steps = [
    {
      num: '1',
      icon: Search,
      title: 'Tìm kiếm & Khám phá sách',
      desc: 'Nhập tên sách, tác giả hoặc thể loại vào thanh tìm kiếm. Bạn cũng có thể duyệt kho hơn 5.100 tựa sách theo danh mục tại trang Khám phá.',
    },
    {
      num: '2',
      icon: ShoppingBag,
      title: 'Thêm vào giỏ & Chọn số lượng',
      desc: 'Nhấn "Thêm vào giỏ" để tiếp tục xem thêm sách, hoặc chọn "Mua ngay" để lập tức chuyển tới trang thanh toán an toàn.',
    },
    {
      num: '3',
      icon: Truck,
      title: 'Điền địa chỉ & Phương thức thanh toán',
      desc: 'Điền tên, số điện thoại, địa chỉ nhận hàng. Đơn hàng từ 150.000đ được MIỄN PHÍ VẬN CHUYỂN toàn quốc. Chọn COD hoặc VietQR.',
    },
    {
      num: '4',
      icon: CheckCircle2,
      title: 'Xác nhận đơn & Nhận hàng',
      desc: 'Kiểm tra tóm tắt đơn hàng và bấm "Đặt hàng". Mã đơn sẽ được gửi xác nhận qua hệ thống và email. Shipper giao tận tay sau 1-3 ngày làm việc.',
    },
  ];

  return (
    <PolicyPageLayout
      title="Hướng dẫn mua hàng"
      subtitle="Chỉ 4 bước đơn giản để rinh ngay những cuốn sách yêu thích về tủ sách gia đình bạn."
      badge="Cẩm nang khách hàng"
    >
      <div className="space-y-6">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          Quy trình đặt mua sách trực tuyến
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 relative overflow-hidden space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#0B1F3A] font-black text-sm flex items-center justify-center shadow-xs">
                    {step.num}
                  </div>
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-1">
          <p className="font-bold">Mẹo nhỏ khi mua sách:</p>
          <p>
            Đơn hàng đạt từ <strong>150.000đ</strong> sẽ tự động được áp dụng chính sách <strong>Freeship toàn quốc</strong>. Bạn nên chọn gom 2-3 cuốn cùng lúc để tối ưu chi phí vận chuyển nhất!
          </p>
        </div>
      </div>
    </PolicyPageLayout>
  );
}
