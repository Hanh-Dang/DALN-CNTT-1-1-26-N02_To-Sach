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

  // Cập nhật nhanh tồn kho theo batch để không bị nghẽn DB
  // Giữ lại 4 cuốn tồn kho thấp (3-8 cuốn) để widget "Cảnh báo tồn kho" trên Dashboard hiển thị đẹp
  const lowStockIds = sampleBooks.slice(0, 4).map((b) => b.id);
  for (let i = 0; i < lowStockIds.length; i++) {
    await prisma.book.update({
      where: { id: lowStockIds[i] },
      data: { stockQty: 3 + i * 2 },
    });
  }

  // Tăng tồn kho an toàn cho các sách còn lại bằng 1 câu updateMany
  await prisma.book.updateMany({
    where: {
      id: { notIn: lowStockIds },
      stockQty: { lt: 50 },
    },
    data: { stockQty: 180 },
  });
  console.log('✅ Đã chuẩn hóa số liệu tồn kho (bao gồm sách cảnh báo tồn kho thấp).');

  // Lấy User liên kết
  const customerUser = await prisma.user.findUnique({ where: { email: 'customer@gmail.com' } });
  const staffKho = await prisma.user.findUnique({ where: { email: 'staff.kho@tosach.vn' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const actorId = staffKho?.id || adminUser?.id;

  // 2. Dọn dẹp đơn lịch sử cũ nếu đã từng tạo (tránh trùng lặp mã đơn TS-2026)
  const deletedOld = await prisma.order.deleteMany({
    where: { orderCode: { startsWith: 'TS-2026' } },
  });
  if (deletedOld.count > 0) {
    console.log(`🧹 Đã dọn dẹp ${deletedOld.count} đơn hàng lịch sử cũ để tái tạo mới.`);
  }

  // 3. Phân bổ các giai đoạn đơn hàng
  const now = new Date('2026-10-22T21:00:00+07:00');
  const periods = [
    { name: 'Tháng 6/2026 (Khởi động sàn)', start: new Date('2026-06-01T08:00:00+07:00'), end: new Date('2026-06-30T21:00:00+07:00'), count: 14 },
    { name: 'Tháng 7/2026 (Chiến dịch Hè)', start: new Date('2026-07-01T08:00:00+07:00'), end: new Date('2026-07-31T21:00:00+07:00'), count: 22 },
    { name: 'Tháng 8/2026 (Tiền Tựu Trường)', start: new Date('2026-08-01T08:00:00+07:00'), end: new Date('2026-08-31T21:00:00+07:00'), count: 32 },
    { name: 'Tháng 9/2026 (Hội Sách Khai Trường)', start: new Date('2026-09-01T08:00:00+07:00'), end: new Date('2026-09-30T21:00:00+07:00'), count: 48 },
    // Tháng 10: trải dài từ 01/10 đến hôm nay (22/10), có cả đơn mới cho hôm nay để biểu đồ 7 ngày hiển thị trọn vẹn
    { name: 'Tháng 10/2026 (Hiện tại)', start: new Date('2026-10-01T08:00:00+07:00'), end: new Date('2026-10-21T23:59:59+07:00'), count: 28 },
    { name: 'Ngày 22/10/2026 (Hôm nay)', start: new Date('2026-10-22T08:00:00+07:00'), end: new Date('2026-10-22T20:30:00+07:00'), count: 6 },
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

      const yyyymmdd = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      const orderCode = `TS-${yyyymmdd}-${orderSeq}`;

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

      const shippingFee = subtotal >= 200000 ? 0 : 30000;
      const discountAmount = Math.random() > 0.75 ? getRandomInt(15000, 40000) : 0;
      const totalAmount = Math.max(subtotal + shippingFee - discountAmount, subtotal);

      let status: OrderStatus = OrderStatus.DELIVERED;
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      const paymentMethod = Math.random() > 0.35 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.COD;

      if (p.name.includes('Hôm nay')) {
        // Hôm nay: đa dạng trạng thái để demo quy trình xử lý đơn
        if (i === 0 || i === 1) {
          status = OrderStatus.PENDING;
          paymentStatus = paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PAID;
        } else if (i === 2) {
          status = OrderStatus.CONFIRMED;
          paymentStatus = PaymentStatus.PAID;
        } else if (i === 3 || i === 4) {
          status = OrderStatus.SHIPPING;
          paymentStatus = PaymentStatus.PAID;
        } else {
          status = OrderStatus.DELIVERED;
          paymentStatus = PaymentStatus.PAID;
        }
      } else if (p.name.includes('Tháng 10')) {
        const rand = Math.random();
        if (rand < 0.1) {
          status = OrderStatus.PENDING;
          paymentStatus = paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PAID;
        } else if (rand < 0.2) {
          status = OrderStatus.CONFIRMED;
          paymentStatus = PaymentStatus.PAID;
        } else if (rand < 0.35) {
          status = OrderStatus.SHIPPING;
          paymentStatus = PaymentStatus.PAID;
        } else if (rand < 0.9) {
          status = OrderStatus.DELIVERED;
          paymentStatus = PaymentStatus.PAID;
        } else {
          status = OrderStatus.CANCELLED;
          paymentStatus = PaymentStatus.REFUNDED;
        }
      } else {
        // Các tháng cũ: hầu hết đã giao thành công, 4% huỷ
        if (Math.random() < 0.04) {
          status = OrderStatus.CANCELLED;
          paymentStatus = PaymentStatus.REFUNDED;
        } else {
          status = OrderStatus.DELIVERED;
          paymentStatus = PaymentStatus.PAID;
        }
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
          userId: Math.random() > 0.45 && customerUser ? customerUser.id : null,
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

  // Cập nhật soldCount một lượt cho các sách đã bán
  console.log(`📈 Đang cập nhật số lượng đã bán cho ${soldIncrements.size} tựa sách...`);
  for (const [bookId, inc] of soldIncrements.entries()) {
    await prisma.book.update({
      where: { id: bookId },
      data: { soldCount: { increment: inc } },
    });
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
