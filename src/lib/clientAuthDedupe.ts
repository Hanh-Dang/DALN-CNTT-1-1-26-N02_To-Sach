/**
 * Module chống gọi API trùng lặp (Request Deduplication & In-Flight Sharing) phía Client (Lỗi L3)
 * Giúp triệt tiêu hiện tượng Header, CartContext và WishlistContext cùng gọi /api/auth/me và /api/user/sync
 * khi người dùng nạp hoặc tải lại trang web.
 */

let authMePromise: Promise<any> | null = null;
let authMeCachedData: any = null;
let authMeCacheTime = 0;

let userSyncPromise: Promise<any> | null = null;
let userSyncCachedData: any = null;
let userSyncCacheTime = 0;

const CACHE_TTL_MS = 2500; // Cache ngắn 2.5s chia sẻ giữa các component cùng mount

/**
 * Lấy thông tin user hiện tại (Deduplicated)
 */
export async function fetchAuthMeShared(): Promise<any> {
  const now = Date.now();
  if (authMeCachedData && now - authMeCacheTime < CACHE_TTL_MS) {
    return authMeCachedData;
  }

  if (authMePromise) {
    return authMePromise;
  }

  authMePromise = (async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        authMeCachedData = null;
        return null;
      }
      const data = await res.json();
      authMeCachedData = data.user || null;
      authMeCacheTime = Date.now();
      return authMeCachedData;
    } catch (err) {
      console.warn('fetchAuthMeShared failed:', err);
      authMeCachedData = null;
      return null;
    } finally {
      authMePromise = null;
    }
  })();

  return authMePromise;
}

/**
 * Đồng bộ giỏ hàng và danh sách yêu thích giữa LocalStorage và CSDL (Deduplicated)
 */
export async function fetchUserSyncShared(): Promise<any> {
  const now = Date.now();
  if (userSyncCachedData && now - userSyncCacheTime < CACHE_TTL_MS) {
    return userSyncCachedData;
  }

  if (userSyncPromise) {
    return userSyncPromise;
  }

  userSyncPromise = (async () => {
    try {
      const res = await fetch('/api/user/sync');
      if (!res.ok) {
        userSyncCachedData = null;
        return null;
      }
      const data = await res.json();
      userSyncCachedData = data;
      userSyncCacheTime = Date.now();
      return data;
    } catch (err) {
      console.warn('fetchUserSyncShared failed:', err);
      userSyncCachedData = null;
      return null;
    } finally {
      userSyncPromise = null;
    }
  })();

  return userSyncPromise;
}

/**
 * Xóa cache khi đăng nhập / đăng xuất để lần gọi sau fetch mới
 */
export function clearAuthCache(): void {
  authMeCachedData = null;
  authMeCacheTime = 0;
  userSyncCachedData = null;
  userSyncCacheTime = 0;
}
