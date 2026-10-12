/**
 * Centralized Route Definitions (Single Source of Truth)
 * Giúp chuẩn hóa toàn bộ liên kết nội bộ trong hệ thống, loại bỏ triệt để lỗi gõ nhầm URL
 */
export const ROUTES = {
  home: '/',
  catalog: (category?: string) => (category ? `/catalog?category=${encodeURIComponent(category)}` : '/catalog'),
  book: (slug: string) => `/book/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  orderSuccess: (code: string) => `/order/success?code=${encodeURIComponent(code)}`,
  accountOrders: '/account/orders',
  accountProfile: '/account/profile',
  wishlist: '/wishlist',
  admin: '/admin',
  adminBooks: '/admin/books',
  adminOrders: '/admin/orders',
};
