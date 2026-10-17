'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { fetchAuthMeShared, fetchUserSyncShared } from '@/lib/clientAuthDedupe';

export interface WishlistItem {
  bookId: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number;
  coverUrl: string;
  authorName?: string;
  categoryName?: string;
  publisher?: string;
  stockQty?: number;
  avgRating?: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  totalWishlist: number;
  isWishlisted: (bookId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => boolean; // returns true if added, false if removed
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (bookId: string) => void;
  clearWishlist: () => void;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'tosach_guest_wishlist';
const USER_WISHLIST_PREFIX = 'tosach_user_wishlist_';

function getStoredWishlist(key: string): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlist(key: string, items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Lỗi khi lưu danh sách yêu thích:', error);
  }
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const activeUserIdRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncWishlistToServer = useCallback((wishlistItems: WishlistItem[]) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wishlist: wishlistItems }),
        });
      } catch (err) {
        console.error('Lỗi sync wishlist lên server:', err);
      }
    }, 600);
  }, []);

  const syncWithAuth = useCallback(async () => {
    try {
      const user = await fetchAuthMeShared();
      const newUserId: string | null = user?.id || null;
      const prevUserId = activeUserIdRef.current;

      // 1. Khách vãng lai
      if (!newUserId) {
        const guestItems = getStoredWishlist(GUEST_WISHLIST_KEY);
        setItems(guestItems);
        setCurrentUserId(null);
        activeUserIdRef.current = null;
        setIsLoaded(true);
        return;
      }

      // 2. Vừa đăng nhập từ khách vãng lai hoặc nạp phiên người dùng
      const userKey = `${USER_WISHLIST_PREFIX}${newUserId}`;
      const userSavedItems = getStoredWishlist(userKey);
      const guestItems = getStoredWishlist(GUEST_WISHLIST_KEY);

      // Kéo từ server Database
      let serverWishlist: WishlistItem[] = [];
      try {
        const syncData = await fetchUserSyncShared();
        if (syncData && Array.isArray(syncData?.data?.wishlist)) {
          serverWishlist = syncData.data.wishlist;
        }
      } catch (e) {
        console.warn('Không thể kéo wishlist từ server:', e);
      }

      const baseAccountWishlist = serverWishlist.length > 0 ? serverWishlist : userSavedItems;

      if (prevUserId === null && guestItems.length > 0) {
        // Hợp nhất không trùng lặp giữa sách vãng lai và sách trong tài khoản
        const existingIds = new Set(baseAccountWishlist.map((i) => i.bookId));
        const combined = [...baseAccountWishlist];
        for (const g of guestItems) {
          if (!existingIds.has(g.bookId)) {
            combined.push(g);
            existingIds.add(g.bookId);
          }
        }
        saveWishlist(userKey, combined);
        setItems(combined);
        localStorage.removeItem(GUEST_WISHLIST_KEY);
        syncWishlistToServer(combined);
      } else {
        setItems(baseAccountWishlist);
        saveWishlist(userKey, baseAccountWishlist);
        if (serverWishlist.length === 0 && userSavedItems.length > 0) {
          syncWishlistToServer(userSavedItems);
        }
      }

      setCurrentUserId(newUserId);
      activeUserIdRef.current = newUserId;
      setIsLoaded(true);
    } catch {
      const guestItems = getStoredWishlist(GUEST_WISHLIST_KEY);
      setItems(guestItems);
      setIsLoaded(true);
    }
  }, [syncWishlistToServer]);

  useEffect(() => {
    syncWithAuth();

    const handleAuthChange = () => {
      syncWithAuth();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [syncWithAuth]);

  // Lưu tự động khi items thay đổi sau khi đã nạp ban đầu
  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = currentUserId ? `${USER_WISHLIST_PREFIX}${currentUserId}` : GUEST_WISHLIST_KEY;
    saveWishlist(storageKey, items);
    if (currentUserId) {
      syncWishlistToServer(items);
    }
  }, [items, isLoaded, currentUserId, syncWishlistToServer]);

  const isWishlisted = useCallback((bookId: string): boolean => {
    return items.some((i) => i.bookId === bookId);
  }, [items]);

  const toggleWishlist = useCallback((item: WishlistItem): boolean => {
    let added = false;
    setItems((prev) => {
      const exists = prev.some((i) => i.bookId === item.bookId);
      if (exists) {
        added = false;
        return prev.filter((i) => i.bookId !== item.bookId);
      } else {
        added = true;
        return [item, ...prev];
      }
    });
    return added;
  }, []);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.bookId === item.bookId)) return prev;
      return [item, ...prev];
    });
  }, []);

  const removeFromWishlist = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const totalWishlist = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        totalWishlist,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isLoaded,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
