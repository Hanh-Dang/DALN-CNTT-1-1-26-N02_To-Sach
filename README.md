# 📚 Tổ Sách — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến (B2C)

> *"Sách về tổ, tri thức bay xa"*  
> **Đồ Án Liên Ngành — Ngành Công Nghệ Thông Tin (10/2026)**  
> **Nhóm tác giả thực hiện:**  
> * **Nguyễn Đăng Hanh** (Hanh-Dang — hnhngyndng@gmail.com)  
> * **Nguyễn Mạnh Hòa**

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

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Local (Setup Guide)

Tài liệu hướng dẫn từng bước từ đầu để thiết lập và chạy toàn bộ dự án Tổ Sách trên máy tính cá nhân (hỗ trợ Windows, macOS và Linux).

### 1. Yêu cầu môi trường chuẩn bị (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js**: Phiên bản `>= 18.x` hoặc `>= 20.x LTS` (Khuyến nghị dùng Node 20+). Kiểm tra bằng lệnh: `node -v`
* **Trình quản lý gói**: `npm` (đi kèm sẵn với Node.js) hoặc `pnpm`, `yarn`. Kiểm tra bằng lệnh: `npm -v`
* **Git**: Dùng để quản lý mã nguồn. Kiểm tra bằng lệnh: `git --version`
* **Cơ sở dữ liệu PostgreSQL**: Có thể sử dụng tài khoản miễn phí trên [Supabase Cloud](https://supabase.com) (khuyến nghị cho đồ án) hoặc PostgreSQL cài cục bộ (Local).

---

### 2. Tải mã nguồn về máy (Clone Repository)
Mở Terminal (hoặc PowerShell trên Windows) và chạy lệnh:
```bash
# Clone dự án từ GitHub
git clone https://github.com/Hanh-Dang/DALN-CNTT-1-1-26-N02_To-Sach.git

# Di chuyển vào thư mục dự án
cd DALN-CNTT-1-1-26-N02_To-Sach
```

---

### 3. Cài đặt các gói thư viện (Install Dependencies)
Cài đặt toàn bộ các thư viện cần thiết đã định nghĩa trong `package.json`:
```bash
npm install
```
*(Quá trình này sẽ mất từ 1 đến 2 phút tùy theo tốc độ đường truyền mạng).*

---

### 4. Thiết lập biến môi trường (Environment Configuration)
Dự án sử dụng file `.env` để bảo mật chuỗi kết nối cơ sở dữ liệu và mã khóa bí mật JWT.

1. **Sao chép file mẫu `.env.example` thành `.env`:**
   * **Trên Windows PowerShell:**
     ```powershell
     copy .env.example .env
     ```
   * **Trên macOS / Linux:**
     ```bash
     cp .env.example .env
     ```

2. **Mở file `.env` và điền các thông số kết nối của bạn:**
   ```env
   # 1. Chuỗi kết nối PostgreSQL thông qua PgBouncer Pooler (cổng 6543)
   DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # 2. Chuỗi kết nối PostgreSQL trực tiếp Direct (cổng 5432 - dùng cho Prisma Migration)
   DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

   # 3. Mã khóa bí mật JWT dùng để ký và xác thực phiên đăng nhập (tùy ý đặt chuỗi ngẫu nhiên dài)
   JWT_SECRET="tosach_super_secret_jwt_key_2026_proposals"

   # 4. (Tùy chọn) API Key của Google Gemini Flash dùng cho tính năng Trợ lý AI tư vấn sách
   GEMINI_API_KEY="your-gemini-api-key"
   ```

---

### 5. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu (Database Setup)
Sử dụng công cụ **Prisma ORM** để tự động tạo 14 bảng quan hệ và nạp dữ liệu mẫu:

```bash
# Bước 5.1: Sinh bộ mã nguồn Prisma Client phù hợp với hệ thống
npx prisma generate

# Bước 5.2: Đẩy toàn bộ cấu trúc bảng (schema) lên PostgreSQL
npx prisma db push

# Bước 5.3: Nạp dữ liệu hạt giống (Seed Data: tài khoản mẫu, danh mục, sách ban đầu)
npx prisma db seed
```

> **Mẹo hữu ích:** Nếu bạn muốn nạp đầy đủ kho sách thực tế 5.000+ cuốn và 50.000+ reviews theo chuẩn Proposal:
> ```bash
> npx tsx scripts/seed_5000_books_catalog.ts
> ```

---

### 6. Khởi động ứng dụng (Start Dev Server)
Khởi chạy máy chủ phát triển Next.js:
```bash
npm run dev
```

Mở trình duyệt web và truy cập vào địa chỉ:
👉 **`http://localhost:3000`**

---

### 7. Các lệnh hữu ích hỗ trợ phát triển (Developer Toolkit)

| Lệnh | Ý nghĩa & Mục đích sử dụng |
|---|---|
| `npm run dev` | Khởi chạy máy chủ phát triển Next.js tại `http://localhost:3000` |
| `npx prisma studio` | Mở giao diện Web quản trị CSDL trực quan tại `http://localhost:5555` để xem/sửa dữ liệu bảng |
| `npx tsc --noEmit` | Quét và kiểm tra toàn bộ lỗi kiểu dữ liệu TypeScript trong toàn bộ dự án |
| `npm run build` | Đóng gói và biên dịch dự án tối ưu hóa cho môi trường Production |
| `npm run start` | Khởi chạy ứng dụng bằng gói build Production đã tạo |

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
│   │   │   ├── locations/   # API nạp dữ liệu hành chính 3 cấp (Tỉnh - Huyện - Xã) chuẩn GSO
│   │   │   ├── orders/      # API Đặt hàng Prisma Transaction (ACID) & Tra cứu đơn
│   │   │   └── reviews/     # API tiếp nhận và duyệt đánh giá bạn đọc
│   │   ├── account/orders/  # Trang Lịch sử đơn mua & Timeline vận chuyển thời gian thực
│   │   ├── book/[slug]/     # Trang Chi tiết sách chuẩn SEO (Dynamic Route Server Component)
│   │   ├── catalog/         # Trang Danh mục sách & Bộ lọc đa chiều (3 cấp, giá, sao, NXB)
│   │   ├── cart/            # Trang Giỏ hàng tương tác & Thanh tiến trình Freeship 150k
│   │   ├── checkout/        # Trang Thanh toán (Sổ địa chỉ linh hoạt, COD & VietQR)
│   │   ├── order/success/   # Trang Đặt hàng thành công (kèm VietQR động & sao chép STK)
│   │   ├── wishlist/        # Trang Quản lý Tủ sách yêu thích (1-Click sang giỏ hàng)
│   │   ├── auth/            # Trang Đăng nhập & Đăng ký (kèm nút test 4 vai trò)
│   │   ├── layout.tsx       # Root Layout & Typography Plus Jakarta Sans
│   │   └── page.tsx         # Trang chủ kết nối 100% dữ liệu thực tế Supabase DB
│   ├── components/          # UI Components chuẩn Design System Figma
│   │   ├── account/         # OrdersClient (Tabs trạng thái, Card đơn, Timeline drawer)
│   │   ├── book/            # BookCard, BookDetailClient (Gallery, Tabs, Reviews)
│   │   ├── brand/           # ToSachLogo độc quyền
│   │   ├── cart/            # CartClient (Stepper số lượng, Freeship bar, Empty state, Gợi ý, Sắp xếp)
│   │   ├── checkout/        # CheckoutClient (Form địa chỉ 3 cấp, COD & VietQR), OrderSuccessClient
│   │   ├── catalog/         # CatalogFilterSidebar, CatalogBookCard, CatalogClient
│   │   └── layout/          # CustomerHeader (Zero CLS, Mega Menu), CustomerFooter
│   ├── context/             # Quản lý State phân vùng cục bộ
│   │   ├── CartContext.tsx      # Giỏ hàng độc lập (Guest & User Smart Merge)
│   │   └── WishlistContext.tsx  # Tủ sách yêu thích độc lập
│   ├── lib/
│   │   ├── auth.ts          # Mã hóa JWT HS256 (jose) & Bcrypt password hash
│   │   ├── flyToCart.ts     # Hiệu ứng ném sách vào giỏ hàng (Parabolic Fly-to-Cart GPU 60fps)
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── provinces.ts     # Danh mục 63 Tỉnh/Thành & Ước tính thời gian giao hàng
│   │   └── utils.ts         # Tiện ích định dạng tiền VND, tính chiết khấu
│   └── middleware.ts        # Next.js Middleware kiểm tra quyền RBAC & chốt chặn checkout
├── legacy/                  # Thư mục lưu trữ code Express/Vite cũ làm tư liệu
├── Proposal/                # Tài liệu Proposal gốc của đồ án
├── UI/                      # Bản vẽ và xuất HTML/Figma tham khảo
├── DOCS_KIEN_TRUC_SO_DO_BAO_CAO.md # Sơ đồ kiến trúc N-tier, ERD, UML & Tiến độ 8 tuần
└── README.md
```
