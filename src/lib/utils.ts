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

/**
 * Chuẩn hóa số điện thoại di động Việt Nam (loại bỏ ký tự đặc biệt, chuyển +84/84 thành 0)
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim().replace(/^\+/, '').replace(/[\s.\-()]/g, '');
  clean = clean.replace(/^84/, '0');
  return clean;
}

/**
 * Parse chuỗi ngày tháng sang đối tượng Date cố định theo múi giờ GMT+7 (Asia/Ho_Chi_Minh)
 */
export function parseVnDate(raw: string): Date {
  if (!raw) return new Date(NaN);
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(raw);
  return new Date(hasTimezone ? raw : `${raw}+07:00`);
}

