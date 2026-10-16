'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpen, Lock, Mail, Phone, User, Eye, EyeOff, 
  ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, 
  Loader2, Sparkles, X, KeyRound, RefreshCw, MailCheck 
} from 'lucide-react';
import { ToSachLogo } from '@/components/brand/ToSachLogo';

const DEMO_ACCOUNTS = [
  {
    label: 'Khách hàng',
    desc: 'Tài khoản độc giả mua sách',
    email: 'customer@gmail.com',
    password: 'User@123',
    icon: '👤',
    color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900',
  },
  {
    label: 'Staff Kho',
    desc: 'Quản lý đầu sách & tồn kho',
    email: 'staff.kho@tosach.vn',
    password: 'Staff@123',
    icon: '📦',
    color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900',
  },
  {
    label: 'Staff Đơn',
    desc: 'Xử lý đơn & vận chuyển',
    email: 'staff.order@tosach.vn',
    password: 'Staff@123',
    icon: '📋',
    color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900',
  },
  {
    label: 'Super Admin',
    desc: 'Toàn quyền quản trị hệ thống',
    email: 'admin@tosach.vn',
    password: 'Admin@123',
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

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Đếm ngược 60s gửi lại mã OTP
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpModal && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOtpModal, countdown]);

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

  // Bước 1: Gửi mã OTP xác minh về hòm thư Gmail
  const handleInitiateRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          fullName: regName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Không thể gửi mã xác minh tới email');
        setIsLoading(false);
        return;
      }

      setDemoOtpCode(data.demoOtp || null);
      setOtpCode('');
      setShowOtpModal(true);
      setCountdown(60);
      setIsLoading(false);
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để gửi mã xác minh');
      setIsLoading(false);
    }
  };

  // Bước 2: Xác minh mã OTP 6 số và hoàn tất tạo tài khoản
  const handleConfirmRegisterWithOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số mã xác minh OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || data.message || 'Xác minh OTP thất bại!');
        setIsVerifyingOtp(false);
        return;
      }

      setShowOtpModal(false);
      setSuccessMsg('Xác minh Gmail & Đăng ký tài khoản thành công! Đang chuyển tiếp...');
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
      setErrorMsg('Không thể kết nối máy chủ khi xác minh OTP');
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] py-10 px-4 flex items-center justify-center bg-slate-50/60">
      <div className="w-full max-w-lg">
        {/* Brand Top Header */}
        <div className="text-center space-y-2 mb-6">
          <Link 
            href="/"
            className="inline-block hover:scale-105 transition-transform"
            title="Về trang chủ Nhà Sách Tổ Sách"
          >
            <ToSachLogo size={56} />
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
            <form onSubmit={handleInitiateRegister} className="space-y-3.5 text-xs">
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
                    <span>Đang gửi mã xác minh...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục: Nhận mã OTP qua Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Switcher Section (Chỉ hiển thị ở Development / Demo Đồ Án, tự động ẩn trên Production) */}
          {process.env.NODE_ENV !== 'production' && (
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
          )}
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

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0B1F3A] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[#F5A623]">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">Xác minh hòm thư Gmail</h3>
                  <p className="text-[11px] text-slate-300">Bảo mật tài khoản 2 lớp (OTP)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleConfirmRegisterWithOtp} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Mã OTP 6 chữ số vừa được gửi đến địa chỉ email:
                <div className="font-bold text-[#0B1F3A] bg-slate-100 px-2.5 py-1.5 rounded-lg mt-1 font-mono text-center text-xs">
                  {regEmail}
                </div>
              </div>

              {/* Demo OTP 1-click fallback badge for thesis defense */}
              {demoOtpCode && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
                      Mã kiểm thử Hội đồng chấm thi
                    </span>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      {demoOtpCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(demoOtpCode)}
                    className="w-full text-left text-[11px] text-amber-800 hover:text-amber-900 font-medium bg-amber-100/60 hover:bg-amber-100 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>⚡ Bấm để tự động điền mã demo</span>
                    <span className="font-mono font-black">{demoOtpCode}</span>
                  </button>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Nhập mã xác thực 6 chữ số
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center text-2xl font-black font-mono tracking-widest bg-slate-50 border-2 border-slate-200 focus:border-[#0B1F3A] focus:bg-white rounded-xl py-3 text-[#0B1F3A] focus:outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  Mã xác thực có hiệu lực trong vòng 5 phút
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full bg-[#0B1F3A] hover:bg-[#163156] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                      <span>Đang xác minh OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác minh & Hoàn tất đăng ký</span>
                      <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Sửa lại thông tin
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || isLoading}
                    onClick={() => handleInitiateRegister()}
                    className="text-[#0B1F3A] hover:text-[#F5A623] font-semibold disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
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
