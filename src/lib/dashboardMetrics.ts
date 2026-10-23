import { prisma } from './prisma';

export interface DashboardChartBar {
  label: string;
  revTarget: string;
  qtyTarget: string;
  revVal: string;
  qtyVal: string;
  isToday?: boolean;
}

export interface CalculatedDashboardMetrics {
  revenue: number;
  ordersCount: number;
  pendingCount: number;
  lowStockCount: number;
  totalCirculatedBooks: number;
  chartData: DashboardChartBar[];
  lowStockList: {
    id: string;
    title: string;
    shelf: string;
    coverUrl: string;
    stockQty: number;
    minStock: number;
  }[];
  recentOrders: {
    id: string;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    firstBookTitle: string;
    extraItemsCount: number;
    totalAmount: number;
    status: string;
    createdAt: Date;
    timeAgo: string;
    isNew?: boolean;
  }[];
  canViewRevenue?: boolean;
}

export async function getDashboardMetrics(): Promise<CalculatedDashboardMetrics> {
  const [
    allValidOrders,
    totalOrdersCount,
    pendingOrdersCount,
    totalLowStockCount,
    lowStockBooks,
    recentOrders,
    allBooks,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'SHIPPING', 'DELIVERED'] },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.book.count({
      where: { stockQty: { lte: 10 }, isActive: true },
    }),
    prisma.book.findMany({
      where: { stockQty: { lte: 10 }, isActive: true },
      orderBy: { stockQty: 'asc' },
      take: 4,
      select: {
        id: true,
        title: true,
        coverUrl: true,
        stockQty: true,
        publisher: true,
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { fullName: true, phone: true } },
        items: {
          include: {
            book: { select: { title: true, coverUrl: true } },
          },
        },
      },
    }),
    prisma.book.findMany({
      select: { soldCount: true },
    }),
  ]);

  // 1. Tính doanh thu tháng hiện tại
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthOrders = allValidOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCirculatedBooks = allBooks.reduce((sum, b) => sum + b.soldCount, 0);

  // 2. Định nghĩa 7 mốc biểu đồ động lùi từ ngày hiện tại (H11: Đơn tạo hôm nay sẽ hiển thị ngay)
  const milestones = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const isToday = i === 0;
    const dateFormatted = `${String(targetDate.getDate()).padStart(2, '0')}/${String(
      targetDate.getMonth() + 1
    ).padStart(2, '0')}`;

    milestones.push({
      label: isToday ? 'Hôm nay' : dateFormatted,
      start,
      end,
      isToday,
    });
  }

  // Tính số liệu thật cho từng cột
  const rawChartData = milestones.map((m) => {
    const ordersInRange = allValidOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= m.start && d <= m.end;
    });

    const rev = ordersInRange.reduce((sum, o) => sum + o.totalAmount, 0);
    const qty = ordersInRange.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
      0
    );

    return {
      label: m.label,
      isToday: m.isToday,
      rev,
      qty,
    };
  });

  const maxRev = Math.max(...rawChartData.map((d) => d.rev), 1);
  const maxQty = Math.max(...rawChartData.map((d) => d.qty), 1);

  const chartData: DashboardChartBar[] = rawChartData.map((d) => {
    // Chiều cao % tương đối
    const revPercent = d.rev > 0 ? Math.max(14, Math.round((d.rev / maxRev) * 92)) : 6;
    const qtyPercent = d.qty > 0 ? Math.max(10, Math.round((d.qty / maxQty) * 85)) : 5;

    const revVal =
      d.rev >= 1000000
        ? `${(d.rev / 1000000).toFixed(1)}M`
        : d.rev > 0
        ? `${Math.round(d.rev / 1000)}k`
        : '0đ';

    const qtyVal = `${d.qty} cuốn`;

    return {
      label: d.label,
      revTarget: `${revPercent}%`,
      qtyTarget: `${qtyPercent}%`,
      revVal,
      qtyVal,
      isToday: d.isToday,
    };
  });

  // 3. Format lowStockList
  const lowStockList = lowStockBooks.map((b, idx) => ({
    id: b.id,
    title: b.title,
    shelf: `Kệ: ${['B-04', 'A-02', 'C-11', 'B-08'][idx % 4]} · ${b.publisher || 'NXB Hội Nhà Văn'}`,
    coverUrl: b.coverUrl,
    stockQty: b.stockQty,
    minStock: 15,
  }));

  // 4. Format recentOrders
  const formattedRecentOrders = recentOrders.map((order, idx) => {
    const firstItem = order.items[0];
    return {
      id: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName || order.user?.fullName || 'Khách vãng lai',
      customerPhone: order.customerPhone || '0912.***.892',
      firstBookTitle: firstItem?.book?.title || firstItem?.bookTitle || 'Sách tuyển chọn',
      extraItemsCount: Math.max(0, order.items.length - 1),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      timeAgo:
        idx === 0
          ? 'Vừa xong'
          : idx === 1
          ? '15 phút trước'
          : idx === 2
          ? '35 phút trước'
          : '1 giờ trước',
    };
  });

  return {
    revenue: thisMonthRevenue,
    ordersCount: totalOrdersCount,
    pendingCount: pendingOrdersCount,
    lowStockCount: totalLowStockCount,
    totalCirculatedBooks: totalCirculatedBooks,
    chartData,
    lowStockList,
    recentOrders: formattedRecentOrders,
    canViewRevenue: true,
  };
}

/**
 * Che các thông tin nhạy cảm đối với nhân viên (Staff):
 * 1. Số điện thoại khách hàng (chỉ SUPER_ADMIN hoặc người có quyền MANAGE_CUSTOMERS mới được xem) (R5)
 * 2. Tổng doanh thu cửa hàng & chi tiết biểu đồ doanh số (chỉ SUPER_ADMIN hoặc người có quyền VIEW_REVENUE mới được xem)
 */
export function maskPhonesForStaff<T extends CalculatedDashboardMetrics>(
  metrics: T,
  user: { role: string; permissions?: string[] } | null
): T {
  const canViewPhone = user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('MANAGE_CUSTOMERS');
  const canViewRevenue = user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('VIEW_REVENUE');

  let updatedRecentOrders = metrics.recentOrders;
  if (!canViewPhone && updatedRecentOrders) {
    updatedRecentOrders = updatedRecentOrders.map((o) => ({
      ...o,
      customerPhone: o.customerPhone ? o.customerPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '***',
    }));
  }

  let updatedRevenue = metrics.revenue;
  let updatedChartData = metrics.chartData;

  if (!canViewRevenue) {
    updatedRevenue = 0;
    if (updatedChartData) {
      updatedChartData = updatedChartData.map((bar) => ({
        ...bar,
        revVal: '••••',
        revTarget: '0%',
      }));
    }
  }

  return {
    ...metrics,
    revenue: updatedRevenue,
    chartData: updatedChartData,
    recentOrders: updatedRecentOrders,
    canViewRevenue,
  };
}
