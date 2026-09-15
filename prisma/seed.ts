import { PrismaClient, UserRole, UserStatus, OrderStatus, PaymentMethod, PaymentStatus, ReviewStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed database for Tổ Sách...');

  // Clean old data in safe sequence
  await prisma.behaviorEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.bookCategory.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staffPermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // ==========================================
  // 1. SEED PERMISSIONS
  // ==========================================
  const permissionsData = [
    { code: 'MANAGE_BOOKS', name: 'Quản lý sách & kho', description: 'Thêm, sửa, xóa, nhập kho và cập nhật giá sách' },
    { code: 'MANAGE_ORDERS', name: 'Xử lý đơn hàng', description: 'Xem chi tiết đơn, duyệt đơn, cập nhật trạng thái vận chuyển' },
    { code: 'MANAGE_CATEGORIES', name: 'Quản lý danh mục', description: 'Tổ chức cây danh mục sách 3 cấp' },
    { code: 'MANAGE_USERS', name: 'Quản lý người dùng & phân quyền', description: 'Xem danh sách khách hàng và cấp quyền cho nhân viên' },
    { code: 'VIEW_AUDIT_LOG', name: 'Xem nhật ký kiểm toán', description: 'Xem lịch sử truy vết mọi thao tác quản trị' },
    { code: 'MANAGE_REVIEWS', name: 'Kiểm duyệt đánh giá', description: 'Phê duyệt hoặc ẩn bình luận, đánh giá của độc giả' },
  ];

  const createdPerms: Record<string, string> = {};
  for (const perm of permissionsData) {
    const p = await prisma.permission.create({ data: perm });
    createdPerms[p.code] = p.id;
  }
  console.log(`✅ Created ${permissionsData.length} permissions.`);

  // ==========================================
  // 2. SEED USERS & ROLES
  // ==========================================
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tosach.vn',
      passwordHash: adminPassword,
      fullName: 'Võ Minh Quân (Super Admin)',
      phone: '0901234567',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          readingLevel: 'heavy',
          addressProvince: 'TP. Hồ Chí Minh',
          addressDistrict: 'Quận 1',
          addressWard: 'Phường Bến Nghé',
          addressDetail: '12 Nguyễn Thị Minh Khai',
        },
      },
    },
  });

  // Staff Kho
  const staffKho = await prisma.user.create({
    data: {
      email: 'staff.kho@tosach.vn',
      passwordHash: staffPassword,
      fullName: 'Trần Thị Thu Thảo',
      phone: '0912345678',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          readingLevel: 'moderate',
          addressProvince: 'TP. Hồ Chí Minh',
          addressDistrict: 'Quận Bình Thạnh',
        },
      },
    },
  });

  // Staff Đơn Hàng
  const staffOrder = await prisma.user.create({
    data: {
      email: 'staff.order@tosach.vn',
      passwordHash: staffPassword,
      fullName: 'Lê Hoàng Nam',
      phone: '0923456789',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          readingLevel: 'casual',
          addressProvince: 'TP. Hồ Chí Minh',
          addressDistrict: 'Quận 3',
        },
      },
    },
  });

  // Khách hàng mẫu
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      passwordHash: userPassword,
      fullName: 'Nguyễn Hoàng Dũng',
      phone: '0912345688',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          readingLevel: 'heavy',
          preferredGenres: ['Văn Học', 'Kinh Tế', 'Công Nghệ'],
          addressProvince: 'TP. Hồ Chí Minh',
          addressDistrict: 'Quận 1',
          addressWard: 'Phường Bến Nghé',
          addressDetail: '72 Lê Thánh Tôn, Tòa nhà Vincom Center',
        },
      },
    },
  });

  // Gán quyền cho Staff
  await prisma.staffPermission.createMany({
    data: [
      { staffId: staffKho.id, permissionId: createdPerms['MANAGE_BOOKS'], assignedById: adminUser.id },
      { staffId: staffKho.id, permissionId: createdPerms['MANAGE_CATEGORIES'], assignedById: adminUser.id },
      { staffId: staffOrder.id, permissionId: createdPerms['MANAGE_ORDERS'], assignedById: adminUser.id },
      { staffId: staffOrder.id, permissionId: createdPerms['MANAGE_REVIEWS'], assignedById: adminUser.id },
    ],
  });

  console.log('✅ Created users and assigned staff permissions.');

  // ==========================================
  // 3. SEED CATEGORIES (3-Tier Hierarchy)
  // ==========================================
  // Level 1: Văn Học
  const catVanHoc = await prisma.category.create({
    data: { name: 'Văn Học', slug: 'van-hoc', level: 1, sortOrder: 1 },
  });
  const catTieuThuyet = await prisma.category.create({
    data: { name: 'Tiểu Thuyết', slug: 'tieu-thuyet', level: 2, parentId: catVanHoc.id, sortOrder: 1 },
  });
  const catTieuThuyetVN = await prisma.category.create({
    data: { name: 'Tiểu thuyết Việt Nam', slug: 'tieu-thuyet-vn', level: 3, parentId: catTieuThuyet.id, sortOrder: 1 },
  });
  const catTieuThuyetNN = await prisma.category.create({
    data: { name: 'Tiểu thuyết Nước ngoài', slug: 'tieu-thuyet-nuoc-ngoai', level: 3, parentId: catTieuThuyet.id, sortOrder: 2 },
  });
  const catTrinhTham = await prisma.category.create({
    data: { name: 'Trinh Thám & Kinh Dị', slug: 'trinh-tham-kinh-di', level: 2, parentId: catVanHoc.id, sortOrder: 2 },
  });
  const catTrinhThamNB = await prisma.category.create({
    data: { name: 'Trinh thám Nhật Bản (Honkaku)', slug: 'trinh-tham-nhat-ban', level: 3, parentId: catTrinhTham.id, sortOrder: 1 },
  });

  // Level 1: Kinh Tế & Kỹ Năng
  const catKinhTe = await prisma.category.create({
    data: { name: 'Kinh Tế & Kỹ Năng', slug: 'kinh-te-ky-nang', level: 1, sortOrder: 2 },
  });
  const catTaiChinh = await prisma.category.create({
    data: { name: 'Tài Chính & Đầu Tư', slug: 'tai-chinh-dau-tu', level: 2, parentId: catKinhTe.id, sortOrder: 1 },
  });
  const catTaiChinhCN = await prisma.category.create({
    data: { name: 'Quản lý tài chính cá nhân', slug: 'tai-chinh-ca-nhan', level: 3, parentId: catTaiChinh.id, sortOrder: 1 },
  });

  // Level 1: Công Nghệ & Lập Trình
  const catCongNghe = await prisma.category.create({
    data: { name: 'Công Nghệ & Lập Trình', slug: 'cong-nghe-lap-trinh', level: 1, sortOrder: 3 },
  });
  const catLapTrinh = await prisma.category.create({
    data: { name: 'Lập Trình Phần Mềm', slug: 'lap-trinh-phan-mem', level: 2, parentId: catCongNghe.id, sortOrder: 1 },
  });
  const catPython = await prisma.category.create({
    data: { name: 'Python & Khoa học Dữ liệu', slug: 'python-data-science', level: 3, parentId: catLapTrinh.id, sortOrder: 1 },
  });
  const catHeThong = await prisma.category.create({
    data: { name: 'Hệ Thống & Bảo Mật', slug: 'he-thong-bao-mat', level: 2, parentId: catCongNghe.id, sortOrder: 2 },
  });

  // Level 1: Lịch Sử, Tâm Lý
  const catLichSu = await prisma.category.create({
    data: { name: 'Lịch Sử & Văn Hóa', slug: 'lich-su-van-hoa', level: 1, sortOrder: 4 },
  });
  const catTamLy = await prisma.category.create({
    data: { name: 'Tâm Lý & Triết Học', slug: 'tam-ly-triet-hoc', level: 1, sortOrder: 5 },
  });

  console.log('✅ Created 3-tier categories hierarchy.');

  // ==========================================
  // 4. SEED AUTHORS
  // ==========================================
  const authors = [
    { name: 'Nguyễn Nhật Ánh', slug: 'nguyen-nhat-anh', bio: 'Nhà văn hàng đầu viết về tuổi học trò và ký ức Việt Nam' },
    { name: 'Morgan Housel', slug: 'morgan-housel', bio: 'Cựu chuyên mục gia Wall Street Journal, tác giả Tâm lý học về tiền' },
    { name: 'Higashino Keigo', slug: 'higashino-keigo', bio: 'Bậc thầy tiểu thuyết trinh thám đương đại Nhật Bản' },
    { name: 'Paulo Coelho', slug: 'paulo-coelho', bio: 'Tác giả kiệt tác Nhà Giả Kim' },
    { name: 'Yuval Noah Harari', slug: 'yuval-noah-harari', bio: 'Sử gia và triết gia hiện đại, tác giả Sapiens' },
    { name: 'Thích Minh Niệm', slug: 'thich-minh-niem', bio: 'Thiền sư, tác giả cuốn sách chữa lành Hiểu Về Trái Tim' },
    { name: 'Alex Xu', slug: 'alex-xu', bio: 'Chuyên gia thiết kế hệ thống phần mềm tại thung lũng Silicon' },
    { name: 'Nguyễn Hữu Điệp', slug: 'nguyen-huu-diep', bio: 'Giảng viên chuyên ngành Khoa học Máy tính' },
  ];

  const createdAuthors: Record<string, string> = {};
  for (const a of authors) {
    const created = await prisma.author.create({ data: a });
    createdAuthors[a.name] = created.id;
  }
  console.log(`✅ Created ${authors.length} authors.`);

  // ==========================================
  // 5. SEED BOOKS
  // ==========================================
  const booksData = [
    {
      isbn: '978-604-1-18290-5',
      title: 'Cây Chuối Non Đi Giày Xanh',
      slug: 'cay-chuoi-non-di-giay-xanh',
      authorName: 'Nguyễn Nhật Ánh',
      publisher: 'NXB Trẻ',
      publishYear: 2023,
      price: 115000,
      originalPrice: 135000,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      extraImages: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      ],
      stockQty: 48,
      soldCount: 3420,
      pageCount: 296,
      weightG: 340,
      sizeCm: '13 x 20.5 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Cây chuối non đi giày xanh là tác phẩm chan chứa ký ức tuổi thơ, tình làng nghĩa xóm và rung động đầu đời trong trẻo của các cô cậu học trò làng Đo Đo. Ngòi bút Nguyễn Nhật Ánh tiếp tục sưởi ấm tâm hồn người đọc với những câu chuyện dung dị nhưng thấm thía.',
      tags: ['bestseller', 'tuoi-tho', 'van-hoc-viet'],
      isBestseller: true,
      isFeatured: true,
      avgRating: 4.9,
      ratingCount: 328,
      categoryId: catTieuThuyetVN.id,
    },
    {
      isbn: '978-604-2-22104-7',
      title: 'Lập Trình Python Cho Người Mới Bắt Đầu',
      slug: 'lap-trinh-python-cho-nguoi-moi-bat-dau',
      authorName: 'Nguyễn Hữu Điệp',
      publisher: 'NXB Khoa Học & Kỹ Thuật',
      publishYear: 2024,
      price: 159000,
      originalPrice: 199000,
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
      extraImages: [
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800',
      ],
      stockQty: 35,
      soldCount: 1840,
      pageCount: 420,
      weightG: 520,
      sizeCm: '16 x 24 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Cuốn sách hướng dẫn toàn diện từ con số 0 đến xây dựng các ứng dụng tự động hóa, phân tích dữ liệu và web scraper. Đi kèm 15 dự án thực chiến và source code bài tập kèm giải thích chi tiết.',
      tags: ['python', 'lap-trinh', 'cong-nghe'],
      isNew: true,
      isFeatured: true,
      avgRating: 4.8,
      ratingCount: 172,
      categoryId: catPython.id,
    },
    {
      isbn: '978-604-56-8291-1',
      title: 'Tâm Lý Học Về Tiền (The Psychology of Money)',
      slug: 'tam-ly-hoc-ve-tien',
      authorName: 'Morgan Housel',
      translator: 'Vũ Hoàng Linh',
      publisher: 'NXB Lao Động',
      publishYear: 2023,
      price: 139000,
      originalPrice: 180000,
      coverUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=600',
      extraImages: [
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800',
      ],
      stockQty: 82,
      soldCount: 5210,
      pageCount: 384,
      weightG: 410,
      sizeCm: '14 x 20.5 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Thành công với tiền bạc không nhất thiết xuất phát từ kiến thức thông thái, mà là cách bạn hành xử. Cuốn sách chia sẻ 19 câu chuyện ngắn khám phá những cách kỳ lạ mà con người nghĩ về tiền.',
      tags: ['bestseller', 'tai-chinh', 'dau-tu', 'tam-ly'],
      isBestseller: true,
      isFeatured: true,
      avgRating: 4.9,
      ratingCount: 512,
      categoryId: catTaiChinhCN.id,
    },
    {
      isbn: '978-604-1-09432-1',
      title: 'Nhà Giả Kim (Bản Đặc Biệt Kỷ Niệm)',
      slug: 'nha-gia-kim-ky-niem',
      authorName: 'Paulo Coelho',
      translator: 'Lê Chu Cầu',
      publisher: 'NXB Hội Nhà Văn',
      publishYear: 2024,
      price: 98000,
      originalPrice: 120000,
      coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
      extraImages: [
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800',
      ],
      stockQty: 110,
      soldCount: 8900,
      pageCount: 228,
      weightG: 280,
      sizeCm: '13 x 20.5 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Tác phẩm văn học kinh điển đương đại được dịch ra hơn 80 thứ tiếng trên thế giới. Hành trình theo đuổi vận mệnh của cậu bé chăn cừu Santiago gửi gắm thông điệp sâu sắc.',
      tags: ['kinh-dien', 'bestseller', 'triet-ly'],
      isBestseller: true,
      avgRating: 4.9,
      ratingCount: 890,
      categoryId: catTieuThuyetNN.id,
    },
    {
      isbn: '978-604-58-1249-2',
      title: 'Sapiens: Lược Sử Loài Người',
      slug: 'sapiens-luoc-su-loai-nguoi',
      authorName: 'Yuval Noah Harari',
      translator: 'Nguyễn Việt Long',
      publisher: 'NXB Tri Thức',
      publishYear: 2023,
      price: 245000,
      originalPrice: 289000,
      coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
      extraImages: [],
      stockQty: 29,
      soldCount: 4120,
      pageCount: 560,
      weightG: 680,
      sizeCm: '16 x 24 cm',
      format: 'Bìa cứng',
      language: 'Tiếng Việt',
      description: 'Từ một loài vượn người không có gì nổi bật tại châu Phi, làm thế nào Homo Sapiens vươn lên thống trị hành tinh? Cuốn sách của Harari là một chuyến du hành trí tuệ lộng lẫy qua hàng vạn năm lịch sử sinh học và văn hóa nhân loại.',
      tags: ['lich-su', 'khoa-hoc', 'tri-thuc', 'bestseller'],
      isBestseller: true,
      isFeatured: true,
      avgRating: 4.8,
      ratingCount: 415,
      categoryId: catLichSu.id,
    },
    {
      isbn: '978-604-2-19830-1',
      title: 'Hiểu Về Trái Tim',
      slug: 'hieu-ve-trai-tim',
      authorName: 'Thích Minh Niệm',
      publisher: 'NXB Trẻ',
      publishYear: 2024,
      price: 145000,
      originalPrice: 170000,
      coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
      extraImages: [],
      stockQty: 64,
      soldCount: 3890,
      pageCount: 480,
      weightG: 490,
      sizeCm: '14 x 20.5 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Cuốn sách đưa ra những góc nhìn sâu sắc về khổ đau, hạnh phúc, tha thứ, tức giận, ghen tuông dưới lăng kính thiền tập và tâm lý học hiện đại.',
      tags: ['tam-ly', 'chua-lanh', 'thien'],
      isNew: true,
      avgRating: 4.9,
      ratingCount: 360,
      categoryId: catTamLy.id,
    },
    {
      isbn: '978-604-3-00912-3',
      title: 'Thiết Kế Hệ Thống Quy Mô Lớn (System Design)',
      slug: 'system-design-interview-vi',
      authorName: 'Alex Xu',
      translator: 'Vũ Đức Thịnh',
      publisher: 'NXB Thế Giới',
      publishYear: 2024,
      price: 265000,
      originalPrice: 320000,
      coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
      extraImages: [],
      stockQty: 18,
      soldCount: 760,
      pageCount: 340,
      weightG: 550,
      sizeCm: '17 x 24 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Cẩm nang toàn diện dành cho kỹ sư phần mềm muốn làm chủ kiến trúc microservices, cache Redis, message queue, sharding cơ sở dữ liệu.',
      tags: ['system-design', 'backend', 'kien-truc'],
      isNew: true,
      avgRating: 4.9,
      ratingCount: 94,
      categoryId: catHeThong.id,
    },
    {
      isbn: '978-604-1-19011-5',
      title: 'Án Mạng Mười Một Chữ',
      slug: 'an-mang-muoi-mot-chu',
      authorName: 'Higashino Keigo',
      translator: 'Kim Lê',
      publisher: 'NXB Hội Nhà Văn',
      publishYear: 2023,
      price: 112000,
      originalPrice: 140000,
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
      extraImages: [],
      stockQty: 42,
      soldCount: 2190,
      pageCount: 312,
      weightG: 320,
      sizeCm: '14 x 20.5 cm',
      format: 'Bìa mềm',
      language: 'Tiếng Việt',
      description: 'Một tác phẩm trinh thám ly kỳ của bậc thầy Higashino Keigo. Mười một chữ định mệnh bắt đầu cho chuỗi án mạng liên hoàn không lời giải đáp.',
      tags: ['trinh-tham', 'keigo', 'nhat-ban'],
      avgRating: 4.7,
      ratingCount: 188,
      categoryId: catTrinhThamNB.id,
    },
  ];

  const createdBooks: any[] = [];
  for (const b of booksData) {
    const { authorName, categoryId, ...data } = b;
    const book = await prisma.book.create({
      data: {
        ...data,
        authors: {
          create: [
            { authorId: createdAuthors[authorName] },
          ],
        },
        categories: {
          create: [
            { categoryId },
          ],
        },
      },
    });
    createdBooks.push(book);
  }
  console.log(`✅ Created ${booksData.length} books with author & category relations.`);

  // ==========================================
  // 6. SEED SAMPLE ORDER
  // ==========================================
  const sampleOrder = await prisma.order.create({
    data: {
      orderCode: 'TS-2024-00101',
      userId: customerUser.id,
      customerName: 'Nguyễn Hoàng Dũng',
      customerPhone: '0912 345 678',
      customerEmail: 'customer@gmail.com',
      shippingAddress: '72 Lê Thánh Tôn, Tòa nhà Vincom Center, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      subtotal: 254000,
      shippingFee: 30000,
      totalAmount: 284000,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.SHIPPING,
      trackingCode: 'GHN88294109VN',
      note: 'Giao giờ hành chính, gọi trước khi giao',
      timeline: [
        { status: 'PENDING', title: 'Đã đặt hàng thành công', description: 'Đơn hàng được khởi tạo trên hệ thống Tổ Sách', timestamp: '12/09/2024 10:24' },
        { status: 'CONFIRMED', title: 'Đã xác nhận & đóng gói', description: 'Nhân viên kho Tổ Sách đã kiểm tra và đóng gói sách', timestamp: '12/09/2024 14:10' },
        { status: 'SHIPPING', title: 'Đang giao hàng', description: 'Bàn giao cho GHN Express - Mã bưu gửi GHN88294109VN', timestamp: '13/09/2024 08:30' },
      ],
      items: {
        create: [
          {
            bookId: createdBooks[0].id,
            bookTitle: createdBooks[0].title,
            coverUrl: createdBooks[0].coverUrl,
            unitPrice: createdBooks[0].price,
            quantity: 1,
            totalPrice: createdBooks[0].price,
          },
          {
            bookId: createdBooks[2].id,
            bookTitle: createdBooks[2].title,
            coverUrl: createdBooks[2].coverUrl,
            unitPrice: createdBooks[2].price,
            quantity: 1,
            totalPrice: createdBooks[2].price,
          },
        ],
      },
    },
  });
  console.log(`✅ Created sample order: ${sampleOrder.orderCode}`);

  // ==========================================
  // 7. SEED SAMPLE REVIEWS
  // ==========================================
  await prisma.review.createMany({
    data: [
      {
        bookId: createdBooks[0].id,
        userId: customerUser.id,
        rating: 5,
        title: 'Tác phẩm sưởi ấm tâm hồn',
        body: 'Sách đóng gói rất cẩn thận, bìa đẹp và mới tinh. Đọc văn Nguyễn Nhật Ánh lúc nào cũng thấy bồi hồi nhớ lại thời học sinh.',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
      {
        bookId: createdBooks[2].id,
        userId: customerUser.id,
        rating: 5,
        title: 'Cuốn sách thay đổi tư duy tài chính',
        body: 'Không khô khan giáo điều như sách tài chính khác. Những mẩu chuyện ngắn của Morgan Housel thực sự chạm đến bản năng của con người khi cầm tiền.',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
    ],
  });
  console.log('✅ Created sample verified reviews.');

  // ==========================================
  // 8. SEED INITIAL AUDIT LOG
  // ==========================================
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      targetType: 'SYSTEM',
      targetId: 'INIT_DB',
      details: { note: 'Khởi tạo cơ sở dữ liệu ban đầu cho Tổ Sách theo Proposal' },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ Created initial audit log entry.');

  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('Accounts created:');
  console.log('👑 Super Admin: admin@tosach.vn / Admin@123');
  console.log('📦 Staff Kho:   staff.kho@tosach.vn / Staff@123');
  console.log('📑 Staff Đơn:   staff.order@tosach.vn / Staff@123');
  console.log('👤 Khách hàng:  customer@gmail.com / User@123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
