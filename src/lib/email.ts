import nodemailer from 'nodemailer';
import { redis } from './redis';

// Bộ nhớ đệm fallback nếu Redis chưa cấu hình
const localOtpStore = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Tạo mã OTP ngẫu nhiên 6 chữ số
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Lưu mã OTP vào Redis / In-Memory với TTL 5 phút (300 giây)
 */
export async function saveOtp(email: string, otp: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `otp:${normalizedEmail}`;
  const ttlSeconds = 300; // 5 phút

  try {
    // 1. Thử lưu vào Redis
    if (typeof (redis as any).set === 'function') {
      await (redis as any).set(key, otp, { ex: ttlSeconds });
    }
  } catch (err) {
    // 2. Fallback sang local memory
    console.warn('Redis saveOtp fallback to Memory:', err);
  }

  // Luôn lưu cả bản sao trong local Map để đảm bảo độ tin cậy
  localOtpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Đối soát và xác minh mã OTP
 */
export async function verifyOtp(email: string, inputOtp: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `otp:${normalizedEmail}`;
  const cleanInput = inputOtp.trim();

  // 1. Kiểm tra từ Redis
  try {
    if (typeof (redis as any).get === 'function') {
      const stored = await (redis as any).get(key);
      if (stored && String(stored).trim() === cleanInput) {
        if (typeof (redis as any).del === 'function') {
          await (redis as any).del(key);
        }
        localOtpStore.delete(normalizedEmail);
        return true;
      }
    }
  } catch (err) {
    console.warn('Redis verifyOtp fallback to Memory:', err);
  }

  // 2. Kiểm tra từ Local Map
  const record = localOtpStore.get(normalizedEmail);
  if (record) {
    if (Date.now() > record.expiresAt) {
      localOtpStore.delete(normalizedEmail);
      return false;
    }
    if (record.otp === cleanInput) {
      localOtpStore.delete(normalizedEmail);
      return true;
    }
  }

  return false;
}

/**
 * Gửi email chứa mã xác minh OTP qua Gmail SMTP
 * Hỗ trợ Dual-Mode: Gửi thật nếu có biến môi trường, in ra Console / trả preview nếu chạy demo
 */
export async function sendOtpEmail(email: string, otp: string, fullName: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
        .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0B1F3A; padding: 32px 24px; text-align: center; }
        .header h1 { color: #FFFFFF; font-size: 22px; margin: 0; font-weight: 900; letter-spacing: 0.5px; }
        .header p { color: #F5A623; font-size: 13px; margin: 6px 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 15px; font-weight: 600; color: #0B1F3A; margin-bottom: 12px; }
        .otp-box { background: #FFF8E7; border: 2px dashed #F5A623; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 900; color: #0B1F3A; letter-spacing: 8px; font-family: monospace; }
        .otp-note { font-size: 12px; color: #8C6D23; margin-top: 8px; font-weight: 500; }
        .footer { background: #F1F5F9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TỔ SÁCH</h1>
          <p>Kho Tàng Tri Thức Việt</p>
        </div>
        <div class="content">
          <div class="greeting">Xin chào <strong>${fullName || 'Độc giả'}</strong>,</div>
          <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
            Cảm ơn bạn đã lựa chọn tham gia cộng đồng độc giả yêu sách tại Tổ Sách. Dưới đây là mã xác minh bảo mật một lần (OTP) để hoàn tất kích hoạt tài khoản của bạn:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-note">⏱️ Mã có hiệu lực trong vòng 5 phút (300 giây)</div>
          </div>
          <p style="font-size: 13px; color: #64748B; margin: 0;">
            Vì lý do bảo mật, vui lòng không chia sẻ mã OTP này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© 2026 Tổ Sách Studio. Đồ án Tốt nghiệp CNTT.</p>
          <p style="margin: 4px 0 0;">Phát triển bởi Nguyễn Đăng Hanh & Nguyễn Mạnh Hòa</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Nếu có cấu hình Gmail SMTP -> Gửi thật
  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword.replace(/\s+/g, ''),
        },
      });

      await transporter.sendMail({
        from: `"Nhà Sách Tổ Sách" <${gmailUser}>`,
        to: email,
        subject: `[Tổ Sách] Mã xác minh tài khoản của bạn: ${otp}`,
        html: htmlContent,
      });

      console.log(`✅ [GMAIL SMTP] Đã gửi mã OTP ${otp} tới ${email} thành công!`);
      return { sentRealEmail: true };
    } catch (error) {
      console.error('⚠️ [GMAIL SMTP ERROR] Lỗi gửi mail thật, kích hoạt chế độ Demo:', error);
    }
  }

  // 2. Chế độ Demo / Local Simulator
  console.log('====================================================');
  console.log(`📧 [TỔ SÁCH OTP SIMULATOR] Gửi mã tới: ${email}`);
  console.log(`🔑 MÃ XÁC MINH OTP: ${otp}`);
  console.log('⏱️ Thời gian sống: 5 phút');
  console.log('====================================================');

  return { sentRealEmail: false, demoOtp: otp };
}
