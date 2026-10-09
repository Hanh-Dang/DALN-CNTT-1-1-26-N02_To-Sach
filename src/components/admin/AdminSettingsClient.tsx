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
  Search,
  Zap,
  RefreshCw,
  Cpu,
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
  const [isSyncingES, setIsSyncingES] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncElasticsearch = async () => {
    setIsSyncingES(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/elasticsearch/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đồng bộ thất bại');
      setSyncResult({ type: 'success', message: data.message || 'Đồng bộ kho sách sang Elasticsearch 8.x thành công!' });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.message || 'Lỗi khi đồng bộ sang Elasticsearch' });
    } finally {
      setIsSyncingES(false);
    }
  };

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

          {/* Proposal Advanced Tools Section */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-amber-50/30 p-6 rounded-2xl border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#0B1F3A] text-[#F5A623]">
                  <Cpu className="w-4 h-4 text-[#F5A623]" />
                </span>
                <div>
                  <h3 className="font-bold text-[#0B1F3A] text-sm">
                    Công Cụ Nâng Cao Theo Proposal (Mục 3.1 — 3.4)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bộ 3 hạ tầng nâng cấp phục vụ Tìm kiếm thông minh, Bộ nhớ đệm và Cá nhân hóa
                  </p>
                </div>
              </div>

              <button
                onClick={handleSyncElasticsearch}
                disabled={isSyncingES}
                className="bg-[#0B1F3A] hover:bg-[#163156] text-[#F5A623] font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
              >
                {isSyncingES ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang đồng bộ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span>⚡ Đồng Bộ Elasticsearch 8.x (Index books_v1)</span>
                  </>
                )}
              </button>
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  syncResult.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{syncResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Mục 3.4 • In-Memory Cache</span>
                <div className="font-black text-[#0B1F3A] text-sm flex items-center gap-1">
                  <span>Redis Cloud (Upstash)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-sm font-bold">TTL 30D</span>
                </div>
                <p className="text-[11px] text-slate-500">Tự động thu hồi bộ nhớ sau 2.592.000s; có In-Memory Fallback</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Mục 3.1 • Recommendation</span>
                <div className="font-black text-[#0B1F3A] text-sm flex items-center gap-1">
                  <span>Hybrid 5-Factor Engine</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-sm font-bold">5 Trọng Số</span>
                </div>
                <p className="text-[11px] text-slate-500">Collab 35% + Content 25% + Behavior 15% + Rating 20% + Trend 5%</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Mục 3.2 • Smart Search</span>
                <div className="font-black text-[#0B1F3A] text-sm flex items-center gap-1">
                  <span>Elasticsearch 8.x + PG</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-sm font-bold">Fuzzy & Boost</span>
                </div>
                <p className="text-[11px] text-slate-500">Boost title^3/authors^2, synonyms tiếng Việt, tự động Fallback PG</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
