# 📚 Tổ Sách — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến (B2C)

> *"Sách về tổ, tri thức bay xa"*  
> **Đồ Án Liên Ngành — Ngành Công Nghệ Thông Tin (10/2026)**  
> **Tác giả:** Hanh-Dang (hnhngyndng@gmail.com)

---

## 📖 Giới Thiệu
**Tổ Sách** là hệ thống thương mại điện tử chuyên bán sách trực tuyến theo mô hình B2C (Business-to-Consumer) thuần túy. Toàn bộ catalog sách được nhập và quản lý tập trung từ các nhà xuất bản uy tín, mang lại trải nghiệm mua sắm đồng nhất, tìm kiếm chuyên sâu và quản trị tinh gọn.

Chi tiết phân tích kiến trúc, thiết kế cơ sở dữ liệu và bí kíp bảo vệ đồ án: xem tại file [**`PROJECT_DOCUMENTATION.md`**](./PROJECT_DOCUMENTATION.md).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
* **Frontend & Backend Framework:** Next.js 15 (App Router, Server Components, Turbopack)
* **Ngôn ngữ:** TypeScript
* **Giao diện (CSS):** Tailwind CSS v4
* **Typography & Kiểu chữ:** **Plus Jakarta Sans** (Chuẩn mực font hình học hiện đại, hỗ trợ tiếng Việt trọn vẹn, tối ưu độ đọc cho sách và giao diện xuất bản)
* **Bộ nhận diện thương hiệu:** Logo Tổ Sách chính thức (`UI/logo - icon/Group.svg` — Tổ chim che chở & Đôi cánh tri thức mở ra trên nền squircle `#0B1F3A` và điểm nhấn vàng hổ phách `#F5A623`)
* **ORM:** Prisma 6
* **Cơ sở dữ liệu:** PostgreSQL (Hosted trên Supabase Cloud)
* **Xác thực & Bảo mật:** Custom JWT, HttpOnly Cookies, Bcrypt Password Hashing
* **Phân quyền người dùng (RBAC):** Next.js Middleware / Proxy

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Local

### 1. Yêu cầu môi trường
* Node.js >= 18.x
* Quản lý gói: `npm` (hoặc `yarn`, `pnpm`)

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Điền chuỗi kết nối Database Supabase PostgreSQL vào `.env`:
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-jwt-secret-key"
```

### 4. Đồng bộ Database & Nạp dữ liệu mẫu
```bash
# Đẩy schema lên database
npx prisma db push

# Nạp dữ liệu mẫu ban đầu
npx prisma db seed
```

### 5. Chạy môi trường phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định (Seed Accounts)

| Vai trò | Email | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Super Admin** | `admin@tosach.vn` | `Admin@123` | Toàn quyền quản trị hệ thống |
| **Nhân viên Kho** | `staff.kho@tosach.vn` | `Staff@123` | Quản lý kho sách & Cây danh mục |
| **Nhân viên Đơn** | `staff.order@tosach.vn` | `Staff@123` | Tiếp nhận & Xử lý trạng thái đơn hàng |
| **Khách hàng mẫu** | `customer@gmail.com` | `User@123` | Mua sắm, đánh giá, xem đơn hàng |

---

## 📂 Cấu Trúc Thư Mục
```text
to-sach-studio/
├── prisma/
│   ├── schema.prisma        # Thiết kế 14 bảng quan hệ DB & Enum
│   └── seed.ts              # Script nạp dữ liệu mẫu tự động
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/
│   │   │   ├── auth/        # Các API đăng nhập, đăng ký, đăng xuất, phiên làm việc
│   │   │   └── reviews/     # API tiếp nhận và duyệt đánh giá bạn đọc
│   │   ├── book/[slug]/     # Trang Chi tiết sách chuẩn SEO (Dynamic Route Server Component)
│   │   ├── catalog/         # Trang Danh mục sách & Bộ lọc đa chiều (3 cấp, giá, sao, NXB)
│   │   ├── wishlist/        # Trang Quản lý Tủ sách yêu thích (1-Click sang giỏ hàng)
│   │   ├── auth/            # Trang Đăng nhập & Đăng ký (kèm nút test 4 vai trò)
│   │   ├── layout.tsx       # Root Layout & Typography Plus Jakarta Sans
│   │   └── page.tsx         # Trang chủ kết nối 100% dữ liệu thực tế Supabase DB
│   ├── components/          # UI Components chuẩn Design System Figma
│   │   ├── book/            # BookCard, BookDetailClient (Gallery, Tabs, Reviews)
│   │   ├── brand/           # ToSachLogo độc quyền
│   │   ├── catalog/         # CatalogFilterSidebar, CatalogBookCard, CatalogClient
│   │   └── layout/          # CustomerHeader (Zero CLS, Mega Menu), CustomerFooter
│   ├── context/             # Quản lý State phân vùng cục bộ
│   │   ├── CartContext.tsx      # Giỏ hàng độc lập (Guest & User Smart Merge)
│   │   └── WishlistContext.tsx  # Tủ sách yêu thích độc lập
│   ├── lib/
│   │   ├── auth.ts          # Mã hóa JWT HS256 (jose) & Bcrypt password hash
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   └── utils.ts         # Tiện ích định dạng tiền VND, tính chiết khấu
│   └── middleware.ts        # Next.js Middleware kiểm tra quyền RBAC & chốt chặn checkout
├── legacy/                  # Thư mục lưu trữ code Express/Vite cũ làm tư liệu
├── Proposal/                # Tài liệu Proposal gốc của đồ án
├── UI/                      # Bản vẽ và xuất HTML/Figma tham khảo
├── DOCS_KIEN_TRUC_SO_DO_BAO_CAO.md # Sơ đồ kiến trúc N-tier, ERD, UML & Tiến độ 8 tuần
└── README.md
```
