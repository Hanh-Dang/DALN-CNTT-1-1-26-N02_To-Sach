'use client';

import React, { useState } from 'react';
import {
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  staffPerms: Array<{
    permission: PermissionItem;
  }>;
}

interface AdminStaffClientProps {
  initialStaff: StaffMember[];
  permissions: PermissionItem[];
  currentUserEmail: string;
}

export function AdminStaffClient({
  initialStaff,
  permissions,
  currentUserEmail,
}: AdminStaffClientProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openPermissionModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    const currentCodes = staff.staffPerms.map((sp) => sp.permission.code);
    setEditingPermissions(currentCodes);
  };

  const togglePermission = (code: string) => {
    setEditingPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff) return;
    setIsSaving(true);
    setNotification(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          permissionCodes: editingPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi cập nhật.');
      }

      // Cập nhật local state
      setStaffList((prev) =>
        prev.map((s) => {
          if (s.id !== selectedStaff.id) return s;
          const updatedStaffPerms = permissions
            .filter((p) => editingPermissions.includes(p.code))
            .map((p) => ({ permission: p }));
          return {
            ...s,
            staffPerms: updatedStaffPerms,
          };
        })
      );

      setNotification({ type: 'success', message: `Đã cập nhật quyền hạn cho ${selectedStaff.fullName} thành công!` });
      setSelectedStaff(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0B1F3A]">
              <BadgeCheck className="w-5 h-5 text-[#F5A623]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
              Phân Quyền Động Nhân Viên (Dynamic RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị và cấp phát đặc quyền vận hành (Sách, Đơn hàng, Danh mục, Đánh giá) cho từng tài khoản nhân sự
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chuẩn RBAC 3 Tầng</span>
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Nhân Sự Quản Trị</span>
          <div className="text-3xl font-black text-[#0B1F3A]">{staffList.length}</div>
          <span className="text-[11px] text-slate-400">Gồm Super Admin và các nhân viên nghiệp vụ</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số Quyền Hạn Hệ Thống</span>
          <div className="text-3xl font-black text-[#F5A623]">{permissions.length}</div>
          <span className="text-[11px] text-slate-400">Các module chức năng độc lập trong bảng permissions</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bảo Mật Truy Vết</span>
          <div className="text-3xl font-black text-emerald-700">100%</div>
          <span className="text-[11px] text-slate-400">Mọi lượt cập nhật phân quyền đều ghi nhận Audit Log</span>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider">
            Danh Sách Nhân Viên & Ma Trận Phân Quyền
          </h2>
          <span className="text-xs text-slate-400">Nhấn &quot;Cấp quyền&quot; để bật/tắt quyền tương ứng</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Nhân Viên</th>
                <th className="py-3 px-6">Vai Trò</th>
                <th className="py-3 px-6">Quyền Hạn Hiện Có</th>
                <th className="py-3 px-6 text-center">Trạng Thái</th>
                <th className="py-3 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {staffList.map((member) => {
                const isSuper = member.role === 'SUPER_ADMIN';
                const memberPermCodes = member.staffPerms.map((p) => p.permission.code);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-sm flex items-center gap-1.5">
                            {member.fullName}
                            {member.email === currentUserEmail && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-sm">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px]">{member.email}</div>
                          {member.phone && <div className="text-slate-400 text-[10px]">{member.phone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-6">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 bg-[#0B1F3A] text-[#F5A623] px-2.5 py-1 rounded-full text-[11px] font-black shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623]" />
                          <span>SUPER_ADMIN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-200">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>STAFF</span>
                        </span>
                      )}
                    </td>

                    {/* Permissions list */}
                    <td className="py-4 px-6">
                      {isSuper ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 w-fit">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Toàn quyền hệ thống (Full Access)</span>
                        </span>
                      ) : memberPermCodes.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">Chưa được cấp quyền nào</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {member.staffPerms.map((sp) => (
                            <span
                              key={sp.permission.code}
                              className="text-[10px] font-bold bg-amber-50 text-[#8F5E00] border border-amber-200 px-2 py-0.5 rounded-md"
                            >
                              {sp.permission.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Hoạt động</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {isSuper ? (
                        <span className="text-slate-400 text-xs italic">Cố định</span>
                      ) : (
                        <button
                          onClick={() => openPermissionModal(member)}
                          className="bg-white hover:bg-slate-100 text-[#0B1F3A] font-bold text-xs px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs hover:border-[#F5A623]"
                        >
                          Cấp Quyền ⚙️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Edit Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-[#0B1F3A]">
                  Phân Quyền Cho Nhân Viên
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStaff.fullName} ({selectedStaff.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checkbox Matrix */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Chọn các quyền được phép thực thi:
              </span>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {permissions.map((perm) => {
                  const isChecked = editingPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      onClick={() => togglePermission(perm.code)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/60 border-[#F5A623] shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 accent-[#F5A623] rounded-md cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                          <span>{perm.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded-sm">
                            {perm.code}
                          </span>
                        </div>
                        {perm.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={isSaving}
                className="bg-[#0B1F3A] hover:bg-[#163156] text-[#F5A623] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span>Lưu Phân Quyền</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
