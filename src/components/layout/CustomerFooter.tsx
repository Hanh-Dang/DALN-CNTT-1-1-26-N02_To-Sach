import React from 'react';
import Link from 'next/link';
import { BookOpen, Phone, Mail, MapPin, ShieldCheck, RefreshCw, Truck, Award } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#0B1F3A] text-slate-300 pt-14 pb-8 border-t-4 border-[#F5A623] mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        {/* Value Proposition Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <div className="w-11 h-11 rounded-lg bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Sách Thật</h4>
              <p className="text-xs text-slate-400">Cam kết bản quyền chính hãng</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <div className="w-11 h-11 rounded-lg bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Giao Hàng Nhanh Chóng</h4>
              <p className="text-xs text-slate-400">Đóng gói cẩn thận 3 lớp</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <div className="w-11 h-11 rounded-lg bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Đổi Trả 7 Ngày</h4>
              <p className="text-xs text-slate-400">Nếu lỗi in ấn hoặc gãy rách</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <div className="w-11 h-11 rounded-lg bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Tích Điểm Tri Thức</h4>
              <p className="text-xs text-slate-400">Ưu đãi dành cho độc giả thân thiết</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F5A623] flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">TỔ SÁCH</span>
                <p className="text-xs text-[#F5A623] font-medium">Sách về tổ, tri thức bay xa</p>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Nhà sách trực tuyến chuyên cung cấp sách mới, 100% có bản quyền từ các nhà xuất bản uy tín hàng đầu Việt Nam. Cam kết đóng gói cẩn thận và giao hàng tận tay độc giả.
            </p>
            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F5A623] shrink-0" />
                <span>Số 88 Phố Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F5A623] shrink-0" />
                <span>1900 6868 (8:00 - 21:00 hàng ngày)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F5A623] shrink-0" />
                <span>hotro@tosach.vn</span>
              </p>
            </div>
          </div>

          {/* Col 2: Về Tổ Sách */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">VỀ TỔ SÁCH</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/about" className="hover:text-white transition-colors">Giới thiệu về Tổ Sách</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog Điểm Sách</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="/license" className="hover:text-white transition-colors">Bản quyền & Giấy phép NXB</Link></li>
            </ul>
          </div>

          {/* Col 3: Hỗ trợ khách hàng */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">HỖ TRỢ KHÁCH HÀNG</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/guide" className="hover:text-white transition-colors">Hướng dẫn đặt mua sách</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Chính sách vận chuyển & Giao hàng</Link></li>
              <li><Link href="/return-policy" className="hover:text-white transition-colors">Chính sách đổi trả 7 ngày</Link></li>
              <li><Link href="/payment-methods" className="hover:text-white transition-colors">Phương thức thanh toán COD & VietQR</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQ)</Link></li>
            </ul>
          </div>

          {/* Col 4: Danh mục tuyển chọn */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">DANH MỤC TUYỂN CHỌN</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/catalog?cat=van-hoc" className="hover:text-white transition-colors">Văn Học & Tiểu Thuyết</Link></li>
              <li><Link href="/catalog?cat=kinh-te" className="hover:text-white transition-colors">Kinh Tế & Khởi Nghiệp</Link></li>
              <li><Link href="/catalog?cat=tam-ly" className="hover:text-white transition-colors">Tâm Lý & Kỹ Năng Sống</Link></li>
              <li><Link href="/catalog?cat=thieu-nhi" className="hover:text-white transition-colors">Sách Thiếu Nhi</Link></li>
              <li><Link href="/catalog?cat=ngoai-ngu" className="hover:text-white transition-colors">Ngoại Ngữ & Từ Điển</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Nhà Sách Trực Tuyến Tổ Sách. Tất cả các quyền được bảo lưu.</p>
          <p className="text-slate-400 text-[11px]">
            Hệ thống B2C chuẩn đồ án CNTT — Bảo vệ tháng 10/2026.
          </p>
        </div>
      </div>
    </footer>
  );
};
