import { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật | Tổ Sách Bookstore',
  description: 'Cam kết bảo mật tuyệt đối dữ liệu người dùng, thông tin thanh toán và lịch sử mua sắm tại Tổ Sách.',
};

export default function PrivacyPage() {
  return (
    <PolicyPageLayout
      title="Chính Sách Bảo Mật Thông Tin"
      subtitle="Cam kết bảo vệ dữ liệu cá nhân của độc giả theo tiêu chuẩn an toàn an ninh mạng Việt Nam và quốc tế."
      badge="Bảo mật dữ liệu"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">1. Mục đích thu thập thông tin</h2>
        <p>
          Tổ Sách chỉ thu thập các thông tin tối thiểu cần thiết phục vụ quá trình xử lý đơn hàng và giao sách: Họ và tên người nhận, Số điện thoại liên hệ, Địa chỉ giao hàng và Địa chỉ Email (để gửi mã OTP xác thực và thông báo trạng thái đơn hàng).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">2. Mã hóa & Lưu trữ an toàn</h2>
        <ul className="list-disc list-inside space-y-1.5 text-slate-600">
          <li><strong>Mật khẩu:</strong> Được mã hóa 1 chiều bằng thuật toán an toàn <code>bcrypt</code> kèm salt ngẫu nhiên. Không ai, kể cả quản trị viên hệ thống, có thể xem được mật khẩu dạng văn bản thô.</li>
          <li><strong>Phiên đăng nhập:</strong> Sử dụng chuẩn mã hóa <code>JWT (JSON Web Token)</code> lưu trữ trong cookie <code>HttpOnly, SameSite=Lax</code> chống đánh cắp token qua XSS.</li>
          <li><strong>Mã xác minh OTP:</strong> Sinh ngẫu nhiên bằng hàm an toàn mã hóa <code>crypto.randomInt</code>, giới hạn 5 lần thử sai để chống Brute-force.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">3. Chia sẻ thông tin với bên thứ ba</h2>
        <p>
          Tổ Sách tuyệt đối không bán, cho thuê hay trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo. Thông tin người nhận chỉ được chia sẻ duy nhất với đơn vị đối tác vận chuyển phục vụ công tác giao hàng.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
