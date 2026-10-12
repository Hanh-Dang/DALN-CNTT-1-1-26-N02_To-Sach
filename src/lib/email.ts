import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
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

  const formattedOtp = otp.split('').join(' ');
  const recipientName = fullName && fullName.trim() ? fullName.trim() : 'Quý độc giả';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã xác thực Tổ Sách</title>
      <style>
        body { margin: 0; padding: 0; background-color: #F0F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #F0F4F8; padding: 36px 12px; }
        .container { max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(11, 31, 58, 0.08), 0 8px 10px -6px rgba(11, 31, 58, 0.04); border: 1px solid #E2E8F0; }
        .header { background: linear-gradient(180deg, #09172B 0%, #0F2547 100%); padding: 34px 24px 26px; text-align: center; }
        .header-logo-row { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .book-icon-badge { display: inline-block; border: 1.5px solid #F5A623; border-radius: 8px; padding: 3px 6px; font-size: 15px; line-height: 1; color: #F5A623; vertical-align: middle; }
        .header-brand { font-size: 23px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px; display: inline-block; vertical-align: middle; margin-left: 6px; }
        .header-slogan { font-size: 11px; font-weight: 800; color: #F5A623; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 8px; }
        .meta-bar { padding: 12px 32px; background-color: #FFFFFF; border-bottom: 1px solid #F1F5F9; font-size: 12px; color: #64748B; }
        .meta-left { float: left; }
        .meta-right { float: right; color: #94A3B8; }
        .clear { clear: both; }
        .body-content { padding: 32px 32px 20px; }
        .greeting { font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 14px 0; }
        .intro-text { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-container { background-color: #FFFDF7; border: 1.5px solid #FDE68A; border-radius: 16px; padding: 22px 20px; text-align: center; margin: 0 0 24px 0; }
        .otp-label { font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px; }
        .otp-pill { display: inline-block; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .otp-digits { font-size: 34px; font-weight: 800; color: #0F172A; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; display: inline-block; margin-left: 10px; }
        .otp-expiry { font-size: 12px; color: #64748B; margin-top: 12px; font-weight: 500; }
        .security-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin: 0 0 24px 0; text-align: left; }
        .security-title { font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 6px; }
        .security-desc { font-size: 12px; color: #64748B; line-height: 1.6; }
        .support-line { text-align: center; font-size: 12px; color: #64748B; margin-bottom: 24px; }
        .footer-section { border-top: 1px solid #E2E8F0; padding: 24px 32px 28px; text-align: center; background-color: #FFFFFF; }
        .footer-copyright { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; }
        .footer-info { font-size: 11px; color: #94A3B8; line-height: 1.5; margin-bottom: 4px; }
        .footer-links { font-size: 11px; color: #2563EB; margin-top: 12px; }
        .footer-link { color: #2563EB; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- 1. HEADER BRANDING -->
          <div class="header">
            <div class="header-logo-row">
              <img src="cid:tosach-logo" width="38" height="38" alt="Tổ Sách" style="display: inline-block; vertical-align: middle; border-radius: 9px; border: 1.5px solid #F5A623; margin-right: 8px;" />
              <span class="header-brand">TỔ SÁCH</span>
            </div>
            <div class="header-slogan">SÁCH VỀ TỔ, TRI THỨC BAY XA</div>
          </div>

          <!-- 2. SUB-HEADER META BAR -->
          <div class="meta-bar">
            <div class="meta-left">
              Từ: <strong style="color: #0B1F3A;">Tổ Sách</strong> &lt;no-reply@tosach.vn&gt;
            </div>
            <div class="meta-right">
              Thư xác thực hệ thống
            </div>
            <div class="clear"></div>
          </div>

          <!-- 3. BODY CONTENT -->
          <div class="body-content">
            <h2 class="greeting">Xin chào ${recipientName},</h2>
            <p class="intro-text">
              Cảm ơn bạn đã lựa chọn tham gia cộng đồng yêu sách tại <strong style="color: #0B1F3A;">Tổ Sách</strong>. Dưới đây là mã xác thực bảo mật một lần (OTP) để xác minh tài khoản của bạn:
            </p>

            <!-- OTP Highlight Card -->
            <div class="otp-container">
              <div class="otp-label">MÃ XÁC THỰC MỘT LẦN (OTP)</div>
              <div class="otp-pill">
                <span class="otp-digits">${formattedOtp}</span>
              </div>
              <div class="otp-expiry">
                Mã có hiệu lực trong vòng <strong style="color: #0F172A;">5 phút</strong>
              </div>
            </div>

            <!-- Security Advisory -->
            <div class="security-box">
              <div class="security-title">Lưu ý bảo mật từ Tổ Sách</div>
              <div class="security-desc">
                Vì lý do an toàn cho tài khoản, vui lòng <strong style="color: #334155;">tuyệt đối không chia sẻ mã OTP</strong> này cho bất kỳ ai, kể cả nhân viên hỗ trợ của Tổ Sách. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc thông báo ngay cho ban hỗ trợ của chúng tôi.
              </div>
            </div>

            <!-- Support Hotline -->
            <div class="support-line">
              Cần hỗ trợ? Liên hệ Tổng đài: <strong style="color: #1E40AF;">1900 6868</strong> hoặc email: <a href="mailto:hotro@tosach.vn" style="color: #2563EB; text-decoration: none; font-weight: 600;">hotro@tosach.vn</a>
            </div>
          </div>

          <!-- 4. OFFICIAL FOOTER -->
          <div class="footer-section">
            <div class="footer-copyright">
              © 2026 Nhà sách Trực tuyến Tổ Sách. Bảo lưu mọi quyền.
            </div>
            <div class="footer-info">
              Trụ sở: Tòa nhà Tri Thức, 123 Đường Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </div>
            <div class="footer-info">
              Giấy phép cung cấp dịch vụ Sàn TMĐT số 0316889901 do Sở KH&ĐT TP.HCM cấp.
            </div>
            <div class="footer-links">
              <a href="https://tosach.vn/terms" class="footer-link">Điều khoản sử dụng</a>
              &nbsp;&nbsp;•&nbsp;&nbsp;
              <a href="https://tosach.vn/privacy" class="footer-link">Chính sách bảo mật</a>
              &nbsp;&nbsp;•&nbsp;&nbsp;
              <a href="https://tosach.vn/help" class="footer-link">Trung tâm trợ giúp</a>
            </div>
          </div>
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

      const logoPath = path.join(process.cwd(), 'public/logo-icon.png');
      const attachments = fs.existsSync(logoPath)
        ? [
            {
              filename: 'logo-icon.png',
              path: logoPath,
              cid: 'tosach-logo',
            },
          ]
        : [];

      await transporter.sendMail({
        from: `"Nhà Sách Tổ Sách" <${gmailUser}>`,
        to: email,
        subject: `[Tổ Sách] Mã xác minh tài khoản của bạn: ${otp}`,
        html: htmlContent,
        attachments,
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
