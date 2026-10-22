import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

import { redis } from './redis';

const INSECURE_DEFAULT_SECRETS = new Set([
  'tosach_super_secret_jwt_key_2026_proposals',
  'default_tosach_jwt_secret_dev_2026_dev_only',
]);

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  const isInsecure = !secret || secret.length < 32 || INSECURE_DEFAULT_SECRETS.has(secret);

  if (isInsecure) {
    // Cho phép quá trình build static của Next.js hoàn tất thành công với cảnh báo (N5)
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build') {
      console.warn(
        '[SECURITY WARNING] Build phase detected with default/insecure JWT_SECRET. Please make sure to configure a strong JWT_SECRET before launching production server!'
      );
      return new TextEncoder().encode('temp_build_key_must_be_overridden_in_prod_env_64bytes');
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing, shorter than 32 characters, or using the public insecure default key from .env.example! Server refused to start. Please generate a strong key using "openssl rand -base64 48".'
      );
    }
    console.warn(
      '[SECURITY WARNING] process.env.JWT_SECRET is missing, insecure, or using the public default template key. Please set a custom secure JWT_SECRET.'
    );
    return new TextEncoder().encode('default_tosach_jwt_secret_dev_2026_dev_only');
  }
  return new TextEncoder().encode(secret);
}

const key = getJwtSecretKey();

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  [key: string]: any;
}

/**
 * Băm mật khẩu người dùng
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Kiểm tra mật khẩu khớp với hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Tạo token JWT có thời hạn 7 ngày
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Thu hồi và đưa token JWT vào danh sách đen (Blacklist) phía server khi đăng xuất (Lỗi M6)
 */
export async function revokeToken(token: string): Promise<void> {
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, key);
    const exp = (payload.exp as number) || Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = Math.max(60, exp - now);
    await redis.set(`jwt_blacklist:${token}`, 'revoked', { ex: ttlSeconds });
  } catch {
    // Nếu token lỗi hoặc hết hạn sẵn thì không cần blacklist
  }
}

/**
 * Kiểm tra xem token có nằm trong blacklist phía server hay không
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  try {
    const status = await redis.get(`jwt_blacklist:${token}`);
    return status === 'revoked';
  } catch {
    return false;
  }
}

/**
 * Xác thực và giải mã token JWT kèm kiểm tra danh sách thu hồi phía server (Lỗi M6)
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    // 1. Kiểm tra Blacklist phía server
    const revoked = await isTokenRevoked(token);
    if (revoked) return null;

    // 2. Xác thực chữ ký và thời hạn
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Lấy thông tin user hiện tại từ Cookie trong Server Components hoặc Server Actions
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tosach_token')?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        staffPerms: {
          select: {
            permission: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    const permissions = user.staffPerms.map((sp) => sp.permission.code);

    return {
      ...user,
      permissions,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
