import React from 'react';
import type { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';
import { ShieldCheck, Copyright, Building2, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chính sách bản quyền & Sở hữu trí tuệ | Tổ Sách Studio',
  description: 'Cam kết tôn trọng bản quyền tác giả, bảo hộ quyền sở hữu trí tuệ tại Tổ Sách.',
};

export default function LicensePage() {
  return (
    <PolicyPageLayout
      title="Chính sách bản quyền & Sở hữu trí tuệ"
      subtitle="Tổ Sách tôn trọng tuyệt đối giá trị lao động trí tuệ của tác giả, dịch giả và các đơn vị xuất bản."
      badge="Bảo vệ bản quyền"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <Copyright className="w-5 h-5 text-amber-500" />
          1. Cam kết sách thật 100% bản quyền
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Tổ Sách kiên quyết nói <strong>KHÔNG</strong> với sách giả, sách in lậu, sách photocopy trái phép. Toàn bộ hơn 5.100 đầu sách kinh doanh, kỹ năng, văn học, thiếu nhi lưu hành trên hệ thống đều có hợp đồng phát hành chính thức, hóa đơn GTGT rõ ràng từ các Nhà xuất bản hàng đầu Việt Nam.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          2. Đối tác Xuất bản & Phát hành
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {['NXB Kim Đồng', 'NXB Trẻ', 'Nhã Nam', 'First News - Trí Việt', 'Alpha Books', 'Omega Plus'].map((pub) => (
            <div key={pub} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold text-xs text-slate-700">
              {pub}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          3. Sở hữu nội dung nền tảng
        </h2>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Tất cả hình ảnh bìa sách, bản quyền tác phẩm thuộc về tác giả và nhà xuất bản tương ứng. Tổ Sách sử dụng nhằm mục đích giới thiệu và phân phối tác phẩm hợp pháp.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Mã nguồn, giao diện, logo và nhãn hiệu "Tổ Sách Studio" thuộc sở hữu độc quyền của Tổ Sách Studio. Mọi hành vi sao chép thiết kế hoặc thương hiệu mà không có sự cho phép bằng văn bản đều là vi phạm pháp luật.</span>
          </li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
