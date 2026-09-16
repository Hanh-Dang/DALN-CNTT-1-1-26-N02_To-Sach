'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

const CART_STORAGE_KEY = 'tosach_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Khôi phục giỏ hàng từ localStorage khi component mount phía client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Không thể đọc giỏ hàng từ localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Lưu giỏ hàng vào localStorage khi có thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Không thể lưu giỏ hàng vào localStorage:', error);
    }
  }, [items, isLoaded]);

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
