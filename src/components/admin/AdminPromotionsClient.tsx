'use client';

import React, { useState, useMemo } from 'react';
import {
  Ticket, Calendar, Plus, Search, Filter, Sparkles, CheckCircle2,
  AlertCircle, X, ChevronDown, Check, Clock, ShieldCheck, Tag,
  Trash2, Power, Layers, ArrowRight, Eye, Ban
} from 'lucide-react';
import { formatVND, formatDateTimeVN } from '@/lib/utils';
import { VoucherType } from '@prisma/client';

interface SerializedEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  _count?: { vouchers: number };
}

interface SerializedVoucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  eventId: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    startsAt: string;
    endsAt: string;
  } | null;
  _count?: {
    usages: number;
    orders: number;
  };
  computedStatus: string;
  statusLabel: string;
  statusColorClass: string;
}

interface Props {
  initialVouchers: SerializedVoucher[];
  initialEvents: SerializedEvent[];
  isSuperAdmin: boolean;
  canManage?: boolean;
}

export function AdminPromotionsClient({
  initialVouchers,
  initialEvents,
  isSuperAdmin,
  canManage = isSuperAdmin,
}: Props) {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'events' | 'policies'>('vouchers');
  const [vouchers, setVouchers] = useState<SerializedVoucher[]>(initialVouchers);
  const [events, setEvents] = useState<SerializedEvent[]>(initialEvents);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form State: Tạo Voucher
  const [vCode, setVCode] = useState('');
  const [vName, setVName] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vType, setVType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [vValue, setVValue] = useState<string>('');
  const [vMaxDiscount, setVMaxDiscount] = useState<string>('');
  const [vMinOrder, setVMinOrder] = useState<string>('');
  const [vUsageLimit, setVUsageLimit] = useState<string>('');
  const [vPerUserLimit, setVPerUserLimit] = useState<string>('');
  const [vEventId, setVEventId] = useState<string>('');
  const [vUseCustomDate, setVUseCustomDate] = useState<boolean>(false);
  const [vIsUnlimited, setVIsUnlimited] = useState<boolean>(true);
  const [vStartsAt, setVStartsAt] = useState('');
  const [vEndsAt, setVEndsAt] = useState('');
  const [vIsActive, setVIsActive] = useState<boolean>(true);
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);

  // Helper định dạng ngày input datetime-local
  const toLocalDatetimeInput = (dateInput?: Date | string | null) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper định dạng tiền mặt có dấu phân cách hàng nghìn
  const formatMoneyInput = (val: string) => {
    if (!val) return '';
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('vi-VN');
  };

  const resetVoucherForm = () => {
    setVCode('');
    setVName('');
    setVDesc('');
    setVType('FIXED');
    setVValue('');
    setVMaxDiscount('');
    setVMinOrder('');
    setVUsageLimit('');
    setVPerUserLimit('');
    setVEventId('');
    setVUseCustomDate(false);
    setVIsUnlimited(true);
    setVStartsAt('');
    setVEndsAt('');
    setVIsActive(true);
  };

  // Form State: Tạo Sự Kiện
  const [eName, setEName] = useState('');
  const [eSlug, setESlug] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eStartsAt, setEStartsAt] = useState('');
  const [eEndsAt, setEEndsAt] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Lọc danh sách Voucher
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchSearch =
        !searchQuery ||
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchEvent =
        selectedEventFilter === 'ALL' ||
        (selectedEventFilter === 'NONE' ? !v.eventId : v.eventId === selectedEventFilter);

      const matchStatus =
        selectedStatusFilter === 'ALL' || v.computedStatus === selectedStatusFilter;

      return matchSearch && matchEvent && matchStatus;
    });
  }, [vouchers, searchQuery, selectedEventFilter, selectedStatusFilter]);

  // Helper chuyển đổi datetime-local sang ISO 8601 có múi giờ chuẩn xác (N11)
  const toISOWithTimezone = (localDatetimeStr?: string | null) => {
    if (!localDatetimeStr) return null;
    const d = new Date(localDatetimeStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  // Xử lý bật/tắt voucher
  const handleToggleVoucher = async (id: string, currentActive: boolean) => {
    if (!canManage) {
      showToast('Bạn chỉ có quyền xem, không thể bật/tắt Voucher.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Re-fetch danh sách voucher từ server để cập nhật trạng thái hiển thị chuẩn xác (L-n)
      const listRes = await fetch('/api/admin/vouchers');
      const listData = await listRes.json();
      if (listData.vouchers) {
        setVouchers(listData.vouchers);
      } else {
        setVouchers((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, isActive: !currentActive } : v
          )
        );
      }
      showToast(`Đã ${!currentActive ? 'kích hoạt' : 'tắt'} mã Voucher thành công.`);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái voucher.', 'error');
    }
  };

  // Xử lý xóa voucher
  const handleDeleteVoucher = async (v: SerializedVoucher) => {
    if (!canManage) {
      showToast('Bạn chỉ có quyền xem, không thể xóa Voucher.', 'error');
      return;
    }

    const totalUsed = Math.max(v._count?.usages || 0, v.usedCount || 0);
    if (totalUsed > 0) {
      alert(
        `Mã "${v.code}" đã phát sinh ${totalUsed} lượt dùng thực tế trong các đơn hàng.\nTheo quy định nghiệp vụ, bạn chỉ có thể TẮT mã chứ không được xóa vĩnh viễn.`
      );
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã Voucher "${v.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVouchers((prev) => prev.filter((item) => item.id !== v.id));
      showToast(`Đã xóa mã Voucher "${v.code}".`);
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa voucher.', 'error');
    }
  };

  // Xử lý bật/tắt sự kiện
  const handleToggleEvent = async (id: string, currentActive: boolean) => {
    if (!canManage) {
      showToast('Bạn chỉ có quyền xem, không thể sửa sự kiện.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !currentActive } : e))
      );
      // Refresh lại vouchers để đồng bộ trạng thái
      const vRes = await fetch('/api/admin/vouchers');
      const vData = await vRes.json();
      if (vData.vouchers) setVouchers(vData.vouchers);

      showToast(`Đã ${!currentActive ? 'bật' : 'tắt'} sự kiện khuyến mãi.`);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật sự kiện.', 'error');
    }
  };

  // Submit tạo mới Voucher
  const handleCreateVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = vCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(cleanCode)) {
      showToast('Mã voucher phải từ 4-20 ký tự, chỉ gồm chữ in hoa và chữ số (A-Z, 0-9).', 'error');
      return;
    }

    const numVal = Number(vValue);
    if (!numVal || numVal <= 0) {
      showToast('Vui lòng nhập mức giảm giá hợp lệ lớn hơn 0.', 'error');
      return;
    }

    if (vType === 'PERCENT' && (numVal < 1 || numVal > 100)) {
      showToast('Mức giảm theo phần trăm phải từ 1% đến 100%.', 'error');
      return;
    }

    const numUsage = Number(vUsageLimit);
    if (!numUsage || numUsage <= 0) {
      showToast('Vui lòng nhập Tổng lượt sử dụng lớn hơn 0.', 'error');
      return;
    }

    const numPerUser = Number(vPerUserLimit);
    if (!numPerUser || numPerUser <= 0) {
      showToast('Vui lòng nhập Lượt dùng tối đa mỗi khách lớn hơn 0.', 'error');
      return;
    }

    if (numPerUser > numUsage) {
      showToast(`Lượt dùng tối đa mỗi khách (${numPerUser}) không được vượt quá Tổng lượt sử dụng (${numUsage}).`, 'error');
      return;
    }

    setIsSubmittingVoucher(true);

    try {
      const payload: any = {
        code: cleanCode,
        name: vName.trim() || cleanCode,
        description: vDesc.trim() || undefined,
        type: vType,
        value: numVal,
        maxDiscount: vType === 'PERCENT' && vMaxDiscount ? Number(vMaxDiscount) : null,
        minOrderValue: Number(vMinOrder) || 0,
        usageLimit: numUsage,
        perUserLimit: numPerUser,
        eventId: vEventId || null,
        isUnlimitedTime: !vEventId && vIsUnlimited,
        startsAt: (vEventId && vUseCustomDate) || (!vEventId && !vIsUnlimited) ? toISOWithTimezone(vStartsAt) : null,
        endsAt: (vEventId && vUseCustomDate) || (!vEventId && !vIsUnlimited) ? toISOWithTimezone(vEndsAt) : null,
        isActive: vIsActive,
      };

      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Re-fetch danh sách
      const listRes = await fetch('/api/admin/vouchers');
      const listData = await listRes.json();
      if (listData.vouchers) setVouchers(listData.vouchers);

      showToast(`Đã tạo thành công mã Voucher "${payload.code}"!`);
      setIsVoucherModalOpen(false);
      resetVoucherForm();
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo Voucher.', 'error');
    } finally {
      setIsSubmittingVoucher(false);
    }
  };


  // Submit tạo mới Sự Kiện
  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEvent(true);

    try {
      const payload = {
        name: eName.trim(),
        slug: eSlug.trim() || undefined,
        description: eDesc.trim() || undefined,
        startsAt: toISOWithTimezone(eStartsAt),
        endsAt: toISOWithTimezone(eEndsAt),
      };

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const listRes = await fetch('/api/admin/events');
      const listData = await listRes.json();
      if (listData.events) setEvents(listData.events);

      showToast(`Đã tạo sự kiện "${payload.name}" thành công!`);
      setIsEventModalOpen(false);
      setEName('');
      setESlug('');
      setEDesc('');
      setEStartsAt('');
      setEEndsAt('');
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo sự kiện.', 'error');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border transition-all animate-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-50 text-[#F5A623]">
              <Ticket className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
                Quản Lý Khuyến Mãi & Voucher
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình chiến dịch sự kiện, mã giảm giá Tổ Sách, hạn dùng và ngân sách trợ giá
              </p>
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>+ Tạo Sự Kiện</span>
            </button>
            <button
              onClick={() => {
                resetVoucherForm();
                setIsVoucherModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F5A623]" />
              <span>+ Tạo Mã Voucher</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold">
            <Eye className="w-4 h-4 text-amber-600" />
            <span>Chế độ chỉ xem (VIEW_PROMOTIONS)</span>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'vouchers'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Danh Sách Voucher</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {vouchers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'events'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sự Kiện Khuyến Mãi</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'policies'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          <span>Chính Sách Trợ Giá Tự Động</span>
        </button>
      </div>

      {/* ================= TAB 1: DANH SÁCH VOUCHER ================= */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tất cả sự kiện</option>
                <option value="NONE">Voucher độc lập</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="ACTIVE">Đang chạy</option>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="EXPIRED">Đã kết thúc</option>
                <option value="OUT_OF_STOCK">Hết lượt</option>
                <option value="DISABLED">Đã tắt</option>
                <option value="EVENT_DISABLED">Sự kiện đã tắt</option>
              </select>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Mã & Tên Voucher</th>
                    <th className="py-3.5 px-3">Loại Giảm</th>
                    <th className="py-3.5 px-3">Đơn Tối Thiểu</th>
                    <th className="py-3.5 px-3">Tiến Độ Sử Dụng</th>
                    <th className="py-3.5 px-3">Sự Kiện & Thời Hạn</th>
                    <th className="py-3.5 px-3">Trạng Thái</th>
                    {canManage && <th className="py-3.5 px-4 text-right">Thao Tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="py-12 text-center text-slate-400">
                        Không tìm thấy mã Voucher nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => {
                      const totalUsed = Math.max(v._count?.usages || 0, v.usedCount || 0);
                      const usagePercent = Math.min(100, Math.round((totalUsed / v.usageLimit) * 100));

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Mã & Tên */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-mono font-black text-xs text-[#0B1F3A] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                                {v.code}
                              </span>
                              <div className="font-bold text-slate-800 text-xs">{v.name}</div>
                              {v.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">{v.description}</p>
                              )}
                            </div>
                          </td>

                          {/* Loại Giảm */}
                          <td className="py-3.5 px-3">
                            {v.type === 'PERCENT' ? (
                              <div>
                                <span className="font-black text-[#F5A623] text-sm">Giảm {v.value}%</span>
                                {v.maxDiscount && (
                                  <div className="text-[10px] text-slate-400">
                                    Tối đa: {formatVND(v.maxDiscount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="font-black text-emerald-600 text-sm">
                                -{formatVND(v.value)}
                              </span>
                            )}
                          </td>

                          {/* Đơn tối thiểu */}
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            {v.minOrderValue > 0 ? formatVND(v.minOrderValue) : 'Không giới hạn'}
                          </td>

                          {/* Tiến độ sử dụng */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1 min-w-[110px]">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-800">
                                  {totalUsed} / {v.usageLimit}
                                </span>
                                <span className="text-slate-400">{usagePercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    usagePercent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Giới hạn: {v.perUserLimit} lần/khách
                              </div>
                            </div>
                          </td>

                          {/* Sự kiện & Thời hạn */}
                          <td className="py-3.5 px-3 text-[11px] text-slate-600">
                            {v.event ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] inline-block">
                                  {v.event.name}
                                </span>
                                <div className="text-slate-400">
                                  {v.startsAt ? 'Thời hạn riêng' : 'Theo sự kiện'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">
                                {v.endsAt ? `Hết: ${formatDateTimeVN(v.endsAt)}` : 'Không thời hạn'}
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-block ${v.statusColorClass}`}
                            >
                              {v.statusLabel}
                            </span>
                          </td>

                          {/* Thao tác */}
                          {canManage && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Nút Toggle Bật/Tắt */}
                                <button
                                  onClick={() => handleToggleVoucher(v.id, v.isActive)}
                                  title={v.isActive ? 'Tắt voucher' : 'Kích hoạt voucher'}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    v.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                {/* Nút Xóa */}
                                <button
                                  onClick={() => handleDeleteVoucher(v)}
                                  title="Xóa voucher"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SỰ KIỆN KHUYẾN MÃI ================= */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                ev.isActive ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200/60 opacity-70 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{ev.slug}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      ev.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {ev.isActive ? 'ĐANG CHẠY' : 'ĐÃ TẮT'}
                  </span>
                </div>

                <h3 className="font-black text-base text-[#0B1F3A]">{ev.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {ev.description || 'Không có mô tả chi tiết.'}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {formatDateTimeVN(ev.startsAt)} - {formatDateTimeVN(ev.endsAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Ticket className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span className="font-bold">{ev._count?.vouchers || 0} mã Voucher đang gắn sự kiện</span>
                  </div>
                </div>
              </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {canManage ? (
                    <button
                      onClick={() => handleToggleEvent(ev.id, ev.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        ev.isActive
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{ev.isActive ? 'Tắt sự kiện' : 'Bật lại'}</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedEventFilter(ev.id);
                      setActiveTab('vouchers');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem voucher</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 3: CHÍNH SÁCH TRỢ GIÁ TỰ ĐỘNG ================= */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
              TỰ ĐỘNG FREESHIP
            </span>
            <h3 className="font-black text-base text-[#0B1F3A]">Miễn Phí Vận Chuyển Toàn Quốc</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tự động áp dụng phí ship 0đ cho đơn hàng có tổng tiền sách từ 150.000đ trở lên (tiết kiệm 25.000đ - 30.000đ).
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Kích hoạt 100% tự động</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
              CHIẾT KHẤU NXB
            </span>
            <h3 className="font-black text-base text-[#0B1F3A]">Chiết Khấu Giá Bìa Trực Tiếp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tất cả các tựa sách mới từ NXB Trẻ, Kim Đồng, Nhã Nam đều được trợ giá giảm 10% - 25% trực tiếp trên giá bán.
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-amber-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F5A623]" />
              <span>Áp dụng trên toàn bộ đầu sách</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200">
              DỊCH VỤ BẢO VỆ
            </span>
            <h3 className="font-black text-base text-[#0B1F3A]">Đóng Gói 3 Lớp & Đồng Kiểm COD</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bọc màng co nguyên seal, xốp bóng khí 3 lớp chống móp gáy sách, cho phép mở hàng kiểm tra trước khi trả tiền.
            </p>
            <div className="pt-3 border-t border-slate-100 text-xs font-bold text-blue-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Cam kết 100% sách thật bản quyền</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO VOUCHER MỚI ================= */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#F5A623]" />
                <h3 className="font-black text-lg text-[#0B1F3A]">Tạo Mã Voucher Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mã Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã Code Voucher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TOSACH20K"
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-black uppercase text-xs focus:outline-none focus:border-[#0B1F3A]"
                  />
                  <span className="text-[10px] text-slate-400">4-20 ký tự, viết hoa không dấu</span>
                </div>

                {/* Tên chương trình */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Giảm 20k Đơn Đầu Tiên"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>
              </div>

              {/* Mô tả chi tiết (Không bắt buộc) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả chi tiết <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Mã ưu đãi tri ân nhân dịp đầu năm học mới"
                  value={vDesc}
                  onChange={(e) => setVDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                />
              </div>

              {/* Loại giảm giá */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hình thức giảm giá</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold ${
                      vType === 'FIXED'
                        ? 'border-[#0B1F3A] bg-blue-50/20 text-[#0B1F3A]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vType"
                      checked={vType === 'FIXED'}
                      onChange={() => setVType('FIXED')}
                    />
                    <span>Tiền mặt cố định (VNĐ)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold ${
                      vType === 'PERCENT'
                        ? 'border-[#0B1F3A] bg-blue-50/20 text-[#0B1F3A]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vType"
                      checked={vType === 'PERCENT'}
                      onChange={() => setVType('PERCENT')}
                    />
                    <span>Phần trăm (%)</span>
                  </label>
                </div>
              </div>

              {/* Mức giảm & Giảm tối đa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {vType === 'PERCENT' ? 'Mức giảm (%)' : 'Mức giảm (VNĐ)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    {vType === 'PERCENT' ? (
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        placeholder="VD: 15"
                        value={vValue}
                        onChange={(e) => setVValue(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 font-bold text-xs focus:outline-none focus:border-[#0B1F3A]"
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="VD: 20.000"
                        value={formatMoneyInput(vValue)}
                        onChange={(e) => setVValue(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 font-bold text-xs focus:outline-none focus:border-[#0B1F3A]"
                      />
                    )}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                      {vType === 'PERCENT' ? '%' : '₫'}
                    </span>
                  </div>
                </div>

                {vType === 'PERCENT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Giảm tối đa (VNĐ) <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="VD: 50.000 (để trống nếu không giới hạn)"
                        value={formatMoneyInput(vMaxDiscount)}
                        onChange={(e) => setVMaxDiscount(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                        ₫
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Đơn tối thiểu & Giới hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: 100.000 (0 nếu không yêu cầu)"
                      value={formatMoneyInput(vMinOrder)}
                      onChange={(e) => setVMinOrder(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                      ₫
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tổng lượt sử dụng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="VD: 100"
                      value={formatMoneyInput(vUsageLimit)}
                      onChange={(e) => setVUsageLimit(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none">
                      lượt
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tối đa mỗi khách <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="VD: 1"
                      value={formatMoneyInput(vPerUserLimit)}
                      onChange={(e) => setVPerUserLimit(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none">
                      lượt
                    </span>
                  </div>
                </div>
              </div>

              {/* Gắn Sự kiện */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gắn vào Sự Kiện Khuyến Mãi</label>
                <select
                  value={vEventId}
                  onChange={(e) => {
                    setVEventId(e.target.value);
                    setVUseCustomDate(false);
                    setVStartsAt('');
                    setVEndsAt('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-[#0B1F3A]"
                >
                  <option value="">Không gắn sự kiện (Voucher độc lập)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({formatDateTimeVN(ev.startsAt)} - {formatDateTimeVN(ev.endsAt)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quy tắc ngày hiệu lực */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">Thời gian hiệu lực (Múi giờ Việt Nam)</span>

                {vEventId ? (
                  // THỜI GIAN KHI GẮN SỰ KIỆN: Ẩn checkbox không giới hạn, hiện khoảng ngày sự kiện
                  (() => {
                    const selectedEvent = events.find((ev) => ev.id === vEventId);
                    const minEventStart = toLocalDatetimeInput(selectedEvent?.startsAt);
                    const maxEventEnd = toLocalDatetimeInput(selectedEvent?.endsAt);

                    return (
                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Khung giờ sự kiện: {selectedEvent?.name}</span>
                          </div>
                          <p className="text-[11px] text-blue-700">
                            {formatDateTimeVN(selectedEvent?.startsAt || '')} — {formatDateTimeVN(selectedEvent?.endsAt || '')}
                          </p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={vUseCustomDate}
                            onChange={(e) => setVUseCustomDate(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-bold text-slate-700 text-xs">
                            Giới hạn hẹp hơn trong khoảng thời gian sự kiện
                          </span>
                        </label>

                        {!vUseCustomDate ? (
                          <p className="text-[11px] text-slate-500 italic">
                            Voucher sẽ tự động kế thừa và có hiệu lực theo toàn bộ thời gian diễn ra của sự kiện.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">Bắt đầu:</label>
                              <input
                                type="datetime-local"
                                required
                                min={minEventStart}
                                max={vEndsAt || maxEventEnd}
                                value={vStartsAt}
                                onChange={(e) => setVStartsAt(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">Kết thúc:</label>
                              <input
                                type="datetime-local"
                                required
                                min={vStartsAt || minEventStart}
                                max={maxEventEnd}
                                value={vEndsAt}
                                onChange={(e) => setVEndsAt(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  // THỜI GIAN KHI KHÔNG GẮN SỰ KIỆN: Giữ checkbox Không giới hạn thời gian
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vIsUnlimited}
                        onChange={(e) => setVIsUnlimited(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-0 cursor-pointer"
                      />
                      <span className="font-bold text-slate-700 text-xs">Không giới hạn thời gian</span>
                    </label>

                    {!vIsUnlimited && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Bắt đầu:</label>
                          <input
                            type="datetime-local"
                            required
                            value={vStartsAt}
                            onChange={(e) => setVStartsAt(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Kết thúc:</label>
                          <input
                            type="datetime-local"
                            required
                            min={vStartsAt || undefined}
                            value={vEndsAt}
                            onChange={(e) => setVEndsAt(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0B1F3A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Công tắc Kích hoạt ngay */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Kích hoạt ngay</span>
                  <span className="text-[11px] text-slate-500 block">
                    Bật để voucher có hiệu lực ngay lập tức. Tắt để lưu bản nháp và kích hoạt sau.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vIsActive}
                    onChange={(e) => setVIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Nút Submit */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVoucher}
                  className="px-6 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#163156] text-white font-black transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSubmittingVoucher ? 'Đang tạo mã...' : 'Xác Nhận Tạo Mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO SỰ KIỆN MỚI ================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-lg text-[#0B1F3A]">Tạo Sự Kiện Khuyến Mãi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên sự kiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hội Sách Mùa Thu 2026"
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả sự kiện</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt chiến dịch..."
                  value={eDesc}
                  onChange={(e) => setEDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eStartsAt}
                    onChange={(e) => setEStartsAt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày kết thúc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eEndsAt}
                    onChange={(e) => setEEndsAt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black transition-colors cursor-pointer disabled:bg-slate-300"
                >
                  {isSubmittingEvent ? 'Đang tạo...' : 'Xác Nhận Tạo Sự Kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
