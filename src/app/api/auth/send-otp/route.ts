import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, saveOtp, sendOtpEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName } = await req.json();

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'Định dạng email không hợp lệ' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(req);

    // Rate limit: Tối đa 3 lần / 5 phút theo Email và 10 lần / 10 phút theo IP (H4)
    const emailLimit = await checkRateLimit(`send_otp_email:${normalizedEmail}`, 3, 300);
    if (!emailLimit.success) {
      return NextResponse.json(
        { error: 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần cho email này. Vui lòng đợi 5 phút trước khi thử lại.' },
        { status: 429 }
      );
    }

    const ipLimit = await checkRateLimit(`send_otp_ip:${clientIp}`, 10, 600);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu gửi mã OTP từ thiết bị của bạn. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    // Kiểm tra xem email đã có tài khoản ACTIVE chưa
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const SUCCESS_MSG = 'Nếu địa chỉ email hợp lệ, mã xác minh OTP sẽ được gửi tới hòm thư của bạn trong vài phút.';

    if (existing && existing.status === 'ACTIVE') {
      // L-j: Chống dò quét tài khoản (User Enumeration): Trả về thông báo thành công chung
      return NextResponse.json({
        success: true,
        message: SUCCESS_MSG,
      });
    }

    // Tạo mã OTP 6 số ngẫu nhiên bằng CSPRNG
    const otp = generateOtp();

    // Lưu vào Redis / In-Memory với TTL 5 phút
    await saveOtp(normalizedEmail, otp);

    // Gửi email qua Gmail SMTP (hoặc log simulator)
    const result = await sendOtpEmail(normalizedEmail, otp, fullName || 'Độc giả');

    return NextResponse.json({
      success: true,
      message: SUCCESS_MSG,
      sentRealEmail: result.sentRealEmail,
      demoOtp: process.env.NODE_ENV !== 'production' ? result.demoOtp : undefined, // Chỉ hỗ trợ khi demo/dev đồ án
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi mã OTP:', error);
    return NextResponse.json({ error: 'Không thể gửi mã xác minh' }, { status: 500 });
  }
}
