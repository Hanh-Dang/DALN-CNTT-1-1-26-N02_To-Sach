import { NextRequest } from 'next/server';
import { redis } from './redis';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// In-Memory store dùng làm fallback hoặc chạy môi trường local
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

// Định kỳ quét dọn cache hết hạn chống tràn RAM
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, item] of memoryStore.entries()) {
      if (now > item.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

/**
 * Trích xuất địa chỉ IP của Client từ Request Headers
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Kiểm tra và ghi nhận tần suất request (Token Bucket / Sliding Window)
 * Dùng cho các endpoint thông thường như Send-OTP, Register, Chat, v.v.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const normalizedKey = `ratelimit:${key.toLowerCase().trim()}`;
  const now = Date.now();

  // 1. Thử qua Redis nếu có
  try {
    if (typeof (redis as any).get === 'function' && typeof (redis as any).set === 'function') {
      const stored = await (redis as any).get(normalizedKey);
      if (stored !== null && stored !== undefined) {
        const current = Number(stored);
        if (current >= limit) {
          return {
            success: false,
            remaining: 0,
            retryAfterSeconds: windowSeconds,
          };
        }
        await (redis as any).set(normalizedKey, current + 1, { ex: windowSeconds });
        return {
          success: true,
          remaining: Math.max(0, limit - (current + 1)),
          retryAfterSeconds: 0,
        };
      } else {
        await (redis as any).set(normalizedKey, 1, { ex: windowSeconds });
        return {
          success: true,
          remaining: limit - 1,
          retryAfterSeconds: 0,
        };
      }
    }
  } catch (err) {
    console.warn('Redis rate limit fallback to memory:', err);
  }

  // 2. Fallback In-Memory
  const record = memoryStore.get(normalizedKey);
  if (!record || now > record.resetAt) {
    memoryStore.set(normalizedKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      success: true,
      remaining: limit - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Quản lý số lần thử sai cho tính năng Đăng nhập (Chống Brute-force mật khẩu - Lỗi H4)
 */
const LOGIN_ATTEMPT_PREFIX = 'login_fail:';

export async function isLoginBlocked(
  identifier: string,
  maxAttempts = 5
): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  const key = `${LOGIN_ATTEMPT_PREFIX}${identifier.toLowerCase().trim()}`;
  const now = Date.now();

  const record = memoryStore.get(key);
  if (!record) return { blocked: false, retryAfterSeconds: 0 };

  if (now > record.resetAt) {
    memoryStore.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export async function recordLoginFailure(
  identifier: string,
  windowSeconds = 900 // Mặc định khóa 15 phút
): Promise<{ currentFailures: number; remainingAttempts: number; isNowBlocked: boolean }> {
  const key = `${LOGIN_ATTEMPT_PREFIX}${identifier.toLowerCase().trim()}`;
  const now = Date.now();
  const maxAttempts = 5;

  let record = memoryStore.get(key);
  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    memoryStore.set(key, record);
  } else {
    record.count += 1;
  }

  const remainingAttempts = Math.max(0, maxAttempts - record.count);
  return {
    currentFailures: record.count,
    remainingAttempts,
    isNowBlocked: record.count >= maxAttempts,
  };
}

export async function clearLoginFailures(identifier: string): Promise<void> {
  const key = `${LOGIN_ATTEMPT_PREFIX}${identifier.toLowerCase().trim()}`;
  memoryStore.delete(key);
}
