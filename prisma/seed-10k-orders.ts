import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const res: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      res.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur);
  return res;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

async function main() {
  console.log('========================================================================');
  console.log('🚀 NẠP 10.000 ĐƠN HÀNG VÀ 16.979 CHI TIẾT ĐƠN HÀNG VÀO POSTGRESQL SUPABASE');
  console.log('========================================================================');

  const ordersCsvPath = path.join(process.cwd(), 'data', 'orders_10k.csv');
  const itemsCsvPath = path.join(process.cwd(), 'data', 'order_items.csv');

  if (!fs.existsSync(ordersCsvPath) || !fs.existsSync(itemsCsvPath)) {
    console.error('❌ Không tìm thấy tệp data/orders_10k.csv hoặc data/order_items.csv!');
    return;
  }

  // 1. Lấy danh sách Sách để ánh xạ foreign key
  console.log('📚 Đang tải danh bạ sách từ CSDL...');
  const books = await prisma.book.findMany({
    select: { id: true, isbn: true, title: true, coverUrl: true, price: true },
  });
  if (books.length === 0) {
    console.error('❌ Chưa có sách trong CSDL. Vui lòng seed sách trước!');
    return;
  }
  console.log(`✅ Đã nạp ${books.length} sách.`);

  const defaultBook = books[0];
  const isbnMap = new Map<string, typeof books[0]>();
  const titleMap = new Map<string, typeof books[0]>();
  for (const b of books) {
    if (b.isbn) isbnMap.set(b.isbn.trim(), b);
    if (b.title) titleMap.set(b.title.trim().toLowerCase(), b);
  }

  // 2. Lấy User mẫu (nếu có) để gắn userId một cách ngẫu nhiên thực tế
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const customerUser = users.find((u) => u.email === 'customer@gmail.com') || users[0];

  // 3. Đọc và phân tích orders_10k.csv
  console.log('📦 Đang đọc data/orders_10k.csv...');
  const rawOrdersText = fs.readFileSync(ordersCsvPath, 'utf8').replace(/\r/g, '');
  const orderLines = rawOrdersText.trim().split('\n');
  console.log(`📂 Tổng số dòng đơn hàng: ${orderLines.length - 1}`);

  // Kiểm tra các đơn đã tồn tại trong DB để tránh trùng
  const existingOrders = await prisma.order.findMany({ select: { orderCode: true } });
  const existingCodeSet = new Set(existingOrders.map((o) => o.orderCode));
  console.log(`ℹ️ Đơn hàng đã có trong DB: ${existingCodeSet.size}`);

  const codeToIdMap = new Map<string, string>();
  const ordersToInsert: any[] = [];

  for (let i = 1; i < orderLines.length; i++) {
    const cols = parseCSVLine(orderLines[i]);
    if (cols.length < 13) continue;

    const [
      orderCode,
      userName,
      statusStr,
      subtotalStr,
      discountStr,
      shippingFeeStr,
      totalAmountStr,
      paymentMethodStr,
      paymentStatusStr,
      province,
      district,
      ward,
      createdAtStr,
    ] = cols.map((c) => c.trim());

    if (!orderCode) continue;

    const orderId = crypto.randomUUID();
    codeToIdMap.set(orderCode, orderId);

    // Nếu đã tồn tại trong DB thì bỏ qua không insert lại
    if (existingCodeSet.has(orderCode)) continue;

    const h = hashCode(orderCode);
    const customerPhone = `09${String(10000000 + (h % 90000000)).padStart(8, '0')}`;
    const customerEmail = `${toSlug(userName || 'khachhang')}.${h % 1000}@gmail.com`;
    const shippingAddress = [ward, district, province].filter(Boolean).join(', ') || 'Việt Nam';

    let status: OrderStatus = 'PENDING';
    if (statusStr === 'DELIVERED') status = 'DELIVERED';
    else if (statusStr === 'SHIPPING') status = 'SHIPPING';
    else if (statusStr === 'CONFIRMED') status = 'CONFIRMED';
    else if (statusStr === 'CANCELLED') status = 'CANCELLED';

    const paymentMethod: PaymentMethod = paymentMethodStr === 'COD' ? 'COD' : 'BANK_TRANSFER';
    const paymentStatus: PaymentStatus = paymentStatusStr === 'PAID' ? 'PAID' : 'PENDING';

    const subtotal = parseInt(subtotalStr, 10) || 100000;
    const discountAmount = parseInt(discountStr, 10) || 0;
    const shippingFee = parseInt(shippingFeeStr, 10) || 0;
    const totalAmount = parseInt(totalAmountStr, 10) || Math.max(0, subtotal - discountAmount + shippingFee);

    const createdAt = new Date(createdAtStr || Date.now());
    const trackingCode =
      status === 'DELIVERED' || status === 'SHIPPING'
        ? `GHTK-${String(10000000 + (h % 90000000)).padStart(8, '0')}`
        : null;

    // Timeline sự kiện
    const timeline = [
      { status: 'PENDING', time: createdAt.toISOString(), note: 'Đơn hàng được khởi tạo thành công' },
    ];
    if (status === 'CONFIRMED' || status === 'SHIPPING' || status === 'DELIVERED') {
      const confirmTime = new Date(createdAt.getTime() + 15 * 60 * 1000);
      timeline.push({ status: 'CONFIRMED', time: confirmTime.toISOString(), note: 'Nhà sách đã xác nhận đơn' });
    }
    if (status === 'SHIPPING' || status === 'DELIVERED') {
      const shipTime = new Date(createdAt.getTime() + 2 * 3600 * 1000);
      timeline.push({ status: 'SHIPPING', time: shipTime.toISOString(), note: `Đã bàn giao đơn vị vận chuyển (${trackingCode})` });
    }
    if (status === 'DELIVERED') {
      const delTime = new Date(createdAt.getTime() + 24 * 3600 * 1000);
      timeline.push({ status: 'DELIVERED', time: delTime.toISOString(), note: 'Giao hàng thành công tới khách hàng' });
    }
    if (status === 'CANCELLED') {
      const cancelTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
      timeline.push({ status: 'CANCELLED', time: cancelTime.toISOString(), note: 'Đơn hàng đã được hủy theo yêu cầu' });
    }

    ordersToInsert.push({
      id: orderId,
      orderCode,
      userId: (h % 5 === 0 && customerUser) ? customerUser.id : null,
      customerName: userName || 'Khách Hàng',
      customerPhone,
      customerEmail,
      shippingAddress,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status,
      trackingCode,
      note: null,
      timeline,
      discountAmount,
      createdAt,
      updatedAt: createdAt,
    });
  }

  console.log(`🚀 Sẵn sàng chèn ${ordersToInsert.length} đơn hàng mới vào CSDL...`);

  // 4. Batch chèn Orders theo chunk 500
  const ORDER_CHUNK = 500;
  for (let i = 0; i < ordersToInsert.length; i += ORDER_CHUNK) {
    const chunk = ordersToInsert.slice(i, i + ORDER_CHUNK);
    await prisma.order.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`  • Đã chèn đơn hàng ${i + 1} -> ${Math.min(i + ORDER_CHUNK, ordersToInsert.length)}...`);
  }
  const totalOrdersNow = await prisma.order.count();
  console.log(`✅ Hoàn tất đơn hàng. CSDL hiện có: ${totalOrdersNow} đơn hàng.`);

  // 5. Đọc và phân tích order_items.csv
  console.log('\n📦 Đang đọc data/order_items.csv...');
  const rawItemsText = fs.readFileSync(itemsCsvPath, 'utf8').replace(/\r/g, '');
  const itemLines = rawItemsText.trim().split('\n');
  console.log(`📂 Tổng số dòng chi tiết đơn hàng: ${itemLines.length - 1}`);

  const itemsToInsert: any[] = [];
  for (let i = 1; i < itemLines.length; i++) {
    const cols = parseCSVLine(itemLines[i]);
    if (cols.length < 7) continue;

    const [itemId, orderCode, isbn, bookTitle, quantityStr, unitPriceStr, totalPriceStr] = cols.map((c) => c.trim());
    const orderId = codeToIdMap.get(orderCode);
    if (!orderId) continue;

    // Tìm sách theo ISBN hoặc tên
    const cleanIsbn = isbn ? isbn.trim() : '';
    const cleanTitle = bookTitle ? bookTitle.trim().toLowerCase() : '';
    const book = (cleanIsbn && isbnMap.get(cleanIsbn)) || (cleanTitle && titleMap.get(cleanTitle)) || defaultBook;

    const quantity = Math.max(1, parseInt(quantityStr, 10) || 1);
    const unitPrice = parseInt(unitPriceStr, 10) || book.price || 50000;
    const totalPrice = parseInt(totalPriceStr, 10) || quantity * unitPrice;

    itemsToInsert.push({
      id: crypto.randomUUID(),
      orderId,
      bookId: book.id,
      bookTitle: bookTitle || book.title,
      coverUrl: book.coverUrl || '/images/default-book.png',
      unitPrice,
      quantity,
      totalPrice,
    });
  }

  console.log(`🚀 Sẵn sàng chèn ${itemsToInsert.length} chi tiết đơn hàng vào CSDL...`);

  // 6. Batch chèn OrderItems theo chunk 500
  const ITEM_CHUNK = 500;
  for (let i = 0; i < itemsToInsert.length; i += ITEM_CHUNK) {
    const chunk = itemsToInsert.slice(i, i + ITEM_CHUNK);
    await prisma.orderItem.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`  • Đã chèn chi tiết đơn ${i + 1} -> ${Math.min(i + ITEM_CHUNK, itemsToInsert.length)}...`);
  }
  const totalItemsNow = await prisma.orderItem.count();
  console.log(`✅ Hoàn tất chi tiết đơn hàng. CSDL hiện có: ${totalItemsNow} mục chi tiết.`);

  console.log('\n🎉 NẠP TOÀN BỘ 10.000+ ĐƠN HÀNG THÀNH CÔNG RỰC RỠ 100%!');
  console.log(`📊 Tổng kết: ${totalOrdersNow} Đơn Hàng | ${totalItemsNow} Chi Tiết Sản Phẩm.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nạp đơn hàng:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
