import React from 'react';
import type { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Câu hỏi thường gặp (FAQ) | Tổ Sách Studio',
  description: 'Giải đáp những thắc mắc thường gặp nhất của độc giả khi mua sắm tại Tổ Sách.',
};

export default function FaqPage() {
  const faqs = [
    {
      q: 'Sách tại Tổ Sách có phải là sách thật có bản quyền không?',
      a: '100% sách tại Tổ Sách là sách thật chính hãng có bản quyền từ các Nhà xuất bản uy tín (NXB Trẻ, Kim Đồng, Nhã Nam, First News, Alpha Books, Omega Plus...). Chúng tôi cam kết hoàn tiền 200% nếu phát hiện sách lậu, sách photocopy.',
    },
    {
      q: 'Chính sách phí vận chuyển được tính như thế nào?',
      a: 'Tổ Sách áp dụng chính sách Freeship toàn quốc cho mọi đơn hàng có giá trị từ 150.000đ trở lên. Đối với các đơn hàng dưới 150.000đ, phí giao hàng tiêu chuẩn đồng giá là 25.000đ cho mọi tỉnh thành trên toàn quốc.',
    },
    {
      q: 'Bao lâu thì tôi nhận được sách?',
      a: 'Khu vực nội thành TP.HCM và Hà Nội: Sách được giao trong 1 - 2 ngày làm việc. Các tỉnh thành khác: Thời gian giao hàng từ 2 - 4 ngày làm việc. Quý khách có thể theo dõi tiến độ đơn hàng tại mục Tra cứu đơn hàng.',
    },
    {
      q: 'Tôi có được kiểm tra hàng trước khi thanh toán không?',
      a: 'Có. Tổ Sách hỗ trợ 100% chính sách đồng kiểm cùng shipper. Bạn được quyền mở hộp kiểm tra đúng tựa sách, đúng số lượng và tình trạng sách nguyên vẹn trước khi ký nhận và thanh toán.',
    },
    {
      q: 'Nếu sách bị lỗi in ấn, rách hoặc móp méo góc thì đổi trả thế nào?',
      a: 'Bạn được hỗ trợ đổi sách mới hoàn toàn miễn phí trong vòng 7 ngày kể từ khi nhận hàng. Chỉ cần liên hệ qua hotline hoặc chat trực tuyến, Tổ Sách sẽ cử shipper giao cuốn mới tận nhà và thu hồi cuốn lỗi mà bạn không tốn thêm bất kỳ chi phí nào.',
    },
    {
      q: 'Tôi có thể hủy đơn hàng đã đặt được không?',
      a: 'Quý khách hoàn toàn có thể tự hủy đơn hàng ngay trên hệ thống nếu đơn hàng đang ở trạng thái "Chờ xác nhận". Nếu đơn đã chuyển sang trạng thái "Đang giao", vui lòng nhắn tin trực tiếp cho bộ phận hỗ trợ khách hàng để được xử lý kịp thời.',
    },
  ];

  return (
    <PolicyPageLayout
      title="Câu hỏi thường gặp"
      subtitle="Tổng hợp các câu hỏi và giải đáp thắc mắc phổ biến nhất của quý độc giả tại Tổ Sách."
      badge="Trung tâm hỗ trợ"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          Giải đáp thắc mắc độc giả
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group border border-slate-200 rounded-2xl bg-slate-50/40 p-4 transition-all [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-800 text-sm">
                <span>{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </PolicyPageLayout>
  );
}
