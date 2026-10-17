/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam Đồng (VND)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng ngày theo chuẩn Việt Nam (DD/MM/YYYY) cố định múi giờ GMT+7 (Asia/Ho_Chi_Minh)
 * Triệt tiêu lỗi Hydration Mismatch giữa SSR (thường là UTC) và Client (Lỗi M13)
 */
export function formatDateVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (HH:mm:ss DD/MM/YYYY) cố định múi giờ GMT+7 (Asia/Ho_Chi_Minh)
 */
export function formatDateTimeVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(d);
}

/**
 * Tính phần trăm giảm giá giữa giá bìa và giá bán
 */
export function calculateDiscount(originalPrice: number, price: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu (lower-cased) phục vụ tìm kiếm thông minh
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

