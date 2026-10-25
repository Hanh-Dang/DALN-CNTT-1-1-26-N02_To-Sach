import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Danh sách khách hàng mẫu trải rộng khắp các tỉnh thành Việt Nam
const sampleCustomers = [
  { name: 'Nguyễn Văn An', phone: '0903124567', email: 'an.nguyen@gmail.com', address: 'Số 12 ngõ 45 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội' },
  { name: 'Trần Thị Mai', phone: '0912345678', email: 'mai.tran@gmail.com', address: '48 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'Lê Hoàng Long', phone: '0987654321', email: 'long.le@gmail.com', address: '124 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng' },
  { name: 'Phạm Thu Hương', phone: '0934567890', email: 'huong.pham@gmail.com', address: '78 Nguyễn Trãi, Phường 3, Quận 5, TP. Hồ Chí Minh' },
  { name: 'Vũ Minh Tuấn', phone: '0978123456', email: 'tuan.vu@gmail.com', address: '15 Hoàng Hoa Thám, Phường Thụy Khuê, Quận Tây Hồ, Hà Nội' },
  { name: 'Đỗ Thảo Vy', phone: '0918765432', email: 'vy.do@gmail.com', address: '36 Mậu Thân, Phường An Hòa, Quận Ninh Kiều, Cần Thơ' },
  { name: 'Hoàng Quốc Bảo', phone: '0909876543', email: 'bao.hoang@gmail.com', address: '92 Lạch Tray, Phường Lạch Tray, Quận Ngô Quyền, Hải Phòng' },
  { name: 'Bùi Ánh Tuyết', phone: '0981239876', email: 'tuyet.bui@gmail.com', address: '25 Lê Lợi, Phường Phú Nhuận, Thành phố Huế, Thừa Thiên Huế' },
  { name: 'Đặng Hữu Nghĩa', phone: '0938112233', email: 'nghia.dang@gmail.com', address: '102 Phan Chu Trinh, Phường Quang Trung, Thành phố Vinh, Nghệ An' },
  { name: 'Phan Diệu Linh', phone: '0966554433', email: 'linh.phan@gmail.com', address: '55 Trần Hưng Đạo, Phường Lộc Thọ, Thành phố Nha Trang, Khánh Hòa' },
  { name: 'Ngô Thanh Hà', phone: '0935221144', email: 'ha.ngo@gmail.com', address: '88 Hai Bà Trưng, Phường 6, Quận 3, TP. Hồ Chí Minh' },
  { name: 'Lý Quang Minh', phone: '0944332211', email: 'minh.ly@gmail.com', address: '5 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'Trịnh Khánh Vy', phone: '0977889900', email: 'vy.trinh@gmail.com', address: '18 Bạch Đằng, Phường 24, Quận Bình Thạnh, TP. Hồ Chí Minh' },
  { name: 'Dương Đình Trọng', phone: '0911223344', email: 'trong.duong@gmail.com', address: '209 Đội Cấn, Phường Liễu Giai, Quận Ba Đình, Hà Nội' },
  { name: 'Khách Hàng Mẫu', phone: '0903888999', email: 'customer@gmail.com', address: 'Số 1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội' },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedHistoricalOrders() {
  console.log('🚀 Bắt đầu khởi tạo dữ liệu giả lập cho Tổ Sách (Tháng 6/2026 -> 22/10/2026)...');

  // 1. Lấy danh sách ~80 sách đang kích hoạt
  const sampleBooks = await prisma.book.findMany({
    where: { isActive: true },
    take: 80,
    select: {
      id: true,
      title: true,
      price: true,
      coverUrl: true,
      stockQty: true,
    },
  });

  if (sampleBooks.length === 0) {
    console.error('❌ Không tìm thấy sách trong database. Vui lòng seed sách trước!');
    return;
  }

  // 2. Dọn dẹp đơn lịch sử cũ: xóa cả đơn -H lẫn 150 đơn mẫu 4 chữ số cũ (P3)
  const deletedOld = await prisma.order.deleteMany({
    where: {
      OR: [
        { orderCode: { contains: '-H' } },
        // Dọn cả 150 đơn mẫu cũ (TS-2026xxxx-1000..1149) chưa có hậu tố -H
        { orderCode: { startsWith: 'TS-2026' }, NOT: { orderCode: { contains: '-H' } } },
      ],
    },
  });
  if (deletedOld.count > 0) {
    console.log(`🧹 Đã dọn dẹp ${deletedOld.count} đơn hàng lịch sử cũ để tái tạo mới.`);
  }

  // Chuẩn hóa đơn TS-2024-00101 (P3)
  await prisma.order.updateMany({
    where: { orderCode: 'TS-2024-00101' },
    data: {
      customerPhone: '0912345678',
      shippingFee: 25000,
      totalAmount: 279000,
    },
  });

  // Lấy User liên kết
  const customerUser = await prisma.user.findUnique({ where: { email: 'customer@gmail.com' } });
  const staffKho = await prisma.user.findUnique({ where: { email: 'staff.kho@tosach.vn' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const actorId = staffKho?.id || adminUser?.id;

  // 3. Phân bổ các giai đoạn đơn hàng (tính lùi động từ ngày hiện tại để biểu đồ luôn tươi mới)
  const now = new Date();
  const periods = [
    {
      name: `Tháng ${new Date(now.getFullYear(), now.getMonth() - 4, 1).getMonth() + 1}/${new Date(now.getFullYear(), now.getMonth() - 4, 1).getFullYear()}`,
      start: new Date(now.getFullYear(), now.getMonth() - 4, 1, 8, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() - 3, 0, 21, 0, 0),
      count: 14,
    },
    {
      name: `Tháng ${new Date(now.getFullYear(), now.getMonth() - 3, 1).getMonth() + 1}/${new Date(now.getFullYear(), now.getMonth() - 3, 1).getFullYear()}`,
      start: new Date(now.getFullYear(), now.getMonth() - 3, 1, 8, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() - 2, 0, 21, 0, 0),
      count: 22,
    },
    {
      name: `Tháng ${new Date(now.getFullYear(), now.getMonth() - 2, 1).getMonth() + 1}/${new Date(now.getFullYear(), now.getMonth() - 2, 1).getFullYear()}`,
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1, 8, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() - 1, 0, 21, 0, 0),
      count: 32,
    },
    {
      name: `Tháng ${new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1}/${new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear()}`,
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 8, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 21, 0, 0),
      count: 48,
    },
    {
      name: `Tháng này (${now.getMonth() + 1}/${now.getFullYear()})`,
      start: new Date(now.getFullYear(), now.getMonth(), 1, 8, 0, 0),
      end: new Date(now.getTime() - 2 * 3600 * 1000),
      count: 28,
    },
    {
      name: 'Hôm nay',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      end: now,
      count: 6,
    },
  ];

  let orderSeq = 1000;
  let totalCreated = 0;
  let totalRev = 0;
  const soldIncrements = new Map<string, number>();

  for (const p of periods) {
    console.log(`📦 Đang tạo ${p.count} đơn hàng cho ${p.name}...`);

    for (let i = 0; i < p.count; i++) {
      orderSeq++;
      const orderDate = getRandomDate(p.start, p.end);
      const customer = getRandomItem(sampleCustomers);

      // Mã đơn theo giờ Việt Nam GMT+7 và gắn hậu tố -H định danh đơn lịch sử
      const yyyymmdd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
        .format(orderDate)
        .replace(/-/g, '');
      const orderCode = `TS-${yyyymmdd}-H${orderSeq}`;

      // Chọn ngẫu nhiên 1 - 3 cuốn sách
      const numBooks = getRandomInt(1, 3);
      const chosenBooks: typeof sampleBooks = [];
      while (chosenBooks.length < numBooks) {
        const b = getRandomItem(sampleBooks);
        if (!chosenBooks.some((item) => item.id === b.id)) {
          chosenBooks.push(b);
        }
      }

      let subtotal = 0;
      const itemsData = chosenBooks.map((b) => {
        const qty = getRandomInt(1, 2);
        const itemTotal = b.price * qty;
        subtotal += itemTotal;
        return {
          bookId: b.id,
          bookTitle: b.title,
          coverUrl: b.coverUrl,
          unitPrice: b.price,
          quantity: qty,
          totalPrice: itemTotal,
        };
      });

      // Chính sách phí ship chuẩn app: Freeship từ 150.000đ, dưới 150k phí 25.000đ
      const shippingFee = subtotal >= 150000 ? 0 : 25000;
      const discountAmount = 0;
      const totalAmount = subtotal - discountAmount + shippingFee;

      let status: OrderStatus = OrderStatus.DELIVERED;
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      const paymentMethod = Math.random() > 0.35 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.COD;

      if (p.name.includes('Hôm nay')) {
        // Hôm nay: đa dạng trạng thái để demo quy trình xử lý đơn
        if (i === 0 || i === 1) {
          status = OrderStatus.PENDING;
        } else if (i === 2) {
          status = OrderStatus.CONFIRMED;
        } else if (i === 3 || i === 4) {
          status = OrderStatus.SHIPPING;
        } else {
          status = OrderStatus.DELIVERED;
        }
      } else if (p.name.includes('Tháng này')) {
        const rand = Math.random();
        if (rand < 0.1) {
          status = OrderStatus.PENDING;
        } else if (rand < 0.2) {
          status = OrderStatus.CONFIRMED;
        } else if (rand < 0.35) {
          status = OrderStatus.SHIPPING;
        } else if (rand < 0.9) {
          status = OrderStatus.DELIVERED;
        } else {
          status = OrderStatus.CANCELLED;
        }
      } else {
        // Các tháng cũ: hầu hết đã giao thành công, 4% huỷ
        if (Math.random() < 0.04) {
          status = OrderStatus.CANCELLED;
        } else {
          status = OrderStatus.DELIVERED;
        }
      }

      // Xác định trạng thái thanh toán chuẩn xác theo nghiệp vụ
      if (status === OrderStatus.CANCELLED) {
        paymentStatus = PaymentStatus.REFUNDED;
      } else if (paymentMethod === PaymentMethod.COD) {
        // Với COD: Chỉ chuyển PAID khi đơn đã DELIVERED thực tế
        paymentStatus = status === OrderStatus.DELIVERED ? PaymentStatus.PAID : PaymentStatus.PENDING;
      } else {
        // Với Chuyển khoản ngân hàng (VietQR): Đã thanh toán khi duyệt
        paymentStatus = PaymentStatus.PAID;
      }

      // Timeline tương thích giao diện Admin lẫn Khách hàng
      const timeline = [
        {
          status: 'PENDING',
          title: 'Đặt hàng thành công',
          description: 'Khách hàng hoàn tất đặt đơn hàng trên Tổ Sách.',
          timestamp: orderDate.toISOString(),
          time: orderDate.toISOString(),
          desc: 'Khách hàng hoàn tất đặt đơn hàng trên Tổ Sách.',
        },
      ];

      if (status !== OrderStatus.PENDING) {
        const confirmDate = new Date(orderDate.getTime() + getRandomInt(10, 30) * 60 * 1000);
        timeline.push({
          status: status === OrderStatus.CANCELLED ? 'CANCELLED' : 'CONFIRMED',
          title: status === OrderStatus.CANCELLED ? 'Đơn hàng đã bị hủy' : 'Đã xác nhận đơn hàng',
          description: status === OrderStatus.CANCELLED
            ? 'Đơn hàng đã được hủy theo yêu cầu của khách hàng.'
            : 'Nhân viên Tổ Sách đã xác nhận và bàn giao bộ phận đóng gói.',
          timestamp: confirmDate.toISOString(),
          time: confirmDate.toISOString(),
          desc: status === OrderStatus.CANCELLED
            ? 'Đơn hàng đã được hủy theo yêu cầu của khách hàng.'
            : 'Nhân viên Tổ Sách đã xác nhận và bàn giao bộ phận đóng gói.',
        });
      }

      if (status === OrderStatus.SHIPPING || status === OrderStatus.DELIVERED) {
        const shipDate = new Date(orderDate.getTime() + getRandomInt(2, 6) * 3600 * 1000);
        timeline.push({
          status: 'SHIPPING',
          title: 'Đang giao hàng',
          description: 'Bưu tá Viettel Post đang trên đường giao bưu phẩm đến khách.',
          timestamp: shipDate.toISOString(),
          time: shipDate.toISOString(),
          desc: 'Bưu tá Viettel Post đang trên đường giao bưu phẩm đến khách.',
        });
      }

      if (status === OrderStatus.DELIVERED) {
        const delDate = new Date(orderDate.getTime() + getRandomInt(24, 48) * 3600 * 1000);
        timeline.push({
          status: 'DELIVERED',
          title: 'Giao hàng thành công',
          description: 'Khách hàng đã nhận sách nguyên vẹn và hoàn tất ký nhận.',
          timestamp: delDate.toISOString(),
          time: delDate.toISOString(),
          desc: 'Khách hàng đã nhận sách nguyên vẹn và hoàn tất ký nhận.',
        });
      }

      await prisma.order.create({
        data: {
          orderCode,
          userId: customer.email === 'customer@gmail.com' && customerUser ? customerUser.id : null,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          shippingAddress: customer.address,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          paymentMethod,
          paymentStatus,
          status,
          trackingCode: status === OrderStatus.SHIPPING || status === OrderStatus.DELIVERED
            ? `VTP${getRandomInt(10000000, 99999999)}`
            : null,
          note: Math.random() > 0.7 ? 'Gọi trước khi giao 15 phút, giao giờ hành chính' : null,
          timeline,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: itemsData,
          },
        },
      });

      if (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPING || status === OrderStatus.CONFIRMED) {
        for (const item of itemsData) {
          const current = soldIncrements.get(item.bookId) || 0;
          soldIncrements.set(item.bookId, current + item.quantity);
        }
        totalRev += totalAmount;
      }

      totalCreated++;
    }
  }

  // Cập nhật soldCount một lượt chuẩn xác từ toàn bộ các OrderItem trong DB (S1-b: Idempotent)
  console.log('📈 Đang đồng bộ lại số lượng đã bán (soldCount) cho toàn bộ sách...');
  const allSoldAgg = await prisma.orderItem.groupBy({
    by: ['bookId'],
    _sum: { quantity: true },
  });
  for (const agg of allSoldAgg) {
    if (agg.bookId && agg._sum.quantity !== null) {
      await prisma.book.update({
        where: { id: agg.bookId },
        data: { soldCount: agg._sum.quantity },
      });
    }
  }

  console.log(`✅ Hoàn tất tạo ${totalCreated} đơn hàng lịch sử.`);
  console.log(`💰 Tổng doanh thu lũy kế: ${totalRev.toLocaleString('vi-VN')} đ`);

  // ====================================================
  // 4. SEED DỮ LIỆU NHẬP KHO (AUDIT LOGS - IMPORT_STOCK)
  // ====================================================
  if (actorId) {
    console.log('\n📥 Bắt đầu tạo dữ liệu các đợt nhập kho từ Tháng 6 đến Tháng 10/2026...');

    // Xóa các đợt nhập kho lịch sử cũ nếu có để tránh nhân bản
    await prisma.auditLog.deleteMany({
      where: {
        action: 'IMPORT_STOCK',
        targetType: 'INVENTORY',
        targetId: { startsWith: 'NK-2026' },
      },
    });

    const stockImportBatches = [
      {
        code: 'NK-20260605-01',
        date: new Date('2026-06-05T09:30:00+07:00'),
        supplier: 'NXB Trẻ',
        note: 'Nhập lô hàng mở màn khai trương sàn Tổ Sách - Dòng sách Văn học & Thiếu nhi',
        qty: 350,
      },
      {
        code: 'NK-20260620-02',
        date: new Date('2026-06-20T14:15:00+07:00'),
        supplier: 'NXB Kim Đồng',
        note: 'Bổ sung các tựa truyện kinh điển và sách kỹ năng sống cho giới trẻ',
        qty: 240,
      },
      {
        code: 'NK-20260708-01',
        date: new Date('2026-07-08T10:00:00+07:00'),
        supplier: 'Nhã Nam',
        note: 'Nhập kho phục vụ Chiến dịch Đọc Sách Hè - Tác phẩm trinh thám & tâm lý học',
        qty: 420,
      },
      {
        code: 'NK-20260725-02',
        date: new Date('2026-07-25T15:45:00+07:00'),
        supplier: 'Alpha Books',
        note: 'Bổ sung chuyên mục Quản trị Kinh doanh, Khởi nghiệp & Tài chính cá nhân',
        qty: 310,
      },
      {
        code: 'NK-20260810-01',
        date: new Date('2026-08-10T09:00:00+07:00'),
        supplier: 'NXB Thế Giới',
        note: 'Nhập kho đợt 1 mùa Tựu trường - Sách Ngoại văn, Lập trình & CNTT',
        qty: 550,
      },
      {
        code: 'NK-20260826-02',
        date: new Date('2026-08-26T14:30:00+07:00'),
        supplier: 'NXB Lao Động',
        note: 'Bổ sung sách Tâm lý giáo dục & Phát triển tư duy cho học sinh sinh viên',
        qty: 280,
      },
      {
        code: 'NK-20260905-01',
        date: new Date('2026-09-05T08:30:00+07:00'),
        supplier: 'NXB Hội Nhà Văn',
        note: 'Đợt nhập lớn Đại tiệc Khai trường - Bộ sách Bestseller và phiên bản bìa cứng đặc biệt',
        qty: 620,
      },
      {
        code: 'NK-20260920-02',
        date: new Date('2026-09-20T11:00:00+07:00'),
        supplier: 'NXB Trẻ',
        note: 'Bổ sung khẩn cấp các tựa sách cháy hàng sau tuần lễ mở bán ưu đãi',
        qty: 380,
      },
      {
        code: 'NK-20261006-01',
        date: new Date('2026-10-06T09:15:00+07:00'),
        supplier: 'NXB Khoa Học & Kỹ Thuật',
        note: 'Nhập đầu tháng 10 - Sách chuyên ngành Trí tuệ nhân tạo, Dữ liệu & Thiết kế hệ thống',
        qty: 300,
      },
      {
        code: 'NK-20261019-02',
        date: new Date('2026-10-19T16:00:00+07:00'),
        supplier: 'Minh Long Books',
        note: 'Bổ sung định kỳ cuối tháng 10 - Tủ sách gia đình và thiếu nhi bổ ích',
        qty: 210,
      },
    ];

    for (const batch of stockImportBatches) {
      const batchBooks = sampleBooks.slice(0, 8);
      const items = batchBooks.map((b) => {
        const itemQty = Math.round(batch.qty / batchBooks.length);
        const importCost = Math.round(b.price * 0.55); // Giá nhập gốc = 55% giá bán lẻ
        return {
          bookId: b.id,
          bookTitle: b.title,
          quantity: itemQty,
          unitCost: importCost,
          totalCost: itemQty * importCost,
        };
      });

      const totalValue = items.reduce((sum, item) => sum + item.totalCost, 0);

      await prisma.auditLog.create({
        data: {
          userId: actorId,
          action: 'IMPORT_STOCK',
          targetType: 'INVENTORY',
          targetId: batch.code,
          details: {
            batchCode: batch.code,
            supplier: batch.supplier,
            note: batch.note,
            totalQuantity: batch.qty,
            totalValue,
            itemsCount: items.length,
            itemsSummary: items.slice(0, 3).map((it) => `${it.bookTitle} (x${it.quantity})`),
          },
          ipAddress: '192.168.1.50',
          createdAt: batch.date,
        },
      });
    }

    console.log(`✅ Đã tạo ${stockImportBatches.length} biên bản nhập kho lịch sử trong AuditLog.`);
  }

  console.log('\n🎉 TOÀN BỘ DỮ LIỆU DEMO ĐÃ ĐƯỢC NẠP THÀNH CÔNG!');
  console.log('----------------------------------------------------');
  console.log('✨ Sẵn sàng để demo trình bày báo cáo!');
}

seedHistoricalOrders()
  .catch((e) => {
    console.error('❌ Lỗi nạp dữ liệu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
