# 📚 Tổ Sách — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến (B2C)

> *"Sách về tổ, tri thức bay xa"*  
> **Đồ Án Liên Ngành — Ngành Công Nghệ Thông Tin (10/2026)**  
> **Nhóm tác giả thực hiện:**  
> * **Nguyễn Đăng Hanh** (Hanh-Dang — hnhngyndng@gmail.com)  
> * **Nguyễn Mạnh Hòa** (ManhHoa2405 — manhhoa02042005@gmail.com)

---

## 📖 Giới Thiệu
**Tổ Sách** là hệ thống thương mại điện tử chuyên bán sách trực tuyến theo mô hình B2C (Business-to-Consumer) thuần túy. Toàn bộ catalog sách được nhập và quản lý tập trung từ các nhà xuất bản uy tín, mang lại trải nghiệm mua sắm đồng nhất, tìm kiếm chuyên sâu và quản trị tinh gọn.

Chi tiết phân tích kiến trúc, thiết kế cơ sở dữ liệu và bí kíp bảo vệ đồ án: xem tại file [**`Document_Project.md`**](./Document_Project.md).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
* **Frontend & Backend Framework:** Next.js 16 (App Router, Server Components, Turbopack, React 19)
* **Ngôn ngữ:** TypeScript
* **Giao diện (CSS):** Tailwind CSS v4
* **Typography & Kiểu chữ:** **Plus Jakarta Sans** (Chuẩn mực font hình học hiện đại, hỗ trợ tiếng Việt trọn vẹn, tối ưu độ đọc cho sách và giao diện xuất bản)
* **Bộ nhận diện thương hiệu:** Logo Tổ Sách chính thức (`UI/logo - icon/Group.svg` — Tổ chim che chở & Đôi cánh tri thức mở ra trên nền squircle `#0B1F3A` và điểm nhấn vàng hổ phách `#F5A623`)
* **ORM:** Prisma 6
* **Cơ sở dữ liệu:** PostgreSQL (Hosted trên Supabase Cloud / Neon) với **17 bảng quan hệ chuẩn 3NF**
* **Hệ thống Khuyến mại & Voucher:** Voucher Engine (Fixed/Percent trần, kiểm soát hạn mức lượt dùng ACID)
* **Trí tuệ nhân tạo (Agentic AI):** Google Gemini 3.1 Flash-Lite ReAct Tool Calling Loop (5 tools) + Block-Sequential UI
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

   # 3. Mã khóa bí mật JWT dùng để ký phiên đăng nhập (tạo bằng lệnh: openssl rand -base64 48)
   JWT_SECRET=""

   # 4. API Key của Google Gemini dùng cho Trợ lý Bán hàng Agentic AI (Gemini 3.1 Flash-Lite)
   GEMINI_API_KEY="your-gemini-api-key"

   # 5. Cấu hình Reverse Proxy & Rate Limiting (Môn An toàn ứng dụng Web)
   TRUST_PROXY="false" # Đặt "true" nếu triển khai phía sau Vercel / Nginx / Cloudflare
   ```

---

### 5. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu (Database Setup)
Sử dụng công cụ **Prisma ORM** để tự động tạo **17 bảng quan hệ** và nạp dữ liệu mẫu:

```bash
# Bước 5.1: Kích hoạt các Extension PostgreSQL cần thiết cho tìm kiếm tiếng Việt không dấu & fuzzy search
# Chạy trong SQL Editor của Supabase hoặc qua psql:
# CREATE EXTENSION IF NOT EXISTS unaccent;
# CREATE EXTENSION IF NOT EXISTS pg_trgm;

# Bước 5.2: Sinh bộ mã nguồn Prisma Client phù hợp với hệ thống
npx prisma generate

# Bước 5.3: Đẩy toàn bộ cấu trúc bảng (schema) lên PostgreSQL
npx prisma db push

# Bước 5.4: Nạp dữ liệu hạt giống (Seed Data ban đầu: tài khoản mẫu, danh mục, sách cơ bản, sự kiện và voucher)
npx prisma db seed
```

> **Mẹo hữu ích:** Nếu bạn muốn nạp đầy đủ kho sách thực tế 5.000+ cuốn, 2.000+ tác giả, đánh giá mẫu và các đơn hàng lịch sử thực nghiệm:
> ```bash
> # 1. Nạp toàn bộ danh mục, tác giả và 5.000+ sách:
> npx tsx prisma/seed-large-dataset.ts
> 
> # 2. Nạp dữ liệu đánh giá sách:
> npx tsx prisma/seed-reviews.ts
> 
> # 3. Nạp dữ liệu đơn hàng lịch sử & hành vi:
> npx tsx prisma/seed-historical-orders.ts
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

| Vai trò | Email | Mật khẩu | Quyền hạn Hệ thống |
|---|---|---|---|
| **Super Admin** | `admin@tosach.vn` | `Admin@123` | Toàn quyền quản trị hệ sinh thái, xem toàn bộ doanh thu shop (`VIEW_REVENUE`), quản trị khuyến mại (`MANAGE_PROMOTIONS`), quản lý nhân sự & phân quyền (`MANAGE_USERS`), xem nhật ký kiểm toán (`VIEW_AUDIT_LOG`). |
| **Nhân viên Kho** | `staff.kho@tosach.vn` | `Staff@123` | Quản lý kho sách (`MANAGE_BOOKS`) & Cây danh mục (`MANAGE_CATEGORIES`). Cảnh báo sách sắp hết tồn kho. *(Bị ẩn hoàn toàn doanh thu shop)*. |
| **Nhân viên Đơn** | `staff.order@tosach.vn` | `Staff@123` | Tiếp nhận & Xử lý đơn hàng (`MANAGE_ORDERS`), Kiểm duyệt đánh giá (`MANAGE_REVIEWS`), Xem danh sách sự kiện & voucher (`VIEW_PROMOTIONS` - Chế độ chỉ xem để hỗ trợ khách áp mã, không có nút Thêm/Sửa/Tắt/Xóa). *(Bị ẩn hoàn toàn doanh thu shop)*. |
| **Khách hàng mẫu** | `customer@gmail.com` | `User@123` | Mua sắm, áp voucher, thanh toán VietQR, gửi đánh giá sao, theo dõi đơn hàng thời gian thực. |

> 🔒 **Nguyên tắc Bảo mật Doanh thu & Quản trị Nhân sự:**  
> Theo chuẩn mực vận hành TMĐT và bảo mật tài chính, **nhân viên thông thường (Staff) tuyệt đối không được xem tổng doanh thu của shop**. Tại giao diện Dashboard Admin của tài khoản nhân viên, thẻ *"Doanh thu tháng này"* hoàn toàn bị gỡ bỏ khỏi DOM, bố cục lưới tự động co giãn từ 4 cột sang 3 cột cân đối (`grid-cols-1 md:grid-cols-3`), và API `/api/admin/dashboard/realtime` trả về `revenue: 0` cùng cờ `canViewRevenue: false`.

---

## 📂 Cấu Trúc Thư Mục
```text
to-sach-studio/
├── prisma/
│   ├── schema.prisma        # Thiết kế 17 bảng quan hệ DB & Enum chuẩn 3NF
│   └── seed.ts              # Script nạp dữ liệu mẫu tự động (kèm sự kiện & voucher)
├── data/                    # Chứa các tệp dữ liệu CSV/JSON mẫu cho script seed
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/
│   │   │   ├── auth/        # Các API đăng nhập, đăng ký, đăng xuất, phiên làm việc
│   │   │   ├── chat/        # API Trợ lý Agentic AI (ReAct 5 tools loop)
│   │   │   ├── orders/      # API Đặt hàng Prisma Transaction (ACID) & Tra cứu đơn
│   │   │   ├── promotions/  # API Kiểm tra, áp mã và quản trị Voucher
│   │   │   └── reviews/     # API tiếp nhận và duyệt đánh giá bạn đọc
│   │   ├── admin/
│   │   │   ├── books/       # Quản lý kho sách, import/export CSV
│   │   │   ├── orders/      # Quản lý đơn hàng, State Machine
│   │   │   └── promotions/  # Quản trị sự kiện khuyến mại & Voucher
│   │   ├── account/orders/  # Trang Lịch sử đơn mua & Timeline vận chuyển thời gian thực
│   │   ├── book/[slug]/     # Trang Chi tiết sách chuẩn SEO (Dynamic Route Server Component)
│   │   ├── catalog/         # Trang Danh mục sách & Bộ lọc đa chiều (3 cấp, giá, sao, NXB)
│   │   ├── cart/            # Trang Giỏ hàng tương tác, áp mã voucher & Freeship bar
│   │   ├── checkout/        # Trang Thanh toán (Áp voucher, Sổ địa chỉ 3 cấp, COD & VietQR)
│   │   ├── order/success/   # Trang Đặt hàng thành công (kèm VietQR động & sao chép STK)
│   │   ├── wishlist/        # Trang Quản lý Tủ sách yêu thích (1-Click sang giỏ hàng)
│   │   ├── auth/            # Trang Đăng nhập & Đăng ký (kèm nút test 4 vai trò)
│   │   ├── layout.tsx       # Root Layout & Typography Plus Jakarta Sans
│   │   └── page.tsx         # Trang chủ kết nối 100% dữ liệu thực tế Supabase DB
│   ├── components/          # UI Components chuẩn Design System Figma
│   │   ├── chat/            # FloatingChatbot.tsx (Block-Sequential UI, Mua ngay 1-Click)
│   │   ├── cart/            # CartClient (Áp voucher, Stepper số lượng, Freeship bar)
│   │   ├── checkout/        # CheckoutClient (Form địa chỉ 3 cấp, Voucher, COD & VietQR)
│   │   └── layout/          # CustomerHeader (Zero CLS, Mega Menu), CustomerFooter
│   ├── lib/
│   │   ├── ai-tools.ts      # 5 Công cụ nội bộ của Agentic AI Chatbot
│   │   ├── auth.ts          # Mã hóa JWT HS256 (jose) & Bcrypt password hash
│   │   ├── promotions.ts    # Động cơ kiểm tra & tính chiết khấu Voucher
│   │   └── flyToCart.ts     # Hiệu ứng ném sách vào giỏ hàng (Parabolic GPU 60fps)
│   └── proxy.ts             # Next.js 16 Edge Proxy kiểm tra quyền RBAC & chốt chặn checkout
├── Document_Project.md      # Quyển báo cáo học thuật toàn diện A-Z 12 chương (Tài liệu chính)
├── DOCS_KIEN_TRUC_SO_DO_BAO_CAO.md # Bản thiết kế kiến trúc N-tier, ERD, UML & Tiến độ 8 tuần
└── README.md
```
