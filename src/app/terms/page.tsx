import { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng | Tổ Sách Bookstore',
  description: 'Các điều khoản và quy định sử dụng dịch vụ trên sàn thương mại điện tử nhà sách trực tuyến Tổ Sách.',
};

export default function TermsPage() {
  return (
    <PolicyPageLayout
      title="Điều Khoản Sử Dụng"
      subtitle="Quy định và điều khoản ràng buộc khi khách hàng truy cập và mua sắm tại Nhà Sách Trực Tuyến Tổ Sách."
      badge="Pháp lý & Quy định"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">1. Phạm vi áp dụng</h2>
        <p>
          Khi truy cập và mua sắm tại website <strong>tosach.vn</strong>, quý độc giả mặc nhiên đồng ý tuân thủ các điều khoản sử dụng được quy định dưới đây. Tổ Sách có quyền cập nhật, bổ sung các điều khoản này theo quy định của pháp luật Việt Nam.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">2. Tài khoản & Bảo mật</h2>
        <p>
          Khách hàng có trách nhiệm bảo mật thông tin tài khoản và mật khẩu đăng nhập. Mọi giao dịch phát sinh thông qua tài khoản đã đăng ký sẽ được coi là giao dịch hợp lệ do chính chủ sở hữu tài khoản thực hiện.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">3. Giá bán & Thanh toán</h2>
        <p>
          Giá niêm yết trên website là giá đã bao gồm thuế Giá trị gia tăng (VAT). Khách hàng có thể lựa chọn thanh toán bằng hình thức Tiền mặt khi nhận hàng (COD) hoặc Chuyển khoản ngân hàng qua mã VietQR.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">4. Hủy đơn hàng</h2>
        <p>
          Khách hàng có quyền yêu cầu hủy đơn hàng khi đơn còn ở trạng thái <em>Chờ xử lý (PENDING)</em>. Đối với đơn hàng đã chuyển sang trạng thái <em>Đang giao hàng (SHIPPING)</em> hoặc <em>Đã giao thành công (DELIVERED)</em>, đơn hàng không thể hủy trực tiếp trên website mà cần liên hệ hotline hỗ trợ.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
