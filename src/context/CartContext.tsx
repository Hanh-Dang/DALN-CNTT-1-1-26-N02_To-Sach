'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export interface CartItem {
  bookId: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number;
  coverUrl: string;
  authorName?: string;
  quantity: number;
  stockQty: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage keys
const GUEST_STORAGE_KEY = 'tosach_guest_cart';
const USER_STORAGE_PREFIX = 'tosach_user_cart_';
const LEGACY_STORAGE_KEY = 'tosach_cart_v1';

/**
 * Hàm Hợp Nhất Giỏ Hàng Thông Minh (Smart Cart Merge - Chuẩn TMĐT):
 * Gộp các sản phẩm từ giỏ khách vãng lai vào giỏ đã lưu của tài khoản.
 * - Nếu trùng sách: cộng dồn số lượng (giới hạn tối đa theo stockQty).
 * - Nếu là sách mới: thêm mới vào danh sách.
 */
function mergeCartItems(baseItems: CartItem[], incomingItems: CartItem[]): CartItem[] {
  const merged = [...baseItems];
  for (const incoming of incomingItems) {
    const existingIndex = merged.findIndex((item) => item.bookId === incoming.bookId);

    if (existingIndex > -1) {
      const existing = merged[existingIndex];
      const newQty = Math.min(existing.quantity + incoming.quantity, existing.stockQty);
      merged[existingIndex] = { ...existing, quantity: newQty };
    } else {
      merged.push({ ...incoming });
    }
  }
  return merged;
}

function getStoredCart(key: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(key: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Lỗi khi lưu giỏ hàng:', error);
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dùng ref để theo dõi trạng thái User trước đó, nhận diện chính xác các sự kiện Login / Register / Logout
  const activeUserIdRef = useRef<string | null>(null);

  /**
   * Đồng bộ giỏ hàng với trạng thái Xác thực của Người dùng (Authentication State Sync)
   */
  const syncWithAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = res.ok ? await res.json() : null;
      const newUserId: string | null = data?.user?.id || null;
      const prevUserId = activeUserIdRef.current;

      // Di chuyển key cũ nếu có từ phiên bản trước
      if (typeof window !== 'undefined') {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy && !localStorage.getItem(GUEST_STORAGE_KEY)) {
          localStorage.setItem(GUEST_STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }

      if (newUserId) {
        // NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP / ĐĂNG KÝ
        const userStorageKey = USER_STORAGE_PREFIX + newUserId;
        const savedUserCart = getStoredCart(userStorageKey);
        const guestCart = getStoredCart(GUEST_STORAGE_KEY);

        if (prevUserId === null && guestCart.length > 0) {
          // KỊCH BẢN CHUYỂN TIẾP: Khách vãng lai vừa nhặt sách -> Đăng nhập / Đăng ký
          // Áp dụng Cách B (Smart Merge): Gộp sách khách vừa nhặt vào giỏ hàng tài khoản
          const merged = mergeCartItems(savedUserCart, guestCart);
          saveCart(userStorageKey, merged);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          setItems(merged);
        } else if (prevUserId !== newUserId) {
          // Chuyển đổi tài khoản khác hoặc phiên đăng nhập mới: Nạp đúng giỏ hàng của user này
          setItems(savedUserCart);
        }
      } else {
        // KHÁCH VÃNG LAI (HOẶC VỪA BẤM ĐĂNG XUẤT)
        if (prevUserId !== null) {
          // Vừa bấm Đăng xuất: Xóa sạch giỏ hàng hiển thị để bảo vệ riêng tư cho người dùng tiếp theo
          localStorage.removeItem(GUEST_STORAGE_KEY);
          setItems([]);
        } else {
          // Khách vãng lai thông thường: Nạp giỏ hàng tạm
          const guestCart = getStoredCart(GUEST_STORAGE_KEY);
          setItems(guestCart);
        }
      }

      setCurrentUserId(newUserId);
      activeUserIdRef.current = newUserId;
    } catch {
      // Fallback khi lỗi mạng: nạp giỏ hàng guest
      const guestCart = getStoredCart(GUEST_STORAGE_KEY);
      setItems(guestCart);
      setCurrentUserId(null);
      activeUserIdRef.current = null;
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Khởi tạo ban đầu & Lắng nghe sự kiện đăng nhập / đăng xuất
  useEffect(() => {
    syncWithAuth();

    window.addEventListener('auth-change', syncWithAuth);
    return () => {
      window.removeEventListener('auth-change', syncWithAuth);
    };
  }, [syncWithAuth]);

  // Tự động lưu giỏ hàng tương ứng với vai trò hiện tại (User Cart hoặc Guest Cart)
  useEffect(() => {
    if (!isLoaded) return;
    if (currentUserId) {
      saveCart(USER_STORAGE_PREFIX + currentUserId, items);
    } else {
      saveCart(GUEST_STORAGE_KEY, items);
    }
  }, [items, currentUserId, isLoaded]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.bookId === newItem.bookId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = Math.min(existing.quantity + qty, existing.stockQty);
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      } else {
        const initialQty = Math.min(qty, newItem.stockQty > 0 ? newItem.stockQty : 1);
        return [...prevItems, { ...newItem, quantity: initialQty }];
      }
    });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.bookId === bookId) {
          const validQty = Math.min(quantity, item.stockQty);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (bookId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.bookId !== bookId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
