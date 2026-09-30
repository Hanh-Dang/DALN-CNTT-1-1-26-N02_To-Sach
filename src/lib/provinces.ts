/**
 * Danh sách 63 Tỉnh / Thành phố Việt Nam chuẩn hóa
 * Dùng cho sổ địa chỉ giao hàng và tính toán thời gian vận chuyển logistics
 */

export interface Province {
  id: string;
  name: string;
  isExpressCity?: boolean; // Hà Nội & TP.HCM: 1-2 ngày, Các tỉnh khác: 3-5 ngày
}

export const VIETNAM_PROVINCES: Province[] = [
  // 2 Đầu tàu kinh tế (Nội thành kho vận - Giao nhanh 1-2 ngày)
  { id: 'HN', name: 'Hà Nội', isExpressCity: true },
  { id: 'SG', name: 'TP. Hồ Chí Minh', isExpressCity: true },

  // Miền Bắc
  { id: 'HP', name: 'Hải Phòng' },
  { id: 'QN', name: 'Quảng Ninh' },
  { id: 'BN', name: 'Bắc Ninh' },
  { id: 'BG', name: 'Bắc Giang' },
  { id: 'HD', name: 'Hải Dương' },
  { id: 'HY', name: 'Hưng Yên' },
  { id: 'ND', name: 'Nam Định' },
  { id: 'TB', name: 'Thái Bình' },
  { id: 'NB', name: 'Ninh Bình' },
  { id: 'HNAM', name: 'Hà Nam' },
  { id: 'VP', name: 'Vĩnh Phúc' },
  { id: 'PT', name: 'Phú Thọ' },
  { id: 'TN', name: 'Thái Nguyên' },
  { id: 'LC', name: 'Lào Cai' },
  { id: 'YB', name: 'Yên Bái' },
  { id: 'TQ', name: 'Tuyên Quang' },
  { id: 'HG', name: 'Hà Giang' },
  { id: 'CB', name: 'Cao Bằng' },
  { id: 'BK', name: 'Bắc Kạn' },
  { id: 'LS', name: 'Lạng Sơn' },
  { id: 'LSN', name: 'Sơn La' },
  { id: 'HB', name: 'Hòa Bình' },
  { id: 'DB', name: 'Điện Biên' },
  { id: 'LCU', name: 'Lai Châu' },

  // Miền Trung & Tây Nguyên
  { id: 'DN', name: 'Đà Nẵng' },
  { id: 'TH', name: 'Thanh Hóa' },
  { id: 'NA', name: 'Nghệ An' },
  { id: 'HT', name: 'Hà Tĩnh' },
  { id: 'QB', name: 'Quảng Bình' },
  { id: 'QT', name: 'Quảng Trị' },
  { id: 'TTH', name: 'Thừa Thiên Huế' },
  { id: 'QNM', name: 'Quảng Nam' },
  { id: 'QNG', name: 'Quảng Ngãi' },
  { id: 'BDH', name: 'Bình Định' },
  { id: 'PY', name: 'Phú Yên' },
  { id: 'KH', name: 'Khánh Hòa' },
  { id: 'NT', name: 'Ninh Thuận' },
  { id: 'BT', name: 'Bình Thuận' },
  { id: 'KT', name: 'Kon Tum' },
  { id: 'GL', name: 'Gia Lai' },
  { id: 'DL', name: 'Đắk Lắk' },
  { id: 'DKN', name: 'Đắk Nông' },
  { id: 'LD', name: 'Lâm Đồng' },

  // Miền Nam
  { id: 'BD', name: 'Bình Dương' },
  { id: 'DNai', name: 'Đồng Nai' },
  { id: 'VT', name: 'Bà Rịa - Vũng Tàu' },
  { id: 'TNinh', name: 'Tây Ninh' },
  { id: 'BP', name: 'Bình Phước' },
  { id: 'LA', name: 'Long An' },
  { id: 'TG', name: 'Tiền Giang' },
  { id: 'BTre', name: 'Bến Tre' },
  { id: 'TV', name: 'Trà Vinh' },
  { id: 'VL', name: 'Vĩnh Long' },
  { id: 'DT', name: 'Đồng Tháp' },
  { id: 'AG', name: 'An Giang' },
  { id: 'KG', name: 'Kiên Giang' },
  { id: 'CT', name: 'Cần Thơ' },
  { id: 'HGiang', name: 'Hậu Giang' },
  { id: 'ST', name: 'Sóc Trăng' },
  { id: 'BL', name: 'Bạc Liêu' },
  { id: 'CM', name: 'Cà Mau' },
];

/**
 * Kiểm tra xem một Tỉnh/Thành phố có thuộc tuyến giao hàng nội thành siêu tốc (1-2 ngày) không
 */
export function isExpressCity(provinceName: string): boolean {
  if (!provinceName) return false;
  const normalized = provinceName.toLowerCase();
  return (
    normalized.includes('hà nội') ||
    normalized.includes('hồ chí minh') ||
    normalized.includes('hcm') ||
    normalized.includes('sài gòn')
  );
}

/**
 * Trả về chuỗi thời gian giao hàng dự kiến dựa trên Tỉnh/Thành phố
 */
export function getEstimatedDeliveryText(provinceName: string): {
  timeframe: string;
  badge: string;
  description: string;
  isExpress: boolean;
} {
  const isExpress = isExpressCity(provinceName);
  if (isExpress) {
    return {
      timeframe: '1 — 2 ngày làm việc',
      badge: '⚡ Giao nhanh 1 — 2 ngày',
      description: 'Giao từ kho vận trung tâm nội thành Tổ Sách.',
      isExpress: true,
    };
  }

  return {
    timeframe: '3 — 5 ngày làm việc',
    badge: '🚚 Giao tiêu chuẩn 3 — 5 ngày',
    description: 'Vận chuyển liên tỉnh tiêu chuẩn đến tận tay độc giả.',
    isExpress: false,
  };
}
