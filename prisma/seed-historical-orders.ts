import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Danh sách khách hàng mẫu
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
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Hàm sinh ngày ngẫu nhiên trong khoảng thời gian
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedHistoricalOrders() {
  console.log('🚀 Bắt đầu tạo dữ liệu đơn hàng lịch sử từ Tháng 7/2026 đến Tháng 10/2026...');

  // 1. Lấy tất cả sách hiện có trong DB
  const books = await prisma.book.findMany();
  if (books.length === 0) {
    console.error('❌ Không tìm thấy sách trong database. Vui lòng seed sách trước!');
    return;
  }

  // Nâng tồn kho các sách để không bị âm
  for (const b of books) {
    if (b.stockQty < 30) {
      await prisma.book.update({
        where: { id: b.id },
        data: { stockQty: b.stockQty + 50 },
      });
    }
  }

  // Lấy tài khoản customer mẫu nếu có
  const customerUser = await prisma.user.findUnique({
    where: { email: 'customer@gmail.com' },
  });

  // Mốc thời gian phân bổ:
  // - Tháng 7/2026 (Khai trương): 12 đơn
  // - Tháng 8/2026: 18 đơn
  // - Tháng 9/2026: 25 đơn
  // - Tháng 10/2026 (Hiện tại): 15 đơn
  const periods = [
    { name: 'Tháng 7/2026', start: new Date('2026-07-01T08:00:00Z'), end: new Date('2026-07-31T20:00:00Z'), count: 12 },
    { name: 'Tháng 8/2026', start: new Date('2026-08-01T08:00:00Z'), end: new Date('2026-08-31T20:00:00Z'), count: 18 },
    { name: 'Tháng 9/2026', start: new Date('2026-09-01T08:00:00Z'), end: new Date('2026-09-30T20:00:00Z'), count: 25 },
    { name: 'Tháng 10/2026', start: new Date('2026-10-01T08:00:00Z'), end: new Date('2026-10-08T15:00:00Z'), count: 15 },
  ];

  let orderSequence = 1000;
  let totalCreatedOrders = 0;
  let totalRevenue = 0;

  for (const period of periods) {
    console.log(`📦 Đang tạo ${period.count} đơn hàng cho ${period.name}...`);

    for (let i = 0; i < period.count; i++) {
      orderSequence++;
      const orderDate = getRandomDate(period.start, period.end);
      const customer = getRandomItem(sampleCustomers);

      // Mã đơn hàng chuẩn: TS-YYYYMMDD-XXXX
      const yyyymmdd = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      const orderCode = `TS-${yyyymmdd}-${orderSequence}`;

      // Chọn ngẫu nhiên 1 - 3 cuốn sách
      const numBooks = getRandomInt(1, 3);
      const chosenBooks: typeof books = [];
      while (chosenBooks.length < numBooks) {
        const b = getRandomItem(books);
        if (!chosenBooks.some((item) => item.id === b.id)) {
          chosenBooks.push(b);
        }
      }

      // Xây dựng items và tính tiền
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

      // Phí vận chuyển: Freeship nếu >= 150.000đ, phí ship đồng giá 25.000đ
      const shippingFee = subtotal >= 150000 ? 0 : 25000;
      const totalAmount = subtotal + shippingFee;

      // Trạng thái đơn hàng theo thời gian
      let status: OrderStatus = OrderStatus.DELIVERED;
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      const paymentMethod = Math.random() > 0.4 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.COD;

      if (period.name === 'Tháng 10/2026') {
        const rand = Math.random();
        if (rand < 0.2) {
          status = OrderStatus.PENDING;
          paymentStatus = paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PAID;
        } else if (rand < 0.4) {
          status = OrderStatus.CONFIRMED;
          paymentStatus = PaymentStatus.PAID;
        } else if (rand < 0.6) {
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
        // Tháng 7, 8, 9 hầu hết đã giao xong
        if (Math.random() < 0.05) {
          status = OrderStatus.CANCELLED;
          paymentStatus = PaymentStatus.REFUNDED;
        } else {
          status = OrderStatus.DELIVERED;
          paymentStatus = PaymentStatus.PAID;
        }
      }

      // Timeline chuẩn đồng bộ với cả frontend lẫn admin (M12)
      const timeline = [
        {
          status: 'PENDING',
          title: 'Đặt hàng thành công',
          description: 'Khách hàng hoàn tất gửi đơn hàng qua cổng mua sắm Tổ Sách.',
          timestamp: orderDate.toISOString(),
          time: orderDate.toISOString(),
          desc: 'Khách hàng hoàn tất gửi đơn hàng qua cổng mua sắm Tổ Sách.',
        },
      ];

      if (status !== OrderStatus.PENDING) {
        const confirmDate = new Date(orderDate.getTime() + 15 * 60 * 1000);
        timeline.push({
          status: status === OrderStatus.CANCELLED ? 'CANCELLED' : 'CONFIRMED',
          title: status === OrderStatus.CANCELLED ? 'Đơn hàng đã bị hủy' : 'Đã xác nhận đơn hàng',
          description: status === OrderStatus.CANCELLED ? 'Đơn hàng đã được ghi nhận hủy theo yêu cầu.' : 'Nhân viên kho đã kiểm tra tồn kho và phê duyệt đóng gói.',
          timestamp: confirmDate.toISOString(),
          time: confirmDate.toISOString(),
          desc: status === OrderStatus.CANCELLED ? 'Đơn hàng đã được ghi nhận hủy theo yêu cầu.' : 'Nhân viên kho đã kiểm tra tồn kho và phê duyệt đóng gói.',
        });
      }

      if (status === OrderStatus.SHIPPING || status === OrderStatus.DELIVERED) {
        const shipDate = new Date(orderDate.getTime() + 2 * 3600 * 1000);
        timeline.push({
          status: 'SHIPPING',
          title: 'Đang vận chuyển',
          description: 'Đơn hàng đã bàn giao cho đơn vị vận chuyển Viettel Post.',
          timestamp: shipDate.toISOString(),
          time: shipDate.toISOString(),
          desc: 'Đơn hàng đã bàn giao cho đơn vị vận chuyển Viettel Post.',
        });
      }

      if (status === OrderStatus.DELIVERED) {
        const deliverDate = new Date(orderDate.getTime() + 24 * 3600 * 1000);
        timeline.push({
          status: 'DELIVERED',
          title: 'Giao hàng thành công',
          description: 'Người nhận đã nhận đủ sách và kiểm tra nguyên vẹn bao bì.',
          timestamp: deliverDate.toISOString(),
          time: deliverDate.toISOString(),
          desc: 'Người nhận đã nhận đủ sách và kiểm tra nguyên vẹn bao bì.',
        });
      }

      // Tạo Order và OrderItems
      await prisma.order.create({
        data: {
          orderCode,
          userId: Math.random() > 0.5 && customerUser ? customerUser.id : null,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          shippingAddress: customer.address,
          subtotal,
          shippingFee,
          totalAmount,
          paymentMethod,
          paymentStatus,
          status,
          trackingCode: status === OrderStatus.SHIPPING || status === OrderStatus.DELIVERED ? `VTP${orderCode.slice(-8)}` : null,
          note: Math.random() > 0.7 ? 'Giao giờ hành chính, gọi trước khi giao' : null,
          timeline,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: itemsData,
          },
        },
      });

      // Tăng soldCount cho sách nếu đơn hợp lệ
      if (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPING || status === OrderStatus.CONFIRMED) {
        for (const item of itemsData) {
          await prisma.book.update({
            where: { id: item.bookId },
            data: { soldCount: { increment: item.quantity } },
          });
        }
        totalRevenue += totalAmount;
      }

      totalCreatedOrders++;
    }
  }

  console.log(`\n🎉 HOÀN TẤT TẠO DỮ LIỆU LỊCH SỬ!`);
  console.log(`- Tổng số đơn hàng mới đã tạo: ${totalCreatedOrders} đơn`);
  console.log(`- Tổng doanh thu lịch sử ước tính: ${(totalRevenue).toLocaleString('vi-VN')} đ`);
}

seedHistoricalOrders()
  .catch((e) => {
    console.error('Lỗi khi nạp dữ liệu lịch sử:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
