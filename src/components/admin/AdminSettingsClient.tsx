'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  FileText,
  Server,
  Database,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  User,
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
}

interface AdminSettingsClientProps {
  initialAuditLogs: AuditLogItem[];
  systemInfo: {
    nodeVersion: string;
    nextVersion: string;
    database: string;
    architecture: string;
    environment: string;
  };
}

export function AdminSettingsClient({ initialAuditLogs, systemInfo }: AdminSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'SYSTEM'>('AUDIT');

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('DELETE') || action.includes('BAN')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0B1F3A]">
              <Settings className="w-5 h-5 text-[#F5A623]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              Cài Đặt Hệ Thống & Nhật Ký Kiểm Toán (Audit Logs)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi truy vết toàn bộ hoạt động quản trị, thay đổi quyền hạn và thông số hạ tầng ứng dụng
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-[#F5A623]" />
            <span>Nhật Ký Kiểm Toán ({initialAuditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SYSTEM'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-[#F5A623]" />
            <span>Thông Số Hạ Tầng</span>
          </button>
        </div>
      </div>

      {activeTab === 'AUDIT' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F5A623]" />
              <span>Dòng Thời Gian Kiểm Toán (Audit Trail Timeline)</span>
            </h2>
            <span className="text-xs text-slate-400">Tự động ghi nhận bởi Prisma Middleware & Admin API</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Thời Gian</th>
                  <th className="py-3 px-6">Người Thực Hiện</th>
                  <th className="py-3 px-6">Hành Động</th>
                  <th className="py-3 px-6">Đối Tượng</th>
                  <th className="py-3 px-6">Chi Tiết Biến Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {initialAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Chưa có sự kiện kiểm toán nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  initialAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="font-bold text-[#0B1F3A]">{log.user.fullName}</div>
                        <div className="text-[11px] text-slate-400">{log.user.email}</div>
                      </td>

                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-semibold text-slate-700">
                        {log.targetType} {log.targetId ? `(#${log.targetId.slice(0, 8)})` : ''}
                      </td>

                      <td className="py-3.5 px-6">
                        <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg max-w-sm overflow-x-auto border border-slate-100">
                          {log.details ? JSON.stringify(log.details) : 'None'}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* System Info View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0B1F3A] text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <Server className="w-4 h-4 text-[#F5A623]" />
              <span>Hạ Tầng Điện Toán (Compute & Framework)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Framework</span>
                <span className="font-bold text-[#0B1F3A]">{systemInfo.nextVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Node.js Runtime</span>
                <span className="font-bold text-[#0B1F3A]">{systemInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Mô Hình Kiến Trúc</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {systemInfo.architecture}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Môi Trường Chạy</span>
                <span className="font-bold text-[#0B1F3A] uppercase">{systemInfo.environment}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0B1F3A] text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-4 h-4 text-[#F5A623]" />
              <span>Cơ Sở Dữ Liệu & Kết Nối (Data Layer)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Hệ Quản Trị CSDL</span>
                <span className="font-bold text-[#0B1F3A]">{systemInfo.database}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Chuẩn Dữ Liệu</span>
                <span className="font-bold text-[#0B1F3A]">14 Bảng Quan Hệ 3NF</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">ORM Framework</span>
                <span className="font-bold text-[#0B1F3A]">Prisma 6 (Type-safe Client)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Trạng Thái Kết Nối</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoạt động bình thường (Healthy)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
