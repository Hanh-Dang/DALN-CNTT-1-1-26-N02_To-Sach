import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default_tosach_jwt_secret_dev_2026';
const key = new TextEncoder().encode(JWT_SECRET);

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
 * Xác thực và giải mã token JWT
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
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
