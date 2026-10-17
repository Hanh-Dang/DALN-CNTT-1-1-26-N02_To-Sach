import React from 'react';
import type { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';
import { CreditCard, Banknote, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Phương thức thanh toán | Tổ Sách Studio',
  description: 'Hướng dẫn các phương thức thanh toán an toàn, linh hoạt tại nhà sách trực tuyến Tổ Sách.',
};

export default function PaymentMethodsPage() {
  return (
    <PolicyPageLayout
      title="Phương thức thanh toán"
      subtitle="Tổ Sách hỗ trợ đa dạng phương thức thanh toán tiện lợi, nhanh chóng và bảo mật chuẩn quốc tế."
      badge="Thanh toán an toàn"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-500" />
          1. Các hình thức thanh toán được hỗ trợ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quý khách thanh toán tiền mặt trực tiếp cho nhân viên giao hàng sau khi đã kiểm tra sách đúng quy cách niêm phong và hóa đơn đi kèm.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Chuyển khoản VietQR siêu tốc (MBBank)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mã QR động tự động điền sẵn số tiền và mã đơn hàng. Tiền vào tài khoản hệ thống tự động xác nhận đơn sau 10 giây, hoàn toàn miễn phí giao dịch.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-500" />
          2. Hướng dẫn thanh toán VietQR chuyển khoản
        </h2>
        <div className="space-y-2 text-slate-600">
          <p>Khi hoàn tất bước đặt hàng và chọn hình thức Chuyển khoản QR:</p>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
            <li>Mở ứng dụng ngân hàng số bất kỳ (Vietcombank, MB, Techcombank, BIDV, Cake...) hoặc ví điện tử có tính năng quét QR.</li>
            <li>Quét mã QR hiển thị trên màn hình xác nhận đơn hàng của Tổ Sách.</li>
            <li>Kiểm tra thông tin thụ hưởng và nội dung chuyển khoản (tự động là mã đơn hàng của bạn).</li>
            <li>Xác nhận chuyển khoản. Hệ thống lập tức cập nhật trạng thái đơn sang <strong>Đã thanh toán</strong>.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          3. Cam kết bảo mật thanh toán
        </h2>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Tổ Sách không lưu trữ thông tin thẻ ngân hàng hoặc mật khẩu tài khoản của quý khách.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Mọi giao dịch ngân hàng đều được mã hóa bằng chứng chỉ bảo mật SSL/TLS 256-bit chuẩn ngân hàng Nhà nước.</span>
          </li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
