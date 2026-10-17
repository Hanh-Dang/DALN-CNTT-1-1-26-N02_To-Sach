import { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export const metadata: Metadata = {
  title: 'Chính Sách Đổi Trả 7 Ngày Miễn Phí | Tổ Sách Bookstore',
  description: 'Chính sách đổi mới 1 đổi 1 trong vòng 7 ngày hoàn toàn miễn phí nếu sách gặp lỗi in ấn hoặc dập gãy gáy.',
};

export default function ReturnPolicyPage() {
  return (
    <PolicyPageLayout
      title="Chính Sách Đổi Trả 7 Ngày Miễn Phí"
      subtitle="Bảo vệ 100% quyền lợi của bạn đọc với chính sách 1 đổi 1 nhanh chóng, không phát sinh chi phí."
      badge="Hậu mãi & Bảo hành"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">1. Điều kiện áp dụng đổi trả 1 đổi 1</h2>
        <p>Tổ Sách chấp nhận đổi mới miễn phí trong vòng <strong>7 ngày kể từ ngày nhận hàng</strong> đối với các trường hợp:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li>Sách gặp lỗi từ nhà xuất bản: Thiếu trang, in ngược trang, trùng trang hoặc nhòe chữ không đọc được.</li>
          <li>Sách bị dập gáy, quăn góc, móp méo hoặc ướt rách do quá trình vận chuyển.</li>
          <li>Giao nhầm tựa sách, nhầm phiên bản hoặc thiếu số lượng sách so với đơn đặt hàng.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">2. Chi phí đổi trả</h2>
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
          <p className="font-bold">Tổ Sách tài trợ 100% cước phí vận chuyển đổi trả hai chiều.</p>
          <p className="text-xs mt-1">Quý khách không phải trả thêm bất kỳ một khoản tiền nào khi thực hiện đổi sách lỗi.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">3. Quy trình 3 bước đổi trả đơn giản</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li><strong>Bước 1:</strong> Chụp ảnh hoặc quay video ngắn thể hiện rõ tình trạng lỗi của cuốn sách.</li>
          <li><strong>Bước 2:</strong> Gửi thông tin kèm mã đơn hàng qua Email <code>hotro@tosach.vn</code> hoặc Hotline <code>1900 6868</code>.</li>
          <li><strong>Bước 3:</strong> Tổ Sách gửi cuốn sách mới nguyên vẹn đến tận nhà bạn trong vòng 24–48h và thu hồi cuốn sách lỗi về.</li>
        </ol>
      </section>
    </PolicyPageLayout>
  );
}
