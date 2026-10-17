'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  ShoppingBag,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { formatVND, formatDateVN } from '@/lib/utils';

export interface CustomerData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  reviewsCount: number;
  location: string;
}

interface AdminCustomersClientProps {
  initialCustomers: CustomerData[];
}

export function AdminCustomersClient({ initialCustomers }: AdminCustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));

    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalMembers = customers.length;
  const activeMembers = customers.filter((c) => c.status === 'ACTIVE').length;
  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0B1F3A]">
              <Users className="w-5 h-5 text-[#F5A623]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              Khách Hàng Thành Viên
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị danh sách độc giả, tổng chi tiêu tích lũy, số lượng đơn mua và tần suất đóng góp đánh giá
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0B1F3A] bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            {totalMembers} Thành Viên Đã Đăng Ký
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang Hoạt Động</span>
          <div className="text-3xl font-black text-emerald-700">{activeMembers}</div>
          <span className="text-[11px] text-slate-400">Tài khoản hợp lệ và có quyền đặt sách</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Chi Tiêu Khách Hàng</span>
          <div className="text-3xl font-black text-[#0B1F3A]">{formatVND(totalSpentAll)}</div>
          <span className="text-[11px] text-slate-400">Doanh thu tích lũy từ các đơn mua thành công</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trung Bình Đơn / Khách</span>
          <div className="text-3xl font-black text-[#F5A623]">
            {totalMembers > 0 ? (customers.reduce((a, b) => a + b.ordersCount, 0) / totalMembers).toFixed(1) : 0} đơn
          </div>
          <span className="text-[11px] text-slate-400">Tỷ lệ mua hàng trung bình trên mỗi tài khoản</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B1F3A] focus:ring-1 focus:ring-[#0B1F3A] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-[#0B1F3A] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({totalMembers})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hoạt động ({activeMembers})
          </button>
          <button
            onClick={() => setFilterStatus('BANNED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'BANNED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bị khóa ({totalMembers - activeMembers})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Khách Hàng</th>
                <th className="py-3 px-6">Liên Hệ & Khu Vực</th>
                <th className="py-3 px-6 text-center">Đơn Mua</th>
                <th className="py-3 px-6 text-right">Tổng Chi Tiêu</th>
                <th className="py-3 px-6 text-center">Trạng Thái</th>
                <th className="py-3 px-6 text-right">Ngày Tham Gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy khách hàng nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0B1F3A] border border-slate-200 flex items-center justify-center font-bold text-xs">
                          {cust.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-sm">{cust.fullName}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{cust.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone || 'Chưa cập nhật SĐT'}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{cust.location}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold text-xs">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{cust.ordersCount} đơn</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right font-black text-[#0B1F3A]">
                      {formatVND(cust.totalSpent)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      {cust.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Bị khóa</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right text-slate-400 text-[11px]">
                      {formatDateVN(cust.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
