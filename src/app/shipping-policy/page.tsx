import { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export const metadata: Metadata = {
  title: 'Chính Sách Vận Chuyển & Giao Hàng | Tổ Sách Bookstore',
  description: 'Thông tin cước phí vận chuyển, chính sách freeship từ 150.000đ và thời gian giao hàng toàn quốc tại Tổ Sách.',
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPageLayout
      title="Chính Sách Vận Chuyển & Giao Hàng"
      subtitle="Giao hàng tận nơi toàn quốc với cước phí minh bạch và chính sách Freeship hấp dẫn."
      badge="Vận chuyển & Giao nhận"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">1. Chính sách Miễn phí vận chuyển (Freeship)</h2>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
          <p className="font-extrabold text-sm">🎉 Miễn phí 100% cước phí giao hàng toàn quốc:</p>
          <p className="text-xs">
            Áp dụng cho mọi đơn hàng có giá trị tiền sách từ <strong>150.000 đ</strong> trở lên. Hệ thống tự động áp dụng khi bạn thêm đủ sách vào giỏ hàng mà không cần nhập bất kỳ mã giảm giá nào.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">2. Cước phí vận chuyển tiêu chuẩn</h2>
        <p>
          Đối với đơn hàng có giá trị dưới 150.000 đ, Tổ Sách áp dụng mức cước phí đồng giá ưu đãi:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li><strong>Cước phí đồng giá toàn quốc:</strong> <strong>25.000 đ</strong> / đơn hàng (không giới hạn số lượng cuốn sách).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">3. Thời gian giao hàng ước tính</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="p-3 border-b">Khu vực nhận hàng</th>
                <th className="p-3 border-b">Thời gian dự kiến</th>
                <th className="p-3 border-b">Đơn vị vận chuyển</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-800">Nội thành Hà Nội & TP.HCM</td>
                <td className="p-3 text-emerald-700 font-bold">1 – 2 ngày làm việc</td>
                <td className="p-3 text-slate-500">Tổ Sách Express / Viettel Post</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Các tỉnh thành miền Bắc & miền Trung</td>
                <td className="p-3 text-blue-700 font-bold">2 – 3 ngày làm việc</td>
                <td className="p-3 text-slate-500">Giao Hàng Tiết Kiệm / VNPost</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Các tỉnh miền Nam, Tây Nguyên & Huyện đảo</td>
                <td className="p-3 text-slate-700 font-bold">3 – 4 ngày làm việc</td>
                <td className="p-3 text-slate-500">VNPost Nhanh</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">4. Quyền đồng kiểm khi nhận sách</h2>
        <p>
          Tổ Sách khuyến khích bạn đồng kiểm cùng bưu tá khi nhận hàng. Quý khách hoàn toàn được quyền mở kiện hàng để kiểm tra đúng tựa sách, đúng số lượng và sách còn mới nguyên seal trước khi thanh toán.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
