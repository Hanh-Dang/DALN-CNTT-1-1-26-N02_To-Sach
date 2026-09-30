'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  Copy,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';
import {
  VIETNAM_PROVINCES,
  getEstimatedDeliveryText,
} from '@/lib/provinces';

interface InitialUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  profile?: {
    addressProvince?: string | null;
    addressDistrict?: string | null;
    addressWard?: string | null;
    addressDetail?: string | null;
  } | null;
}

interface CheckoutClientProps {
  user: InitialUser;
}

const FREESHIP_THRESHOLD = 150000;
const STANDARD_SHIPPING_FEE = 25000;

export default function CheckoutClient({ user }: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart, isLoaded } = useCart();

  // 1. FORM STATE (Tự động điền dữ liệu đã lưu trong User Profile)
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [province, setProvince] = useState(
    user.profile?.addressProvince || 'Hà Nội'
  );
  const [district, setDistrict] = useState(
    user.profile?.addressDistrict || ''
  );
  const [ward, setWard] = useState(user.profile?.addressWard || '');
  const [addressDetail, setAddressDetail] = useState(
    user.profile?.addressDetail || ''
  );
  const [note, setNote] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // 2. PAYMENT METHOD STATE
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>(
    'COD'
  );

  // 3. UI & SUBMIT STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 4. LẤY DANH SÁCH MÓN HÀNG CHECKOUT
  // Nếu có danh sách món được chọn trong giỏ thì lấy, nếu không thì lấy toàn bộ giỏ
  const checkoutItems = useMemo(() => {
    return items;
  }, [items]);

  // 5. TÍNH TOÁN TIỀN NÔNG
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [checkoutItems]);

  const originalTotal = useMemo(() => {
    return checkoutItems.reduce(
      (acc, item) => acc + item.originalPrice * item.quantity,
      0
    );
  }, [checkoutItems]);

  const totalSavings = useMemo(() => {
    return Math.max(0, originalTotal - subtotal);
  }, [originalTotal, subtotal]);

  const isFreeShip = subtotal >= FREESHIP_THRESHOLD;
  const shippingFee = checkoutItems.length === 0 ? 0 : isFreeShip ? 0 : STANDARD_SHIPPING_FEE;
  const totalAmount = subtotal + shippingFee;

  // 6. TÍNH TOÁN DỰ KIẾN GIAO HÀNG ĐỘNG THEO TỈNH THÀNH (GIẢI PHÁP 2)
  const deliveryEstimate = useMemo(() => {
    return getEstimatedDeliveryText(province);
  }, [province]);

  // Kiểm tra giỏ hàng trống khi đã tải xong
  useEffect(() => {
    if (isLoaded && items.length === 0) {
      // Giỏ rỗng thì ở lại hiển thị giao diện báo rỗng
    }
  }, [isLoaded, items]);

  // Copy số tài khoản
  const handleCopyBank = () => {
    navigator.clipboard.writeText('9824052026');
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2000);
  };

  // Validate form trước khi submit
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên người nhận';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại nhận hàng';
    } else {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(phone.trim().replace(/\s/g, ''))) {
        newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số)';
      }
    }

    if (!province) {
      newErrors.province = 'Vui lòng chọn Tỉnh / Thành phố';
    }

    if (!district.trim()) {
      newErrors.district = 'Vui lòng nhập Quận / Huyện';
    }

    if (!ward.trim()) {
      newErrors.ward = 'Vui lòng nhập Phường / Xã';
    }

    if (!addressDetail.trim()) {
      newErrors.addressDetail = 'Vui lòng nhập số nhà, tên đường cụ thể';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 7. XỬ LÝ ĐẶT HÀNG (Gọi API /api/orders)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (checkoutItems.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ghép địa chỉ hoàn chỉnh chuẩn hóa
      const fullShippingAddress = `${addressDetail.trim()}, ${ward.trim()}, ${district.trim()}, ${province}`;

      const payload = {
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        shippingAddress: fullShippingAddress,
        province,
        district: district.trim(),
        ward: ward.trim(),
        addressDetail: addressDetail.trim(),
        note: note.trim() || undefined,
        saveAsDefault,
        paymentMethod,
        items: checkoutItems.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
          price: item.price,
          bookTitle: item.title,
          coverUrl: item.coverUrl,
        })),
        subtotal,
        shippingFee,
        totalAmount,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đặt hàng thất bại. Vui lòng thử lại!');
      }

      // Xóa giỏ hàng thành công
      clearCart();

      // Chuyển sang màn hình xác nhận đặt hàng thành công
      router.push(`/order/success?code=${data.orderCode}`);
    } catch (err: any) {
      console.error('Order checkout error:', err);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình đặt hàng.');
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#0B1F3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Đang tải trang thanh toán...</p>
      </div>
    );
  }

  // Trường hợp giỏ hàng rỗng
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-[#F5A623] mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[#0B1F3A]">Không có sản phẩm nào để thanh toán</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Giỏ hàng của bạn đang trống hoặc bạn đã hoàn tất đặt hàng trước đó. Hãy quay lại khám phá thêm các tựa sách hay nhé!
        </p>
        <div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục tìm sách</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* 1. THREE-STEP CHECKOUT TRACKER */}
      <div className="flex items-center justify-center max-w-xl mx-auto text-xs sm:text-sm">
        {/* Step 1: Giỏ Hàng (Đã xong) */}
        <Link
          href="/cart"
          className="flex items-center gap-2 text-emerald-700 font-bold hover:text-emerald-800 transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs text-emerald-800">
            ✓
          </span>
          <span>1. Giỏ Hàng</span>
        </Link>

        <div className="flex-1 h-0.5 bg-emerald-500 mx-3" />

        {/* Step 2: Thanh Toán (Đang thực hiện) */}
        <div className="flex items-center gap-2 text-[#0B1F3A] font-black">
          <span className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs shadow-xs ring-4 ring-[#F5A623]/30">
            2
          </span>
          <span className="text-[#0B1F3A]">2. Thanh Toán</span>
        </div>

        <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

        {/* Step 3: Hoàn Tất (Chờ) */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs">
            3
          </span>
          <span className="font-medium">3. Hoàn Tất</span>
        </div>
      </div>

      {/* Thông báo lỗi tổng nếu có */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Lỗi xử lý đơn hàng</span>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2. MAIN CHECKOUT FORM & SUMMARY */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: THÔNG TIN GIAO HÀNG & THANH TOÁN (7/12) ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* KHỐI 1: ĐỊA CHỈ NHẬN HÀNG */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B1F3A] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#0B1F3A]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0B1F3A]">1. Địa Chỉ Nhận Hàng</h2>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ nhận hàng tại nhà riêng, công ty hoặc gửi tặng sách cho người thân
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                Tự động điền
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Họ và tên người nhận</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-600 font-medium">{errors.fullName}</p>}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Số điện thoại nhận hàng</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="Ví dụ: 0912345678"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all ${
                    errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Email nhận thông báo đơn hàng</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Gửi hóa đơn điện tử)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenban@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all"
                />
              </div>

              {/* Tỉnh / Thành phố */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Tỉnh / Thành phố</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    if (errors.province) setErrors((prev) => ({ ...prev, province: '' }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all cursor-pointer"
                >
                  {VIETNAM_PROVINCES.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.isExpressCity ? '⚡ (1-2 ngày)' : ''}
                    </option>
                  ))}
                </select>
                {errors.province && <p className="text-[11px] text-rose-600 font-medium">{errors.province}</p>}
              </div>

              {/* Quận / Huyện */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Quận / Huyện</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
                  }}
                  placeholder="Ví dụ: Quận Cầu Giấy / Quận 1"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all ${
                    errors.district ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.district && <p className="text-[11px] text-rose-600 font-medium">{errors.district}</p>}
              </div>

              {/* Phường / Xã */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Phường / Xã</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    if (errors.ward) setErrors((prev) => ({ ...prev, ward: '' }));
                  }}
                  placeholder="Ví dụ: Phường Dịch Vọng Hậu"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all ${
                    errors.ward ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.ward && <p className="text-[11px] text-rose-600 font-medium">{errors.ward}</p>}
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Địa chỉ chi tiết (Số nhà, tòa nhà, ngõ)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value);
                    if (errors.addressDetail) setErrors((prev) => ({ ...prev, addressDetail: '' }));
                  }}
                  placeholder="Ví dụ: Số 26, ngõ 86 đường Xuân Thủy"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all ${
                    errors.addressDetail ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.addressDetail && <p className="text-[11px] text-rose-600 font-medium">{errors.addressDetail}</p>}
              </div>

              {/* Lời nhắn / Ghi chú giao hàng */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ghi chú cho nhân viên giao hàng (Shipper)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi đến 15 phút, gửi bảo vệ nếu vắng nhà..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 transition-all resize-none"
                />
              </div>

              {/* Checkbox lưu địa chỉ mặc định */}
              <div className="sm:col-span-2 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#0B1F3A] border-slate-300"
                  />
                  <span>Lưu địa chỉ này làm địa chỉ nhận hàng mặc định cho các đơn sau</span>
                </label>
              </div>
            </div>
          </div>

          {/* KHỐI 2: PHƯƠNG THỨC VẬN CHUYỂN (TÍNH ĐỘNG THEO TỈNH THÀNH - GIẢI PHÁP 2) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F5A623] flex items-center justify-center">
                <Truck className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0B1F3A]">2. Phương Thức Vận Chuyển</h2>
                <p className="text-xs text-slate-500">
                  Đồng giá toàn quốc, tự động thích ứng với vị trí người nhận
                </p>
              </div>
            </div>

            {/* Thẻ Vận chuyển Tiêu chuẩn thích ứng */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </span>
                  <span className="font-extrabold text-sm text-[#0B1F3A]">
                    Giao Hàng Tiêu Chuẩn (Tổ Sách Express)
                  </span>
                </div>
                <span className="font-extrabold text-sm text-emerald-800">
                  {shippingFee === 0 ? (
                    <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full uppercase">
                      Miễn phí 0₫
                    </span>
                  ) : (
                    formatVND(shippingFee)
                  )}
                </span>
              </div>

              {/* Thông tin tính động theo Giải pháp 2 */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-900 shadow-2xs">
                  {deliveryEstimate.badge}
                </span>
                <span>• {deliveryEstimate.description}</span>
              </div>

              {isFreeShip ? (
                <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                  🎉 Chúc mừng! Đơn hàng của bạn đạt mốc ≥ 150.000đ và được Tổ Sách tài trợ 100% cước phí vận chuyển toàn quốc.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 pt-1">
                  💡 Mẹo: Mua thêm {formatVND(FREESHIP_THRESHOLD - subtotal)} tiền sách để được miễn phí vận chuyển 25.000₫.
                </p>
              )}
            </div>
          </div>

          {/* KHỐI 3: PHƯƠNG THỨC THANH TOÁN (2 LỰA CHỌN CHUẨN B2C) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0B1F3A]">3. Phương Thức Thanh Toán</h2>
                <p className="text-xs text-slate-500">
                  Chọn 1 trong 2 hình thức thanh toán an toàn, bảo mật
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: COD */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-[#0B1F3A] bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 w-4 h-4 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span className="font-extrabold text-sm text-[#0B1F3A]">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Tiền mặt
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận sách. Quý khách được quyền đồng kiểm sách trước khi nhận.
                  </p>
                </div>
              </label>

              {/* Option 2: VietQR */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-[#0B1F3A] bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-1 w-4 h-4 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-600" />
                      <span className="font-extrabold text-sm text-[#0B1F3A]">
                        Chuyển khoản Ngân hàng (VietQR 24/7)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Quét mã QR tức thì
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Quét mã QR tự động bằng bất kỳ ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay, Viettel Money). Không mất phí giao dịch.
                  </p>
                </div>
              </label>

              {/* Chi tiết VietQR khi được chọn */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 transition-all">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Thông tin tài khoản nhận thanh toán của Tổ Sách:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-800">Vietcombank (Chi nhánh Hội sở)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tên chủ tài khoản:</span>
                      <span className="font-bold text-slate-800 uppercase">CTCP PHAT HANH SACH TO SACH</span>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số tài khoản:</span>
                        <span className="font-black text-sm text-[#0B1F3A] tracking-wider">9824052026</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyBank}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0B1F3A] transition-colors cursor-pointer"
                      >
                        {copiedBankInfo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBankInfo ? 'Đã sao chép' : 'Sao chép STK'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                    <QrCode className="w-8 h-8 text-blue-700 shrink-0" />
                    <p className="leading-relaxed">
                      Mã QR thanh toán chính thức kèm <strong>Mã đơn hàng định danh</strong> sẽ được hiển thị ngay tại trang Hoàn tất sau khi bạn nhấn nút <strong>Xác nhận đặt hàng</strong> bên dưới.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: TÓM TẮT ĐƠN HÀNG (5/12) ================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-[#0B1F3A]">
                Đơn hàng ({checkoutItems.length} cuốn)
              </h3>
              <Link
                href="/cart"
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Sửa giỏ hàng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Danh sách sách chọn mua */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
              {checkoutItems.map((item) => (
                <div key={item.bookId} className="flex gap-3 pt-3 first:pt-0">
                  <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src={item.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="60px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1F3A] line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      {item.authorName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.authorName}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">SL: x{item.quantity}</span>
                      <span className="font-black text-[#0B1F3A]">
                        {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chi tiết chi phí */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-bold text-slate-900">{formatVND(subtotal)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                  <span>Tiết kiệm giá bìa NXB:</span>
                  <span className="font-extrabold">-{formatVND(totalSavings)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Phí vận chuyển ({deliveryEstimate.timeframe}):</span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-extrabold">MIỄN PHÍ</span>
                  ) : (
                    formatVND(shippingFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-sm text-[#0B1F3A]">Tổng thanh toán:</span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-[#F5A623] block leading-none">
                    {formatVND(totalAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    (Đã bao gồm thuế VAT)
                  </span>
                </div>
              </div>
            </div>

            {/* Nút bấm Đặt hàng chính */}
            <button
              id="btn-confirm-checkout"
              type="submit"
              disabled={isSubmitting || checkoutItems.length === 0}
              className="w-full bg-[#F5A623] hover:bg-[#e09419] disabled:bg-slate-300 disabled:cursor-not-allowed text-[#0B1F3A] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0B1F3A] border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý đơn hàng...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#0B1F3A]" />
                  <span>Xác Nhận Đặt Hàng ({formatVND(totalAmount)})</span>
                </>
              )}
            </button>

            {/* Cam kết B2C */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Sách thật chính hãng từ các NXB uy tín</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Đóng gói 3 lớp chống sốc, bọc màng co nguyên seal</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Đổi trả miễn phí trong 7 ngày nếu lỗi in ấn từ NXB</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
