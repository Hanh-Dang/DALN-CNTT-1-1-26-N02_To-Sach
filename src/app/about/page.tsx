import { Metadata } from 'next';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export const metadata: Metadata = {
  title: 'Giới Thiệu Về Tổ Sách | Sách Về Tổ, Tri Thức Bay Xa',
  description: 'Tìm hiểu về sứ mệnh, tầm nhìn và đội ngũ sáng lập nền tảng thương mại điện tử nhà sách trực tuyến Tổ Sách.',
};

export default function AboutPage() {
  return (
    <PolicyPageLayout
      title="Giới Thiệu Về Tổ Sách"
      subtitle="Sứ mệnh xây dựng nền tảng B2C cung cấp sách thật, nguyên bản, chất lượng cao tới tay mọi độc giả Việt Nam."
      badge="Về chúng tôi"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">1. Khởi nguồn & Ý nghĩa thương hiệu</h2>
        <p>
          <strong>Tổ Sách</strong> (To Sach Studio) ra đời từ khát khao mang đến một không gian mua sắm sách trực tuyến đáng tin cậy, ấm cúng và chỉn chu như chính tổ ấm của người yêu sách. Biểu trưng logo Tổ Sách kết hợp giữa chiếc tổ chim che chở những mầm cây tri thức và cuốn sách mở ra chân trời mới trên nền xanh hải quân đặc trưng.
        </p>
        <p>
          Khẩu hiệu chính thức: <em>&ldquo;Sách về tổ, tri thức bay xa&rdquo;</em> thể hiện cam kết đưa tri thức tinh hoa từ các nhà xuất bản hàng đầu đến từng ngôi nhà, từng tủ sách gia đình trên khắp dải đất hình chữ S.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">2. Đội ngũ Sáng lập & Quản trị</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-extrabold text-[#0B1F3A] text-sm">Nguyễn Đăng Hanh</h3>
            <p className="text-xs text-amber-700 font-bold">Founder & Lead System Architect</p>
            <p className="text-xs text-slate-600">
              Phụ trách kiến trúc hệ thống, Backend, CSDL PostgreSQL, bảo mật RBAC, cơ chế Rate Limiting và AI Chatbot.
            </p>
            <p className="text-xs text-slate-500">Email: <code>hnhngyndng@gmail.com</code></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h3 className="font-extrabold text-[#0B1F3A] text-sm">Nguyễn Mạnh Hòa</h3>
            <p className="text-xs text-amber-700 font-bold">Co-Founder & Head of Product Design</p>
            <p className="text-xs text-slate-600">
              Phụ trách thiết kế trải nghiệm người dùng UI/UX, Design System, chuẩn hóa tương tác vi mô và tối ưu giao diện Responsive.
            </p>
            <p className="text-xs text-slate-500">Email: <code>manhhoa02042005@gmail.com</code></p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0B1F3A]">3. Cam kết cốt lõi với bạn đọc</h2>
        <ul className="list-disc list-inside space-y-1.5 text-slate-600">
          <li><strong>100% Sách có bản quyền:</strong> Nhập trực tiếp từ NXB Trẻ, Kim Đồng, Nhã Nam, NXB Tổng Hợp TP.HCM, Omega Plus...</li>
          <li><strong>Đóng gói 3 lớp bảo vệ:</strong> Bọc màng co, xốp chống sốc và hộp carton nẹp góc chống quăn mép tuyệt đối.</li>
          <li><strong>Miễn phí vận chuyển từ 150.000đ:</strong> Hỗ trợ tối đa chi phí ship để sách đến gần hơn với mọi độc giả.</li>
          <li><strong>Đổi trả 7 ngày linh hoạt:</strong> Cam kết 1 đổi 1 miễn phí nếu sách gặp lỗi in ấn hoặc lỗi do vận chuyển.</li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
