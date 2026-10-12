import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, saveOtp, sendOtpEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra xem email đã có tài khoản ACTIVE chưa
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký và kích hoạt trên hệ thống' },
        { status: 409 }
      );
    }

    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = generateOtp();

    // Lưu vào Redis / In-Memory với TTL 5 phút
    await saveOtp(normalizedEmail, otp);

    // Gửi email qua Gmail SMTP (hoặc log simulator)
    const result = await sendOtpEmail(normalizedEmail, otp, fullName || 'Độc giả');

    return NextResponse.json({
      success: true,
      message: result.sentRealEmail
        ? 'Mã xác minh đã được gửi tới hòm thư Gmail của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư rác!'
        : 'Mã xác minh đã được tạo thành công!',
      sentRealEmail: result.sentRealEmail,
      demoOtp: result.demoOtp, // Hỗ trợ nút tự động điền khi demo đồ án
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi mã OTP:', error);
    return NextResponse.json({ error: 'Không thể gửi mã xác minh' }, { status: 500 });
  }
}
