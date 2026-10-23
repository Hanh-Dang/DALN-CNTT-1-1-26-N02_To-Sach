const INSECURE_DEFAULT_SECRETS = new Set([
  'tosach_super_secret_jwt_key_2026_proposals',
  'default_tosach_jwt_secret_dev_2026_dev_only',
  'your_random_secure_jwt_secret_key_at_least_32_chars',
]);

/**
 * Trả về khóa JWT chuẩn hóa dùng chung cho cả Server APIs (auth.ts) và Next.js Proxy/Middleware (proxy.ts)
 * Đảm bảo 100% đồng bộ chữ ký xác thực, tránh lỗi lệch khóa làm đá văng phiên đăng nhập.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  const isInsecure = !secret || secret.length < 32 || INSECURE_DEFAULT_SECRETS.has(secret);

  if (isInsecure) {
    // Cho phép quá trình build static của Next.js hoàn tất thành công với cảnh báo (N5)
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build') {
      return new TextEncoder().encode('temp_build_key_must_be_overridden_in_prod_env_64bytes');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing, shorter than 32 characters, or using the public insecure default key from .env.example! Server refused to start. Please generate a strong key using "openssl rand -base64 48".'
      );
    }
    return new TextEncoder().encode('default_tosach_jwt_secret_dev_2026_dev_only');
  }
  return new TextEncoder().encode(secret);
}
