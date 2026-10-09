import { Redis } from '@upstash/redis';

// 30 ngày tính bằng giây: 30 * 24 * 60 * 60 = 2,592,000s (theo chuẩn Proposal Mục 3.4)
export const RECENTLY_VIEWED_TTL_SECONDS = 30 * 24 * 60 * 60;

// Bộ nhớ đệm In-Memory dự phòng (Graceful In-Memory Cache)
// Đảm bảo hệ thống hoạt động 100% ngay cả khi chưa thiết lập biến môi trường Upstash hoặc offline
class InMemoryFallbackRedis {
  private store = new Map<string, { value: any; expiresAt: number }>();

  async lpush(key: string, ...elements: string[]): Promise<number> {
    const existing = this.store.get(key)?.value || [];
    const list = Array.isArray(existing) ? existing : [];
    // Thêm vào đầu và lọc trùng lặp
    const filtered = elements.reverse().concat(list.filter((item: string) => !elements.includes(item)));
    this.store.set(key, {
      value: filtered.slice(0, 15),
      expiresAt: Date.now() + RECENTLY_VIEWED_TTL_SECONDS * 1000,
    });
    return filtered.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const item = this.store.get(key);
    if (!item) return [];
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return [];
    }
    const list = Array.isArray(item.value) ? item.value : [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<'OK'> {
    const ttl = opts?.ex || RECENTLY_VIEWED_TTL_SECONDS;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
    return 'OK';
  }
}

// Khởi tạo client Redis
let redisClient: any;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (upstashUrl && upstashToken) {
  try {
    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
    console.log('⚡ Connected to Upstash Redis Cloud');
  } catch (err) {
    console.warn('⚠️ Upstash Redis init error, using In-Memory Fallback Cache:', err);
    redisClient = new InMemoryFallbackRedis();
  }
} else {
  // Dự phòng an toàn 100%
  redisClient = new InMemoryFallbackRedis();
}

export const redis = redisClient;

/**
 * Ghi nhận sách vừa xem vào Redis với TTL 30 ngày
 * Khóa: recently_viewed:<identifier>
 */
export async function recordRecentlyViewed(identifier: string, bookId: string): Promise<void> {
  if (!identifier || !bookId) return;
  const key = `recently_viewed:${identifier}`;

  try {
    // 1. Thêm bookId vào đầu danh sách
    await redis.lpush(key, bookId);
    // 2. Set TTL 30 ngày (2,592,000s) theo chuẩn Proposal Mục 3.4
    await redis.expire(key, RECENTLY_VIEWED_TTL_SECONDS);
  } catch (error) {
    console.error('Error recording recently viewed to Redis:', error);
  }
}

/**
 * Lấy danh sách ID các cuốn sách vừa xem gần đây từ Redis
 */
export async function getRecentlyViewedBookIds(identifier: string, limit = 8): Promise<string[]> {
  if (!identifier) return [];
  const key = `recently_viewed:${identifier}`;

  try {
    const rawIds: any[] = await redis.lrange(key, 0, limit - 1);
    // Lọc trùng lặp giữ nguyên thứ tự
    const uniqueIds: string[] = Array.from(new Set(rawIds)).map((id: any) => String(id)).filter(Boolean);
    return uniqueIds;
  } catch (error) {
    console.error('Error reading recently viewed from Redis:', error);
    return [];
  }
}
