'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Package, Camera, Check, ShieldCheck, Mail, Phone, 
  MapPin, Calendar, Sparkles, AlertCircle, Save, Loader2 
} from 'lucide-react';

interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
  profile?: {
    gender?: string | null;
    birthday?: string | null;
    addressProvince?: string | null;
    addressDistrict?: string | null;
    addressWard?: string | null;
    addressDetail?: string | null;
  } | null;
}

interface ProfileClientProps {
  initialUser: UserProfileData;
}

// Bộ sưu tập Avatar tuyển chọn cho độc giả Tổ Sách
const PRESET_AVATARS = [
  { id: 'av1', label: 'Cú Mèo Tri Thức', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'av2', label: 'Độc Giả Trầm Tư', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av3', label: 'Mọt Sách Năng Động', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'av4', label: 'Nhà Văn Hướng Ngoại', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av5', label: 'Họa Sĩ Minh Họa', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: 'av6', label: 'Độc Giả Thanh Lịch', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
];

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const [user, setUser] = useState<UserProfileData>(initialUser);
  const [fullName, setFullName] = useState(initialUser.fullName || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatarUrl || PRESET_AVATARS[0].url);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [gender, setGender] = useState(initialUser.profile?.gender || 'OTHER');
  const [birthday, setBirthday] = useState(
    initialUser.profile?.birthday ? new Date(initialUser.profile.birthday).toISOString().split('T')[0] : ''
  );
  const [addressProvince, setAddressProvince] = useState(initialUser.profile?.addressProvince || '');
  const [addressDistrict, setAddressDistrict] = useState(initialUser.profile?.addressDistrict || '');
  const [addressWard, setAddressWard] = useState(initialUser.profile?.addressWard || '');
  const [addressDetail, setAddressDetail] = useState(initialUser.profile?.addressDetail || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          avatarUrl,
          gender,
          birthday: birthday || null,
          addressProvince,
          addressDistrict,
          addressWard,
          addressDetail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi cập nhật hồ sơ');
      }

      setUser(data.user);
      setSuccessMessage('Cập nhật thông tin hồ sơ thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* THÔNG BÁO TRẠNG THÁI */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. MAIN FORM GRID */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI: AVATAR & THẺ TỔNG QUAN */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs text-center space-y-4">
            <div className="relative inline-block mx-auto group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-100 shadow-md bg-slate-100 relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName || 'Avatar'}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0B1F3A] text-white text-3xl font-black">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              {/* Nút đổi Avatar */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-1 right-1 bg-[#0B1F3A] hover:bg-[#F5A623] text-white p-2.5 rounded-full shadow-md transition-colors cursor-pointer border-2 border-white"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-black text-[#0B1F3A]">{fullName || 'Độc giả Tổ Sách'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 text-[#F5A623]" />
              <span>Độc giả Thân thiết</span>
            </div>

            <div className="pt-4 border-t border-slate-100 text-left space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Trạng thái tài khoản:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ngày tham gia:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CẬP NHẬT THÔNG TIN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <h3 className="text-base font-black text-[#0B1F3A] border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#F5A623]" />
              <span>Thông Tin Cá Nhân</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 bg-slate-50/40"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Địa chỉ Email</span>
                  <span className="text-[10px] text-slate-400 font-normal">Không thể thay đổi</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Số điện thoại nhận hàng</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 bg-slate-50/40"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Ngày sinh</label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 bg-slate-50/40"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {/* Giới tính */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Giới tính</label>
              <div className="flex items-center gap-6">
                {[
                  { id: 'MALE', label: 'Nam' },
                  { id: 'FEMALE', label: 'Nữ' },
                  { id: 'OTHER', label: 'Khác' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="gender"
                      value={item.id}
                      checked={gender === item.id}
                      onChange={() => setGender(item.id)}
                      className="text-[#0B1F3A] focus:ring-[#F5A623] accent-[#0B1F3A]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ĐỊA CHỈ NHẬN HÀNG */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F5A623]" />
                <span>Địa Chỉ Giao Hàng Mặc Định</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={addressProvince}
                    onChange={(e) => setAddressProvince(e.target.value)}
                    placeholder="TP. Hà Nội, TP. HCM..."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] bg-slate-50/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Quận / Huyện</label>
                  <input
                    type="text"
                    value={addressDistrict}
                    onChange={(e) => setAddressDistrict(e.target.value)}
                    placeholder="Q. Cầu Giấy, Q. 1..."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] bg-slate-50/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Phường / Xã</label>
                  <input
                    type="text"
                    value={addressWard}
                    onChange={(e) => setAddressWard(e.target.value)}
                    placeholder="P. Dịch Vọng Hậu..."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] bg-slate-50/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Số nhà, Tên đường chi tiết</label>
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="Ví dụ: Tầng 4, Tòa nhà Tri Thức, Số 123 Đường Sách..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623] bg-slate-50/40"
                />
              </div>
            </div>

            {/* NÚT LƯU */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] disabled:bg-slate-400 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                    <span>Đang lưu thông tin...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#F5A623]" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 4. MODAL CHỌN AVATAR */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#F5A623]" />
                <h3 className="text-base font-black text-[#0B1F3A]">Chọn Ảnh Đại Diện Tuyển Chọn</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Chọn một trong các avatar minh họa độc giả hoặc dán liên kết URL ảnh cá nhân:
              </p>

              {/* Grid Preset */}
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowAvatarModal(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#F5A623] bg-amber-50/50 shadow-xs ring-2 ring-[#F5A623]/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden relative shadow-2xs">
                        <Image src={preset.url} alt={preset.label} fill className="object-cover" sizes="64px" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Nhập custom URL */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-bold text-slate-700">Hoặc dán liên kết ảnh (URL tùy chỉnh):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-[#F5A623]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setAvatarUrl(customAvatarInput.trim());
                        setCustomAvatarInput('');
                        setShowAvatarModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#163156] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
