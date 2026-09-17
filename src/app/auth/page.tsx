'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpen, Lock, Mail, Phone, User, Eye, EyeOff, 
  ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, 
  Loader2, Sparkles 
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    label: 'Khách hàng',
    desc: 'Tài khoản độc giả mua sách',
    email: 'customer@gmail.com',
    password: 'Password@123',
    icon: '👤',
    color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900',
  },
  {
    label: 'Staff Kho',
    desc: 'Quản lý đầu sách & tồn kho',
    email: 'staff.kho@tosach.vn',
    password: 'Password@123',
    icon: '📦',
    color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900',
  },
  {
    label: 'Staff Đơn',
    desc: 'Xử lý đơn & vận chuyển',
    email: 'staff.order@tosach.vn',
    password: 'Password@123',
    icon: '📋',
    color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900',
  },
  {
    label: 'Super Admin',
    desc: 'Toàn quyền quản trị hệ thống',
    email: 'admin@tosach.vn',
    password: 'Password@123',
    icon: '👑',
    color: 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-900',
  },
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick fill demo account
  const handleQuickFill = (email: string, pass: string) => {
    setTab('login');
    setLoginEmail(email);
    setLoginPassword(pass);
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Đăng nhập không thành công. Vui lòng thử lại!');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');

      // Dispatch event to update header auth state
      window.dispatchEvent(new Event('auth-change'));

      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (data.user?.role === 'STAFF' || data.user?.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        router.refresh();
      }, 700);
    } catch {
      setErrorMsg('Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền!');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Đăng ký tài khoản không thành công!');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển tiếp...');

      window.dispatchEvent(new Event('auth-change'));

      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/');
        }
        router.refresh();
      }, 700);
    } catch {
      setErrorMsg('Không thể kết nối máy chủ. Vui lòng kiểm tra lại!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] py-10 px-4 flex items-center justify-center bg-slate-50/60">
      <div className="w-full max-w-lg">
        {/* Brand Top Header */}
        <div className="text-center space-y-2 mb-6">
          <Link 
            href="/"
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B1F3A] text-[#F5A623] shadow-md hover:scale-105 transition-transform"
          >
            <BookOpen className="w-7 h-7 stroke-[2.2]" />
          </Link>
          <h1 className="text-2xl font-black text-[#0B1F3A] tracking-tight">
            TỔ SÁCH XIN CHÀO
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sách về tổ, tri thức bay xa — Nền tảng B2C trực tuyến
          </p>
          
          {redirectPath && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-semibold text-amber-900 mt-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Vui lòng đăng nhập để tiếp tục đến: <strong>{redirectPath}</strong></span>
            </div>
          )}
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {/* Tab switch */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-500 hover:text-[#0B1F3A]'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-500 hover:text-[#0B1F3A]'
              }`}
            >
              Đăng Ký Mới
            </button>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Mật khẩu</label>
                  <span className="text-[11px] text-[#F5A623] hover:underline cursor-pointer font-medium">
                    Quên mật khẩu?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded accent-[#0B1F3A]" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0B1F3A] hover:bg-[#163156] disabled:opacity-70 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Họ và tên độc giả</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Đọc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Số điện thoại</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912 345 678 (tùy chọn)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[#0B1F3A] focus:outline-hidden focus:border-[#0B1F3A] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none text-slate-600 text-[11px]">
                <input type="checkbox" required className="rounded accent-[#0B1F3A] mt-0.5" />
                <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Tổ Sách.</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F5A623] hover:bg-[#e09419] disabled:opacity-70 text-[#0B1F3A] font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A]" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Ký Tài Khoản</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#F5A623]" />
                Tài khoản mẫu đồ án (1-Click điền)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Bảo vệ & Chấm thi</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email, acc.password)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${acc.color}`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{acc.icon}</span>
                    <span>{acc.label}</span>
                  </div>
                  <div className="text-[10px] opacity-75 truncate mt-0.5 font-mono">
                    {acc.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Pillars Footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            JWT HttpOnly Cookie
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#0B1F3A]" />
            Bcrypt Password Hash
          </span>
          <span>•</span>
          <Link href="/" className="text-[#F5A623] hover:underline font-semibold">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B1F3A]" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
