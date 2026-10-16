# BẢN TỔNG HỢP TOÀN DIỆN BÁO CÁO ĐỒ ÁN TỐT NGHIỆP CÔNG NGHỆ THÔNG TIN
# ĐỀ TÀI: HỆ SINH THÁI THƯƠNG MẠI ĐIỆN TỬ SÁCH TRỰC TUYẾN "TỔ SÁCH" (B2C)

> **Cơ sở đào tạo:** Khoa Công nghệ Thông tin  
> **Chuyên ngành:** Kỹ thuật Phần mềm / Hệ thống Thông tin / Khoa học Máy tính  
> **Khẩu hiệu sản phẩm:** *"Sách về tổ, tri thức bay xa"*  
> **Nhóm tác giả thực hiện:**  
> - **Nguyễn Đăng Hanh** (Lead Developer — Kiến trúc Hệ thống, Cơ sở dữ liệu PostgreSQL, Backend API, Bảo mật RBAC, RAG AI Chatbot) — `hnhngyndng@gmail.com`  
> - **Nguyễn Mạnh Hòa** (Co-Developer — Trưởng nhóm Thiết kế UI/UX, Design System Figma, Frontend Next.js, Hiệu ứng chuyển động 60fps & Trải nghiệm người dùng) — `manhhoa02042005@gmail.com`  
> **Thời gian thực hiện:** Tháng 09/2026 — Tháng 10/2026 (Khung kế hoạch 8 tuần theo Đề cương Proposal)  

---

## MỤC LỤC TỔNG HỢP

- [CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & BÁM SÁT ĐỀ CƯƠNG PROPOSAL](#chương-1-tổng-quan-đề-tài--bám-sát-đề-cương-proposal)
  - [1.1 Tính cấp thiết và Bối cảnh thực tiễn](#11-tính-cấp-thiết-và-bối-cảnh-thực-tiễn)
  - [1.2 Mục tiêu đề tài & Sản phẩm bàn giao (Deliverables)](#12-mục-tiêu-đề-tài--sản-phẩm-bàn-giao-deliverables)
  - [1.3 Đối tượng người dùng & Định vị mô hình B2C thuần túy](#13-đối-tượng-người-dùng--định-vị-mô-hình-b2c-thuần-túy)
  - [1.4 So sánh đối sánh với các sàn TMĐT hiện hành (Tiki, Fahasa, Shopee)](#14-so-sánh-đối-sánh-với-các-sàn-tmđt-hiện-hành-tiki-fahasa-shopee)
  - [1.5 Phân công trách nhiệm thành viên nhóm](#15-phân-công-trách-nhiệm-thành-viên-nhóm)
  - [1.6 Lộ trình thực hiện 8 tuần theo mốc báo cáo](#16-lộ-trình-thực-hiện-8-tuần-theo-mốc-báo-cáo)
- [CHƯƠNG 2: NGHIÊN CỨU & LỰA CHỌN CÔNG CỤ, CÔNG NGHỆ (TECH STACK)](#chương-2-nghiên-cứu--lựa-chọn-công-cụ-công-nghệ-tech-stack)
  - [2.1 Bảng tổng hợp công nghệ toàn diện](#21-bảng-tổng-hợp-công-nghệ-toàn-diện)
  - [2.2 Phân tích tầng Trình diễn (Frontend Layer)](#22-phân-tích-tầng-trình-diễn-frontend-layer)
  - [2.3 Phân tích tầng Ứng dụng & Nghiệp vụ (Backend Layer)](#23-phân-tích-tầng-ứng-dụng--nghiệp-vụ-backend-layer)
  - [2.4 Phân tích tầng Cơ sở dữ liệu & Quản lý kết nối (Data Tier)](#24-phân-tích-tầng-cơ-sở-dữ-liệu--quản-lý-kết-nối-data-tier)
  - [2.5 Phân tích tầng Trí tuệ Nhân tạo & RAG (AI Tier)](#25-phân-tích-tầng-trí-tuệ-nhân-tạo--rag-ai-tier)
  - [2.6 Dịch vụ tích hợp bên ngoài (Integrations)](#26-dịch-vụ-tích-hợp-bên-ngoài-integrations)
- [CHƯƠNG 3: BẢN ĐỒ KIẾN TRÚC HỆ THỐNG & HẠ TẦNG TRIỂN KHAI](#chương-3-bản-đồ-kiến-trúc-hệ-thống--hạ-tầng-triển-khai)
  - [3.1 Sơ đồ Kiến trúc Phân tầng Tổng thể (N-Tier Architecture)](#31-sơ-đồ-kiến-trúc-phân-tầng-tổng-thể-n-tier-architecture)
  - [3.2 Sơ đồ Kiến trúc C4 Model — Container Diagram](#32-sơ-đồ-kiến-trúc-c4-model--container-diagram)
  - [3.3 Sơ đồ Triển khai Vật lý & Điện toán Đám mây (Deployment & Cloud Infrastructure)](#33-sơ-đồ-triển-khai-vật-lý--điện-toán-đám-mây-deployment--cloud-infrastructure)
- [CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU & TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATABASE & ERD)](#chương-4-thiết-kế-cơ-sở-dữ-liệu--từ-điển-dữ-liệu-chi-tiết-database--erd)
  - [4.1 Quy trình chuẩn hóa quan hệ bậc 3 (3NF)](#41-quy-trình-chuẩn-hóa-quan-hệ-bậc-3-3nf)
  - [4.2 Sơ đồ Thực thể Quan hệ Toàn diện (ERD 14 Thực thể)](#42-sơ-đồ-thực-thể-quan-hệ-toàn-diện-erd-14-thực-thể)
  - [4.3 Phân Tích Chuyên Sâu Chỉ Số ISBN & Từ Điển Dữ Liệu Chi Tiết 14 Bảng (Data Dictionary)](#43-phân-tích-chuyên-sâu-chỉ-số-isbn--từ-điển-dữ-liệu-chi-tiết-14-bảng-data-dictionary)
    - [4.3.1 Chỉ số ISBN trong Cơ sở dữ liệu là gì?](#431-chỉ-số-isbn-trong-cơ-sở-dữ-liệu-là-gì)
    - [4.3.2 Từ Điển Dữ Liệu Chi Tiết Từng Cột Của 14 Bảng CSDL (Field-by-Field Data Dictionary)](#432-từ-điển-dữ-liệu-chi-tiết-từng-cột-của-14-bảng-csdl-field-by-field-data-dictionary)
  - [4.4 Chiến lược Lập chỉ mục (Index Optimization Strategy)](#44-chiến-lược-lập-chỉ-mục-index-optimization-strategy)
  - [4.5 Cơ chế Giao dịch Nguyên tử (ACID Transactions) & Khóa chống Bán vượt tồn kho](#45-cơ-chế-giao-dịch-nguyên-tử-acid-transactions--khóa-chống-bán-vượt-tồn-kho)
- [CHƯƠNG 5: HỆ THỐNG SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOW DIAGRAMS - DFD)](#chương-5-hệ-thống-sơ-đồ-luồng-dữ-liệu-data-flow-diagrams---dfd)
  - [5.1 DFD Mức 0 — Sơ đồ Ngữ cảnh Toàn hệ thống (Context Diagram)](#51-dfd-mức-0--sơ-đồ-ngữ-cảnh-toàn-hệ-thống-context-diagram)
  - [5.2 DFD Mức 1 — Phân rã Chức năng Nghiệp vụ Cốt lõi](#52-dfd-mức-1--phân-rã-chức-năng-nghiệp-vụ-cốt-lõi)
  - [5.3 DFD Mức 2 — Phân rã Quy trình Đặt hàng & Xử lý Giao dịch](#53-dfd-mức-2--phân-rã-quy-trình-đặt-hàng--xử-lý-giao-dịch)
- [CHƯƠNG 6: HỆ THỐNG SƠ ĐỒ CA SỬ DỤNG (USE CASE DIAGRAMS)](#chương-6-hệ-thống-sơ-đồ-ca-sử-dụng-use-case-diagrams)
  - [6.1 Sơ đồ Ca sử dụng Tổng quan Hệ thống (System Use Case)](#61-sơ-đồ-ca-sử-dụng-tổng-quan-hệ-thống-system-use-case)
  - [6.2 Phân rã Use Case Phân hệ Khách hàng (Customer Storefront)](#62-phân-rã-use-case-phân-hệ-khách-hàng-customer-storefront)
  - [6.3 Phân rã Use Case Phân hệ Quản trị & Vận hành (Staff & Admin Portal)](#63-phân-rã-use-case-phân-hệ-quản-trị--vận-hành-staff--admin-portal)
- [CHƯƠNG 7: HỆ THỐNG SƠ ĐỒ HOẠT ĐỘNG NGHIỆP VỤ (ACTIVITY DIAGRAMS)](#chương-7-hệ-thống-sơ-đồ-hoạt-động-nghiệp-vụ-activity-diagrams)
  - [7.1 Sơ đồ Hoạt động 1: Quy trình Đặt hàng & Thanh toán (Checkout Flow)](#71-sơ-đồ-hoạt-động-1-quy-trình-đặt-hàng--thanh-toán-checkout-flow)
  - [7.2 Sơ đồ Hoạt động 2: Quy trình Xác thực & Kiểm soát Biên giới (Edge Guard Middleware & RBAC)](#72-sơ-đồ-hoạt-động-2-quy-trình-xác-thực--kiểm-soát-biên-giới-edge-guard-middleware--rbac)
  - [7.3 Sơ đồ Hoạt động 3: Quy trình Quản lý Kho sách & Nhập xuất tồn](#73-sơ-đồ-hoạt-động-3-quy-trình-quản-lý-kho-sách--nhập-xuất-tồn)
- [CHƯƠNG 8: HỆ THỐNG SƠ ĐỒ TUẦN TỰ CHI TIẾT (SEQUENCE DIAGRAMS)](#chương-8-hệ-thống-sơ-đồ-tuần-tự-chi-tiết-sequence-diagrams)
  - [8.1 Sơ đồ Tuần tự 1: Đăng nhập Hệ thống & Cấp phát HttpOnly Cookie JWT](#81-sơ-đồ-tuần-tự-1-đăng-nhập-hệ-thống--cấp-phát-httponly-cookie-jwt)
  - [8.2 Sơ đồ Tuần tự 2: Khách hàng Đặt hàng & Xử lý Transaction ACID Trừ Tồn Kho](#82-sơ-đồ-tuần-tự-2-khách-hàng-đặt-hàng--xử-lý-transaction-acid-trừ-tồn-kho)
  - [8.3 Sơ đồ Tuần tự 3: Thanh toán Tự động VietQR MBBank](#83-sơ-đồ-tuần-tự-3-thanh-toán-tự-động-vietqr-mbbank)
  - [8.4 Sơ đồ Tuần tự 4: Trợ lý AI Chatbot RAG Pipeline](#84-sơ-đồ-tuần-tự-4-trợ-lý-ai-chatbot-rag-pipeline)
  - [8.5 Sơ đồ Tuần tự 5: Cơ chế Phân quyền RBAC & Lọc Thông báo Quả chuông Động](#85-sơ-đồ-tuần-tự-5-cơ-chế-phân-quyền-rbac--lọc-thông-báo-quả-chuông-động)
  - [8.6 Sơ đồ Tuần tự 6: Cảnh báo Tồn kho Thấp (Low Stock Alert)](#86-sơ-đồ-tuần-tự-6-cảnh-báo-tồn-kho-thấp-low-stock-alert)
- [CHƯƠNG 9: HỆ THỐNG SƠ ĐỒ CHUYỂN TRẠNG THÁI (STATE MACHINE DIAGRAMS)](#chương-9-hệ-thống-sơ-đồ-chuyển-trạng-thái-state-machine-diagrams)
  - [9.1 Sơ đồ Trạng thái Đơn hàng (OrderStatus State Machine)](#91-sơ-đồ-trạng-thái-đơn-hàng-orderstatus-state-machine)
  - [9.2 Sơ đồ Trạng thái Đánh giá Độc giả (ReviewStatus State Machine)](#92-sơ-đồ-trạng-thái-đánh-giá-độc-giả-reviewstatus-state-machine)
- [CHƯƠNG 10: CẤU TRÚC THÔNG TIN, MA TRẬN PHÂN QUYỀN & BỘ CHỈ SỐ DỮ LIỆU LỚN](#chương-10-cấu-trúc-thông-tin-ma-trận-phân-quyền--bộ-chỉ-số-dữ-liệu-lớn)
  - [10.1 Sơ đồ Cấu trúc Thông tin & Điều hướng (Site Map / Information Architecture)](#101-sơ-đồ-cấu-trúc-thông-tin--điều-hướng-site-map--information-architecture)
  - [10.2 Ma trận Phân quyền Vai trò RBAC (Role-Based Access Control Matrix)](#102-ma-trận-phân-quyền-vai-trò-rbac-role-based-access-control-matrix)
  - [10.3 Bộ Chỉ số Dữ liệu Thực nghiệm (Big Data & Seed Metrics)](#103-bộ-chỉ-số-dữ-liệu-thực-nghiệm-big-data--seed-metrics)
- [CHƯƠNG 11: KẾ HOẠCH BẢO VỆ ĐỒ ÁN & BỘ CÂU HỎI PHẢN BIỆN CHUYÊN SÂU (DEFENSE GUIDE)](#chương-11-kế-hoạch-bảo-vệ-đồ-án--bộ-câu-hỏi-phản-biện-chuyên-sâu-defense-guide)
  - [11.1 Kịch bản Demo 15 Phút Chuẩn Mực Trước Hội Đồng](#111-kịch-bản-demo-15-phút-chuẩn-mực-trước-hội-đồng)
  - [11.2 Bộ 10 Câu hỏi Phản biện Trọng điểm & Câu trả lời Mẫu Đạt Điểm Tuyệt Đối](#112-bộ-10-câu-hỏi-phản-biện-trọng-điểm--câu-trả-lời-mẫu-đạt-điểm-tuyệt-đối)
  - [11.3 Kết luận & Định hướng Phát triển](#113-kết-luận--định-hướng-phát-triển)
- [CHƯƠNG 12: TỔNG KẾT TOÀN DIỆN DỰ ÁN TỪ ĐẦU ĐẾN CUỐI (A - Z) DÀNH CHO 2 THÀNH VIÊN ÔN TẬP VÀ BÁO CÁO](#chương-12-tổng-kết-toàn-diện-dự-án-từ-đầu-đến-cuối-a---z-dành-cho-2-thành-viên-ôn-tập-và-báo-cáo)
  - [12.1 Bức Tranh Toàn Cảnh: Dự Án "Tổ Sách" Đã Làm Được Những Gì?](#121-bức-tranh-toàn-cảnh-dự-án-tổ-sách-đã-làm-được-những-gì)
  - [12.2 Hành Trình Phát Triển 8 Giai Đoạn Từ Đầu Đến Cuối](#122-hành-trình-phát-triển-8-giai-đoạn-từ-đầu-đến-cuối)
  - [12.3 Phân Công Vai Trò Cụ Thể Của 2 Thành Viên Khi Đi Báo Cáo](#123-phân-công-vai-trò-cụ-thể-của-2-thành-viên-khi-đi-báo-cáo)
  - [12.4 Checklist 5 Bước Demo Chuẩn Điểm Cao Trước Hội Đồng](#124-checklist-5-bước-demo-chuẩn-điểm-cao-trước-hội-đồng)

---

# CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & BÁM SÁT ĐỀ CƯƠNG PROPOSAL

## 1.1 Tính cấp thiết và Bối cảnh thực tiễn
Trong xu hướng chuyển đổi số mạnh mẽ của ngành xuất bản và văn hóa đọc tại Việt Nam:
1. **Vấn nạn sách giả, sách lậu trên các sàn C2C tự do:** Người mua sách trên các nền tảng mở thường xuyên gặp phải sách scan, in lậu chất lượng giấy tồi tệ, sai lệch bản dịch và không được bảo đảm quyền lợi bản quyền từ các NXB uy tín (NXB Trẻ, Kim Đồng, Nhã Nam...).
2. **Trải nghiệm mua sách trực tuyến truyền thống khô cứng:** Hầu hết các website bán sách hiện nay có giao diện cũ kỹ, điều hướng phân cấp nông, tốc độ tải trang chậm, thiếu khả năng tư vấn theo cảm xúc và sở thích của độc giả.
3. **Thách thức quản trị kho vận và bảo mật:** Việc kiểm soát tồn kho đa danh mục, phân quyền nhân sự rõ ràng giữa các bộ phận (kho, duyệt đơn, CSKH) và ngăn chặn việc bán vượt tồn kho (over-selling) đòi hỏi một kiến trúc kỹ thuật hiện đại, chuẩn hóa.

Đề tài **"Tổ Sách"** được nghiên cứu và hiện thực hóa nhằm xây dựng một hệ sinh thái thương mại điện tử chuyên sâu cho thị trường sách, kết hợp giao diện thẩm mỹ cao, quản trị kho vận nghiêm ngặt và tích hợp Trí tuệ Nhân tạo thế hệ mới (AI RAG) trợ giúp độc giả tìm kiếm tri thức.

## 1.2 Mục tiêu đề tài & Sản phẩm bàn giao (Deliverables)
Bám sát mục tiêu đã cam kết trong Đề cương Đồ án (Proposal), hệ thống hoàn thành trọn vẹn các sản phẩm bàn giao:
- **Hệ thống Web Storefront Khách hàng:** Giao diện mua sắm thẩm mỹ cao, tốc độ render 60fps, chuẩn SEO với Server-Side Rendering (SSR), hỗ trợ tìm kiếm toàn văn, lọc đa chiều, tủ sách yêu thích, giỏ hàng và thanh toán VietQR tự động.
- **Hệ thống Web Admin Portal Vận hành:** Trang quản trị nghiệp vụ toàn diện: Dashboard doanh thu thời gian thực, CRUD đầu sách & nhập kho hàng loạt, quản lý vòng đời đơn hàng theo State Machine, kiểm duyệt đánh giá, và phân quyền động RBAC độc lập cho nhân viên.
- **Hệ thống Trợ lý Ảo AI Chatbot (RAG Engine):** Tích hợp Google Gemini (dòng Flash-Lite) kết hợp truy xuất CSDL PostgreSQL, giải đáp 14 miền nghiệp vụ thương hiệu, CSKH, chính sách đổi trả và gợi ý sách theo cảm xúc người đọc.
- **Bộ Cơ sở Dữ liệu Quy mô Lớn (Big Data Benchmark):** Nạp và vận hành ổn định trên 5.100 đầu sách thật, 2.700 tác giả, 160 danh mục phân cấp DDC, sẵn sàng xử lý hàng chục nghìn đơn hàng và lượt đánh giá.

## 1.3 Đối tượng người dùng & Định vị mô hình B2C thuần túy
Hệ sinh thái **Tổ Sách** phục vụ 3 nhóm đối tượng người dùng chính:
1. **Khách hàng (Độc giả - Customer):** Người yêu sách, học sinh, sinh viên, nhà nghiên cứu có nhu cầu tìm mua sách thật 100% nguyên seal, tra cứu danh mục học thuật chuẩn và nhận tư vấn đọc sách thông minh.
2. **Nhân viên vận hành (Staff):**
   - *Nhân viên kho (Warehouse Staff):* Quản lý nhập/xuất kho, cập nhật số lượng tồn, theo dõi cảnh báo sách sắp hết hàng (`stockQty < 10`).
   - *Nhân viên xử lý đơn (Order Staff):* Kiểm tra đơn hàng mới, duyệt đóng gói, bàn giao vận chuyển, xử lý đánh giá của khách hàng.
3. **Quản trị viên cấp cao (Super Admin):** Ban giám đốc, chủ doanh nghiệp: Toàn quyền hệ thống, theo dõi báo cáo doanh thu tài chính, cấp tài khoản nhân viên, phân quyền động RBAC và kiểm tra nhật ký kiểm toán (Audit Logs).

**Lý do lựa chọn mô hình B2C (Business-to-Consumer) thay vì C2C:**
- **Kiểm soát chất lượng 100%:** Tổ Sách là đơn vị nhập trực tiếp từ NXB và lưu kho, bảo đảm tuyệt đối nguồn gốc chính hãng và chính sách đóng gói 3 lớp chống sốc, tặng bookmark độc quyền.
- **Tập trung chiều sâu kỹ thuật:** Tránh phân tán nguồn lực vào các bài toán ví điện tử trung gian đa người bán (escrow multi-vendor) để tập trung giải quyết các bài toán công nghệ chuyên sâu: Transaction ACID kiểm soát kho, Phân quyền RBAC động, và RAG AI Chatbot.

## 1.4 So sánh đối sánh với các sàn TMĐT hiện hành (Tiki, Fahasa, Shopee)

| Tiêu chí So sánh | Shopee / Sàn C2C | Fahasa Online | Tiki Trading | **Tổ Sách (Dự án)** |
| :--- | :--- | :--- | :--- | :--- |
| **Mô hình vận hành** | Đa người bán (C2C/B2C) | B2C Chuỗi nhà sách | B2C & Marketplace | **B2C Thuần túy chuyên biệt** |
| **Cam kết bản quyền** | Khó kiểm soát, nhiều sách lậu | 100% Sách thật | Tương đối tốt | **100% Bản quyền NXB chính quy** |
| **Hệ thống tư vấn AI** | Chatbot rule-based cứng nhắc | Chatbot kịch bản cơ bản | Gợi ý thuật toán matrix | **Google Gemini RAG + 14 Miền CSKH** |
| **Phân quyền nội bộ** | Phức tạp, cồng kềnh | Đóng kín nội bộ ERP | Đóng kín nội bộ ERP | **RBAC Động đa cấp bậc + Quả chuông ngữ cảnh** |
| **Tốc độ & Công nghệ** | PHP / React cũ | Magento cũ, tải chậm | Next.js kết hợp Microservices | **Next.js 16 App Router + RSC + Tailwind v4** |
| **Chính sách đổi trả** | 3 - 7 ngày, quy trình phức tạp | Đổi tại cửa hàng | Đổi qua bưu cục | **1 đổi 1 trong 7 ngày, hỗ trợ đồng kiểm 100%** |

## 1.5 Phân công trách nhiệm thành viên nhóm

```
+---------------------------------------------------------------------------------+
|                                 NHÓM ĐỀ TÀI TỔ SÁCH                             |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [1] NGUYỄN ĐĂNG HANH (Lead Developer)                                          |
|      - Email: hnhngyndng@gmail.com                                              |
|      - Vai trò: Kiến trúc Hệ thống, Cơ sở Dữ liệu & Bảo mật                     |
|      - Nhiệm vụ cụ thể:                                                         |
|        * Thiết kế chuẩn hóa CSDL quan hệ 3NF (14 bảng PostgreSQL Supabase/Neon) |
|        * Xây dựng kiến trúc Backend API Route Handlers, Server Actions          |
|        * Hiện thực hóa Giao dịch ACID chống Over-selling (Prisma $transaction)  |
|        * Xây dựng hệ thống bảo mật Stateless JWT, HttpOnly Cookies, Edge Proxy  |
|        * Triển khai ma trận phân quyền RBAC và Bộ lọc quả chuông thông báo      |
|        * Tích hợp AI Chatbot RAG Pipeline kết hợp Google Gemini Flash-Lite      |
|                                                                                 |
|  [2] NGUYỄN MẠNH HÒA (Co-Developer)                                             |
|      - Email: manhhoa02042005@gmail.com                                         |
|      - Vai trò: Trưởng nhóm Thiết kế UI/UX & Phát triển Frontend                |
|      - Nhiệm vụ cụ thể:                                                         |
|        * Nghiên cứu trải nghiệm người dùng, xây dựng Figma Design System        |
|        * Hiện thực hóa giao diện Storefront & Admin Portal đạt 60fps            |
|        * Tối ưu hóa chuẩn Typography Plus Jakarta Sans hỗ trợ tiếng Việt        |
|        * Triệt tiêu xô lệch layout (Zero Cumulative Layout Shift - CLS)         |
|        * Thiết kế component Floating Chatbot bong bóng chat, animation mở đóng  |
|        * Xây dựng giao diện responsive đa thiết bị (Mobile, Tablet, Desktop)    |
+---------------------------------------------------------------------------------+
```

## 1.6 Lộ trình thực hiện 8 tuần theo mốc báo cáo

```mermaid
gantt
    title LỘ TRÌNH 8 TUẦN THỰC HIỆN ĐỒ ÁN THEO PROPOSAL
    dateFormat  YYYY-MM-DD
    section Chặng 1: Khởi động & UI
    Tuần 1 (Figma, Setup Next.js, Prisma schema, DB Supabase)    :done, w1, 2026-09-07, 2026-09-13
    Tuần 2 (Storefront Layout, Plus Jakarta Sans, Logo, Wishlist):done, w2, 2026-09-14, 2026-09-20
    Mốc Báo Cáo 1 (Nghiệm thu Giao diện & Schema)                :milestone, m1, 2026-09-20, 0d
    section Chặng 2: Nghiệp vụ Catalog & Giỏ hàng
    Tuần 3 (Catalog 3 cấp, Bộ lọc đa chiều, Chi tiết sách SEO)  :done, w3, 2026-09-21, 2026-09-27
    Tuần 4 (Giỏ hàng, Checkout ACID, VietQR MBBank, Email OTP)   :done, w4, 2026-09-28, 2026-10-04
    Mốc Báo Cáo 2 (Nghiệm thu Mua hàng & Giao dịch)              :milestone, m2, 2026-10-04, 0d
    section Chặng 3: Phân hệ Quản trị & Bảo mật
    Tuần 5 (Admin Dashboard, CRUD Sách, Nhập kho hàng loạt)      :done, w5, 2026-10-05, 2026-10-11
    Tuần 6 (Quản lý Đơn hàng State Machine, RBAC & Chuông báo)   :done, w6, 2026-10-12, 2026-10-18
    Mốc Báo Cáo 3 (Nghiệm thu Phân hệ Quản trị & RBAC)           :milestone, m3, 2026-10-18, 0d
    section Chặng 4: AI RAG, Tối ưu & Nghiệm thu
    Tuần 7 (AI Chatbot Gemini RAG, Local Fallback 14 Miền CSKH)  :active, w7, 2026-10-19, 2026-10-25
    Tuần 8 (Triển khai Production Cloud, Báo cáo A4 & Slide Q&A) :w8, 2026-10-26, 2026-10-30
    Mốc Báo Cáo 4 (Bảo Vệ Đồ Án Trước Hội Đồng)                  :milestone, m4, 2026-10-30, 0d
```

---

# CHƯƠNG 2: NGHIÊN CỨU & LỰA CHỌN CÔNG CỤ, CÔNG NGHỆ (TECH STACK)

## 2.1 Bảng tổng hợp công nghệ toàn diện

| Phân tầng kỹ thuật | Công nghệ lựa chọn | Phiên bản | Vai trò & Lý do kỹ thuật bảo vệ đồ án |
| :--- | :--- | :--- | :--- |
| **Core Web Framework** | **Next.js (App Router)** | 16.0 / 15.x | Kiến trúc React Server Components (RSC) kết xuất HTML phía server, tối ưu SEO vượt trội, giảm kích thước JavaScript nạp vào trình duyệt. |
| **UI Library** | **React** | 19.x | Hỗ trợ Actions, Transitions, Hooks bất đồng bộ thế hệ mới (`useActionState`, `useOptimistic`). |
| **Ngôn ngữ phát triển** | **TypeScript** | 5.x | Chặt chẽ kiểu dữ liệu từ DB đến UI (End-to-End Type Safety), phát hiện lỗi lúc biên dịch, nâng cao độ tin cậy của mã nguồn. |
| **CSS & Design System** | **Tailwind CSS v4** | 4.0 | Công cụ biên dịch CSS thế hệ mới không cần file cấu hình rườm rà, tối ưu hóa kích thước CSS tĩnh, hiệu ứng 60fps mượt mà. |
| **Typography Tiếng Việt** | **Plus Jakarta Sans** | Google Fonts | Kiểu chữ hình học hiện đại, hỗ trợ hoàn hảo bộ ký tự dấu tiếng Việt, mang lại trải nghiệm đọc sách cao cấp. |
| **Cơ sở dữ liệu Quan hệ** | **PostgreSQL** | 15.x / 16.x | Hệ quản trị CSDL chuẩn ACID, hỗ trợ JSONB, RLS, phân cấp dữ liệu lớn, triển khai trên nền tảng Supabase AWS Singapore & Neon. |
| **ORM & Data Modeling** | **Prisma ORM** | 6.x | Schema-first ORM tự động đồng bộ Migration, Type-safe client, ngăn chặn triệt để tấn công SQL Injection. |
| **Connection Pooling** | **PgBouncer** | Cổng 6543 | Quản lý kết nối chế độ Transaction Mode, cho phép hàng nghìn người dùng truy cập đồng thời mà không nghẽn connection pool. |
| **Xác thực & Bảo mật** | **JWT + HttpOnly Cookie** | `jose` 5.x | Xác thực phi trạng thái (Stateless), lưu trữ token trong cookie HttpOnly chống hoàn toàn tấn công đánh cắp phiên qua JavaScript (XSS). |
| **Băm mật khẩu** | **BcryptJS** | 2.4.x | Thuật toán băm mật khẩu chuẩn công nghiệp với Salt 10 vòng, chống tấn công dò quét từ điển (Rainbow table). |
| **Bảo vệ biên giới** | **Next.js Middleware/Proxy**| Built-in | Chặn lọc các request trái phép ngay tại rìa mạng (Edge) trước khi chạm tới Server Components và DB. |
| **Trí tuệ Nhân tạo (LLM)** | **Google Gemini Flash-Lite** | 3.1 / 3.5 | Mô hình AI ngôn ngữ lớn siêu nhẹ, thời gian phản hồi ~1s - 2s, hỗ trợ tiếng Việt tự nhiên, tiết kiệm token tối đa. |
| **Kiến trúc AI** | **RAG + Local Fallback** | 14 Miền CSKH | Kết hợp truy xuất CSDL PostgreSQL thời gian thực và tầng tri thức nội bộ 14 chính sách, tự phục hồi khi hết quota bên ngoài. |
| **Dịch vụ Email** | **Nodemailer SMTP** | 6.x | Gửi mã OTP xác thực và hóa đơn đặt hàng với giao diện HTML thương hiệu, nhúng Inline Logo Tổ Sách. |
| **Cổng thanh toán** | **VietQR MBBank 24/7** | Chuẩn NAPAS | Tự động sinh mã QR động kèm mã đơn hàng và số tiền chính xác, xác nhận đơn chuyển khoản thuận tiện. |
| **Hạ tầng Triển khai** | **Vercel Cloud Edge** | Production | Mạng lưới CDN toàn cầu, tự động triển khai liên tục qua GitHub (CI/CD Pipeline), độ trễ cực thấp. |

## 2.2 Phân tích tầng Trình diễn (Frontend Layer)
- **Mô hình Hybrid Rendering:** Trang chủ (`/`), Trang danh mục (`/catalog`), Trang chi tiết sách (`/book/[slug]`) được cấu hình render Server Components (RSC) kết hợp ISR/SSR. Nhờ đó, bot tìm kiếm của Google có thể đọc được 100% dữ liệu sách, thẻ Meta, và JSON-LD Schema (`schema.org/Product`), giúp điểm số Google Lighthouse SEO đạt 98-100 điểm.
- **Client Components tương tác cao:** Giỏ hàng (`/cart`), Thanh toán (`/checkout`), Quản lý tài khoản (`/account`), Floating Chatbot (`FloatingChatbot.tsx`) và Admin Dashboard sử dụng Client Components với React Hooks (`useState`, `useEffect`, `useContext`) để mang lại trải nghiệm phản hồi tức thì mà không cần tải lại trang.
- **Triệt tiêu xô lệch bố cục (Zero Cumulative Layout Shift - CLS):** Khung tài khoản trên CustomerHeader được cố định kích thước `w-[125px] sm:w-[145px]` để khi chuyển đổi trạng thái giữa Khách vãng lai và Thành viên đăng nhập, toàn bộ thanh Header không bị giật hay đẩy vị trí.

## 2.3 Phân tích tầng Ứng dụng & Nghiệp vụ (Backend Layer)
- **API Route Handlers hiện đại:** Toàn bộ các API được tổ chức theo cấu trúc App Router chuẩn RESTful tại `src/app/api/...`:
  - `/api/auth/register`, `/api/auth/login`, `/api/auth/verify-otp`, `/api/auth/logout`: Xử lý xác thực.
  - `/api/orders`: Tiếp nhận đơn hàng, mở Transaction kiểm tra kho.
  - `/api/chat`: Điểm chạm AI Chatbot phân tích ý định, truy vấn DB và gọi mô hình Gemini.
  - `/api/admin/...`: Các API quản trị được bảo vệ bởi middleware phân quyền.
- **Server Actions:** Thực hiện các tác vụ mutation biểu mẫu nhanh chóng, tự động tái xác thực cache trang (`revalidatePath`).

## 2.4 Phân tích tầng Cơ sở dữ liệu & Quản lý kết nối (Data Tier)
- **Cơ chế Dual Connection Strings:**
  - `DATABASE_URL`: Kết nối qua PgBouncer tại cổng `6543` với tham số `pgbouncer=true`. Được sử dụng cho toàn bộ các truy vấn runtime hàng ngày của ứng dụng để tái sử dụng connection pool.
  - `DIRECT_URL`: Kết nối trực tiếp vào PostgreSQL engine tại cổng `5432`. Được sử dụng riêng cho công cụ Prisma CLI khi thực thi lệnh di chuyển cấu trúc (`prisma migrate deploy`) hoặc nạp dữ liệu lớn (`prisma db seed`).

## 2.5 Phân tích tầng Trí tuệ Nhân tạo & RAG (AI Tier)
- Khắc phục triệt để nhược điểm "ảo giác" (hallucination) của LLM truyền thống bằng quy trình RAG 3 bước:
  1. **Bước 1 — Nhận diện & Trích xuất:** Phân tích ý định câu hỏi (hỏi tác phẩm, hỏi tâm trạng, hỏi chính sách giao hàng hay hỏi khiếu nại).
  2. **Bước 2 — Truy vấn dữ liệu thực tế (Retrieval):** Tìm kiếm các đầu sách có liên quan trực tiếp từ bảng `books` trong PostgreSQL (lọc theo danh mục, giá bán, rating, và bắt buộc `coverUrl` hợp lệ).
  3. **Bước 3 — Bơm ngữ cảnh (Augmentation & Generation):** Bơm thông tin sách thật và chính sách Tổ Sách vào System Prompt, yêu cầu mô hình Gemini Flash-Lite sinh lời thoại tư vấn kèm thẻ sách động.

## 2.6 Dịch vụ tích hợp bên ngoài (Integrations)
- **VietQR:** Sinh mã QR chuẩn EMVCo gắn sẵn số tài khoản MBBank, tên người thụ hưởng và nội dung chuyển khoản chuẩn hóa `TS-YYYYMMDD-XXXX`.
- **Gmail SMTP:** Máy chủ gửi mail tự động của Google với mật khẩu ứng dụng (App Password) 16 ký tự, bảo đảm tỷ lệ vào hộp thư Inbox 99.9%.

---

# CHƯƠNG 3: BẢN ĐỒ KIẾN TRÚC HỆ THỐNG & HẠ TẦNG TRIỂN KHAI

## 3.1 Sơ đồ Kiến trúc Phân tầng Tổng thể (N-Tier Architecture)

```mermaid
graph TD
    subgraph PresentationTier["1. TẦNG TRÌNH DIỄN (Client / UI Layer)"]
        Browser["Trình duyệt Web (Desktop / Tablet / Mobile)"]
        UI_Customer["Giao diện Độc giả (Storefront: Catalog, Cart, Book Detail, Wishlist)"]
        UI_Admin["Giao diện Quản trị (Admin Portal: Dashboard, Books, Orders, Staff, Reviews)"]
        UI_Chatbot["Widget Trợ lý AI Nổi (Floating Chatbot 60fps)"]
        Browser --> UI_Customer
        Browser --> UI_Admin
        Browser --> UI_Chatbot
    end

    subgraph SecurityGateway["2. TẦNG BẢO MẬT BIÊN GIỚI (Edge Middleware & Proxy)"]
        EdgeProxy["Next.js Proxy / Middleware (Edge Runtime)"]
        JWTValidator{"Xác thực Cookie tosach_token (jose HS256)"}
        RoleGuard{"Kiểm tra Quyền (SUPER_ADMIN / STAFF / USER)"}
        
        EdgeProxy --> JWTValidator
        JWTValidator -->|Không hợp lệ / Hết hạn| RedirectLogin["Chuyển hướng /auth"]
        JWTValidator -->|Hợp lệ| RoleGuard
        RoleGuard -->|Không đủ thẩm quyền| Block403["Chặn 403 Forbidden / Redirect Home"]
    end

    subgraph ApplicationTier["3. TẦNG ỨNG DỤNG & NGHIỆP VỤ (Next.js Server Layer)"]
        RSC["React Server Components (SSR / Tối ưu SEO)"]
        API_Routes["REST API Route Handlers (/api/*)"]
        AuthService["Dịch vụ Xác thực & Mã hóa (Bcrypt + JWT)"]
        OrderService["Dịch vụ Giao dịch Đơn hàng (ACID Transactions)"]
        RAGService["Dịch vụ Trợ lý AI (Intent Classifier + Prompt Builder)"]
        EmailService["Dịch vụ Email Thông báo (Nodemailer HTML Template)"]
        
        API_Routes --> AuthService
        API_Routes --> OrderService
        API_Routes --> RAGService
        API_Routes --> EmailService
    end

    subgraph DataTier["4. TẦNG DỮ LIỆU & DỊCH VỤ NGOÀI (Data & External Services)"]
        PrismaORM["Prisma ORM 6 (Type-safe Query Engine)"]
        PgBouncer["Connection Pooler PgBouncer (Port 6543)"]
        PostgreSQL[("PostgreSQL Database (14 Tables chuẩn 3NF)")]
        GoogleAI["Google AI Studio (Gemini Flash-Lite API)"]
        VietQR["Hệ thống Sinh mã VietQR (MBBank 24/7)"]
        SMTP_Server["Google Gmail SMTP Server"]
        
        PrismaORM --> PgBouncer
        PgBouncer --> PostgreSQL
        RAGService --> GoogleAI
        OrderService --> VietQR
        EmailService --> SMTP_Server
    end

    PresentationTier -->|Gửi Request HTTPS kèm HttpOnly Cookie| SecurityGateway
    RoleGuard -->|Ủy quyền thành công| ApplicationTier
    ApplicationTier --> PrismaORM
    RAGService -.->|Truy vấn kho sách thực tế| PrismaORM
```

## 3.2 Sơ đồ Kiến trúc C4 Model — Container Diagram

```mermaid
graph TB
    Person_Customer["Khách Hàng / Độc Giả<br/>[Person]"]
    Person_Staff["Nhân Viên Vận Hành (Kho / Đơn)<br/>[Person]"]
    Person_Admin["Quản Trị Viên (Super Admin)<br/>[Person]"]

    subgraph ToSachSystem["HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TỔ SÁCH [Software System]"]
        SPA["Single Page / Server-Rendered App<br/>[Container: Next.js 16, React 19, TypeScript]<br/>Cung cấp giao diện mua hàng và bảng điều khiển quản trị"]
        API["Backend API & Server Actions<br/>[Container: Node.js 20, Next.js Server]<br/>Xử lý logic mua hàng, xác thực, phân quyền và AI RAG"]
        Database[("Cơ sở Dữ liệu Quan hệ<br/>[Container: PostgreSQL 15 via Supabase]<br/>Lưu trữ 14 bảng: Sách, Người dùng, Đơn hàng, Đánh giá, Quyền hạn")]
    end

    External_Gemini["Google Gemini AI API<br/>[External System]<br/>Mô hình ngôn ngữ phục vụ trợ lý ảo thông minh"]
    External_VietQR["Cổng Thanh toán VietQR<br/>[External System]<br/>Sinh mã QR thanh toán ngân hàng tự động"]
    External_Gmail["Dịch vụ Gmail SMTP<br/>[External System]<br/>Gửi mã OTP xác minh và thông báo đơn hàng"]

    Person_Customer -->|Duyệt sách, Mua hàng, Chatbot qua HTTPS| SPA
    Person_Staff -->|Cập nhật kho, Duyệt đơn qua HTTPS| SPA
    Person_Admin -->|Quản trị toàn quyền, Phân quyền qua HTTPS| SPA

    SPA -->|Gọi Server Actions & API Routes| API
    API -->|Truy vấn dữ liệu qua Prisma ORM / SQL| Database
    API -->|Gửi Prompt nạp ngữ cảnh RAG| External_Gemini
    API -->|Sinh chuỗi mã QR thanh toán| External_VietQR
    API -->|Gửi email OTP xác thực| External_Gmail
```

## 3.3 Sơ đồ Triển khai Vật lý & Điện toán Đám mây (Deployment & Cloud Infrastructure)

```mermaid
graph LR
    subgraph ClientEnvironments["MÔI TRƯỜNG NGƯỜI DÙNG"]
        PC["Trình duyệt Desktop (Chrome/Edge/Safari)"]
        Mobile["Trình duyệt Thiết bị Di động (iOS/Android)"]
    end

    subgraph VercelEdgeCloud["HẠ TẦNG VERCEL GLOBAL CLOUD (USA & Asia Edge)"]
        DNS["Vercel Anycast DNS & Edge Network"]
        EdgeMiddleware["Vercel Edge Middleware (Node.js/V8 Isolate)"]
        ServerlessApp["Next.js Serverless Functions (Node.js 20.x Runtime)"]
        StaticAssets["Static File CDN (Ảnh SVG, Fonts Plus Jakarta Sans)"]
        
        DNS --> EdgeMiddleware
        EdgeMiddleware --> ServerlessApp
        EdgeMiddleware --> StaticAssets
    end

    subgraph SupabaseCloud["HẠ TẦNG CƠ SỞ DỮ LIỆU (AWS Singapore ap-southeast-1)"]
        LB["Network Load Balancer (IPv4)"]
        PgBouncerInstance["PgBouncer Pooler (Max 100 Clients, Port 6543)"]
        PostgresEngine[("PostgreSQL 15 Dedicated Engine<br/>- 14 Bảng Quan hệ<br/>- Row Level Security (RLS)<br/>- B-Tree Indexes<br/>- Dung lượng 500MB+")]
        
        LB --> PgBouncerInstance
        PgBouncerInstance --> PostgresEngine
    end

    subgraph ThirdPartyCloud["DỊCH VỤ SAAS BÊN NGOÀI"]
        GoogleGenAI["Google Cloud AI Studio (Gemini API)"]
        GoogleMail["Google SMTP Relay (smtp.gmail.com:465)"]
    end

    PC -->|TLS 1.3 / HTTPS| DNS
    Mobile -->|TLS 1.3 / HTTPS| DNS
    ServerlessApp -->|SSL Encrypted SQL Query| LB
    ServerlessApp -->|"REST HTTPS (API Key)"| GoogleGenAI
    ServerlessApp -->|"SMTPS (SSL App Password)"| GoogleMail
```

---

# CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU & TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATABASE & ERD)

## 4.1 Quy trình chuẩn hóa quan hệ bậc 3 (3NF)
Cơ sở dữ liệu được thiết kế tuân thủ nghiêm ngặt các nguyên tắc chuẩn hóa:
1. **Chuẩn 1NF (Đơn trị):** Mọi thuộc tính trong bảng đều là giá trị nguyên tử (atomic). Các quan hệ Nhiều-Nhiều như Sách - Tác giả (`book_authors`) và Sách - Thể loại (`book_categories`) được tách thành bảng trung gian riêng biệt, không lưu mảng chuỗi gộp.
2. **Chuẩn 2NF (Phụ thuộc hàm đầy đủ):** Mọi thuộc tính không khóa đều phụ thuộc vào toàn bộ khóa chính, loại bỏ phụ thuộc vào một phần khóa chính tổng hợp.
3. **Chuẩn 3NF (Không bắc cầu):** Mọi thuộc tính không khóa không phụ thuộc bắc cầu vào khóa chính. Ví dụ: Bảng `orders` chỉ lưu thông tin tổng quan, chi tiết từng sản phẩm tại thời điểm mua được lưu trong `order_items` để tránh trùng lặp khi giá sách thay đổi trong tương lai.

## 4.2 Sơ đồ Thực thể Quan hệ Toàn diện (ERD 14 Thực thể)

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : "has_profile (1-1)"
    USER ||--o{ ORDER : "places (1-N)"
    USER ||--o{ REVIEW : "writes (1-N)"
    USER ||--o{ STAFF_PERMISSION : "staff_holds (1-N)"
    USER ||--o{ STAFF_PERMISSION : "assigned_by (1-N)"
    USER ||--o{ AUDIT_LOG : "executes (1-N)"
    USER ||--o{ BEHAVIOR_EVENT : "triggers (1-N)"

    PERMISSION ||--o{ STAFF_PERMISSION : "granted_to (1-N)"

    CATEGORY ||--o{ CATEGORY : "parent_children (1-N)"
    CATEGORY ||--o{ BOOK_CATEGORY : "categorizes (1-N)"

    AUTHOR ||--o{ BOOK_AUTHOR : "authors (1-N)"

    BOOK ||--o{ BOOK_AUTHOR : "written_by (1-N)"
    BOOK ||--o{ BOOK_CATEGORY : "belongs_to (1-N)"
    BOOK ||--o{ ORDER_ITEM : "included_in (1-N)"
    BOOK ||--o{ REVIEW : "reviewed_in (1-N)"
    BOOK ||--o{ BEHAVIOR_EVENT : "targeted_in (1-N)"

    ORDER ||--o{ ORDER_ITEM : "contains_items (1-N)"

    USER {
        string id PK "cuid/uuid"
        string email UK "Địa chỉ email"
        string password_hash "Mã băm Bcrypt 10 vòng"
        string full_name "Họ và tên"
        string phone UK "Số điện thoại"
        enum role "USER | STAFF | SUPER_ADMIN"
        enum status "ACTIVE | BANNED | UNVERIFIED"
        datetime created_at "Thời gian tạo"
        datetime updated_at "Thời gian cập nhật"
    }

    USER_PROFILE {
        string id PK "cuid/uuid"
        string user_id FK,UK "Liên kết users.id"
        string address_province "Tỉnh / Thành phố"
        string address_district "Quận / Huyện"
        string address_ward "Phường / Xã"
        string address_detail "Địa chỉ số nhà, ngõ ngách"
        string[] preferred_genres "Mảng thể loại yêu thích"
        string reading_level "Cấp độ độc giả"
    }

    PERMISSION {
        string id PK "cuid/uuid"
        string code UK "MANAGE_BOOKS | MANAGE_ORDERS..."
        string name "Tên quyền hiển thị"
        string description "Mô tả chi tiết thẩm quyền"
    }

    STAFF_PERMISSION {
        string id PK "cuid/uuid"
        string staff_id FK "Liên kết users.id (nhân viên)"
        string permission_id FK "Liên kết permissions.id"
        string assigned_by_id FK "Liên kết users.id (người gán)"
        datetime assigned_at "Thời điểm cấp quyền"
    }

    CATEGORY {
        string id PK "cuid/uuid"
        string parent_id FK "Khóa ngoại tự tham chiếu"
        string name "Tên thể loại (VD: Văn học)"
        string slug UK "Đường dẫn SEO"
        int level "1: Ngành hàng, 2: Chuyên mục, 3: Chi tiết"
        int sort_order "Thứ tự sắp xếp"
    }

    AUTHOR {
        string id PK "cuid/uuid"
        string name "Họ tên tác giả"
        string slug UK "Đường dẫn SEO"
        string bio "Tiểu sử tác giả"
    }

    BOOK {
        string id PK "cuid/uuid"
        string isbn UK "Mã ISBN-10 / ISBN-13"
        string title "Tên sách xuất bản"
        string slug UK "Đường dẫn SEO chi tiết"
        string publisher "Nhà xuất bản"
        int publication_year "Năm xuất bản"
        int pages "Số trang"
        string cover_type "Bìa mềm / Bìa cứng"
        int price "Giá bán hiện tại (VNĐ)"
        int original_price "Giá bìa niêm yết (VNĐ)"
        int stock_qty "Số lượng tồn kho thực tế"
        int sold_count "Tổng số lượng đã bán"
        float avg_rating "Điểm đánh giá trung bình"
        int rating_count "Tổng số lượt đánh giá"
        string cover_url "Đường dẫn ảnh bìa CDN"
        boolean is_active "Trạng thái mở bán"
        boolean is_bestseller "Cờ sách bán chạy"
        boolean is_new "Cờ sách mới phát hành"
    }

    BOOK_AUTHOR {
        string book_id PK,FK "Liên kết books.id"
        string author_id PK,FK "Liên kết authors.id"
    }

    BOOK_CATEGORY {
        string book_id PK,FK "Liên kết books.id"
        string category_id PK,FK "Liên kết categories.id"
    }

    ORDER {
        string id PK "cuid/uuid"
        string order_code UK "TS-YYYYMMDD-XXXX"
        string user_id FK "Liên kết users.id"
        string customer_name "Họ tên người nhận"
        string customer_phone "Số điện thoại nhận"
        string shipping_address "Địa chỉ giao hàng đầy đủ"
        int subtotal "Tiền sách (VNĐ)"
        int shipping_fee "Phí giao hàng (VNĐ)"
        int total_amount "Tổng thanh toán (VNĐ)"
        enum payment_method "COD | BANK_TRANSFER"
        enum payment_status "PENDING | PAID | FAILED"
        enum status "PENDING | CONFIRMED | SHIPPING | DELIVERED | CANCELLED"
        datetime created_at "Thời gian đặt hàng"
    }

    ORDER_ITEM {
        string id PK "cuid/uuid"
        string order_id FK "Liên kết orders.id"
        string book_id FK "Liên kết books.id"
        string book_title "Snapshot tên sách lúc mua"
        int unit_price "Snapshot giá sách lúc mua"
        int quantity "Số lượng mua"
        int total_price "Thành tiền sản phẩm"
    }

    REVIEW {
        string id PK "cuid/uuid"
        string book_id FK "Liên kết books.id"
        string user_id FK "Liên kết users.id"
        int rating "1 đến 5 sao"
        string body "Nội dung nhận xét"
        boolean is_verified_purchase "Đã mua hàng thật"
        enum status "PENDING | APPROVED | REJECTED"
        datetime created_at "Thời gian gửi"
    }

    AUDIT_LOG {
        string id PK "cuid/uuid"
        string user_id FK "Liên kết users.id người thao tác"
        string action "CREATE | UPDATE | DELETE | PERMISSION_CHANGE"
        string target_type "BOOK | ORDER | STAFF | CATEGORY"
        string target_id "ID đối tượng bị tác động"
        json details "Dữ liệu chi tiết trước và sau thay đổi"
        datetime created_at "Thời điểm thực hiện"
    }

    BEHAVIOR_EVENT {
        string id PK "cuid/uuid"
        string user_id FK "Liên kết users.id (nếu có)"
        string session_id "Phiên người dùng vãng lai"
        string event_type "view | add_to_cart | search | purchase"
        string book_id FK "Liên kết books.id"
        string search_query "Từ khóa tìm kiếm"
        datetime created_at "Thời điểm phát sinh sự kiện"
    }
```

## 4.3 Phân Tích Chuyên Sâu Chỉ Số ISBN & Từ Điển Dữ Liệu Chi Tiết 14 Bảng (Data Dictionary)

### 4.3.1 Chỉ số ISBN trong Cơ sở dữ liệu là gì?

Trong bảng `books`, trường `isbn` (International Standard Book Number - Mã số tiêu chuẩn quốc tế cho sách) là **thuộc tính định danh độc nhất trên phạm vi toàn cầu** được cấp theo tiêu chuẩn quốc tế **ISO 2108**.

#### A. Cấu trúc chuẩn của một mã ISBN-13 (Ví dụ thực tế trong hệ thống Tổ Sách: `978-604-0013-71-2`)
Mã ISBN gồm 13 chữ số, chia làm 5 phần phân tách bởi dấu gạch ngang:
1. **Tiền tố GS1 (GS1 Prefix - `978` hoặc `979`):** 3 chữ số đầu tiên định danh ngành xuất bản sách trong hệ thống mã vạch toàn cầu.
2. **Mã nhóm quốc gia / Khu vực ngôn ngữ (Registration Group - `604`):** Định danh quốc gia xuất bản (`604` là mã quốc gia chính thức của **Việt Nam** do Tổ chức ISBN Quốc tế chỉ định; `0` hoặc `1` là khu vực nói tiếng Anh...).
3. **Mã Nhà xuất bản (Registrant Element - `0013`):** Định danh nhà xuất bản cụ thể trong nước (Ví dụ: NXB Trẻ, NXB Giáo Dục, NXB Kim Đồng, Nhã Nam...).
4. **Mã ấn phẩm (Publication Element - `71`):** Mã số phân biệt do nhà xuất bản gán riêng cho từng ấn bản cụ thể (từng tựa sách, phân biệt rõ bản bìa cứng, bìa mềm, hoặc lần tái bản sửa đổi).
5. **Số kiểm tra (Check Digit - `2`):** Chữ số cuối cùng được tính toán theo thuật toán Modulo 10 (với trọng số 1 và 3 xen kẽ) để máy quét mã vạch và phần mềm tự động phát hiện lỗi gõ sai.

#### B. Vai trò và Ý nghĩa kỹ thuật của ISBN trong Hệ sinh thái Tổ Sách
- **Khóa duy nhất cấp nghiệp vụ (`@unique` constraint):** Một cuốn sách có thể trùng tên với cuốn khác (*"Chiến Tranh và Hòa Bình"*, *"Đắc Nhân Tâm"* có nhiều nhà xuất bản dịch và in), nhưng mã ISBN của từng bản in là **duy nhất tuyệt đối**. Đặt cờ `@unique` trên cột `isbn` giúp CSDL tự động chặn 100% rủi ro trùng lặp dữ liệu khi nhân viên kho nhập sách hoặc khi chạy pipeline nạp dữ liệu.
- **Tích hợp máy quét mã vạch Barcode (EAN-13):** Khi quét mã vạch ở bìa sau cuốn sách thực tế tại quầy hoặc kho bãi, đầu đọc mã vạch trả về chính xác chuỗi số ISBN. Nhờ đó, nhân viên kho chỉ cần "bắn mã" là hệ thống tự động tìm đúng cuốn sách trong 5.125 đầu sách để nhập kho hoặc đóng gói đơn hàng.
- **Tối ưu hóa tìm kiếm & Lập chỉ mục Elasticsearch:** Người đọc hoặc thủ thư có thể dán trực tiếp mã ISBN vào thanh tìm kiếm Header để ra đúng phiên bản sách mong muốn mà không cần gõ tên dài.
- **Chuẩn hóa đối chiếu với các bên thứ ba:** Giúp hệ thống dễ dàng kết nối và đối chiếu dữ liệu với Thư viện Quốc gia, cơ sở dữ liệu OpenLibrary, Google Books API và các đối tác phân phối sách.

---

### 4.3.2 Từ Điển Dữ Liệu Chi Tiết Từng Cột Của 14 Bảng CSDL (Field-by-Field Data Dictionary)

#### 1. Bảng `books` (Thông tin Sách trong kho & Niêm yết)
*Bảng thực thể trung tâm của toàn bộ hệ thống, lưu trữ 5.125 đầu sách.*

| Tên Cột (Field) | Kiểu Dữ Liệu | Ràng Buộc / Khóa | Ý Nghĩa Nghiệp Vụ Thực Tế & Ràng Buộc | Dữ Liệu Mẫu Thực Tế |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Khóa chính định danh duy nhất cuốn sách | `0006763b-3a1c-4db9-b929-af2b73d6d671` |
| `isbn` | `TEXT` | **UK**, Index | Mã chuẩn quốc tế ISBN-13 (kiểm soát nguồn gốc, quét mã vạch) | `978-604-0013-71-2` |
| `title` | `TEXT` | NOT NULL | Tên sách chính thức trên bìa | `Gà Mèo Chăm Sóc Chuột Con 8` |
| `slug` | `TEXT` | **UK**, Index | Chuỗi URL thân thiện SEO (duy nhất, không dấu gạch ngang) | `ga-meo-cham-soc-chuot-con-8-124` |
| `description` | `TEXT` | Nullable | Mô tả chi tiết nội dung sách, tóm tắt cốt truyện | `*Gà Mèo Chăm Sóc Chuột Con 8* của tác giả...` |
| `price` | `INTEGER` | NOT NULL | Giá bán thực tế hiện tại (VNĐ), đã trừ khuyến mại | `25500` |
| `original_price`| `INTEGER` | NOT NULL | Giá bìa niêm yết ban đầu của nhà xuất bản (VNĐ) | `45000` |
| `stock_qty` | `INTEGER` | Default 0 | Số lượng sách thực tế còn trong kho vật lý | `42` |
| `sold_count` | `INTEGER` | Default 0 | Tổng số cuốn đã bán thành công (để xếp hạng Bestseller) | `185` |
| `page_count` | `INTEGER` | Nullable | Số trang của cuốn sách | `180` |
| `language` | `TEXT` | Default 'Tiếng Việt'| Ngôn ngữ ấn bản | `Tiếng Việt` |
| `publish_year` | `INTEGER` | Nullable | Năm xuất bản của ấn bản này | `2023` |
| `publisher` | `TEXT` | Nullable | Tên Nhà xuất bản cấp phép | `NXB Kim Đồng` |
| `cover_url` | `TEXT` | NOT NULL | Đường dẫn URL ảnh bìa chính (CDN salt.tikicdn.com) | `https://salt.tikicdn.com/cache/...jpg` |
| `extra_images` | `TEXT[]` | Default `{}` | Mảng đường dẫn các ảnh chụp mục lục, trang trong | `{"https://.../img1.jpg"}` |
| `avg_rating` | `DOUBLE PRECISION`| Default 0.0 | Điểm đánh giá trung bình (1.0 đến 5.0) | `4.8` |
| `rating_count` | `INTEGER` | Default 0 | Tổng số lượt khách hàng đã gửi đánh giá sao | `26` |
| `weight_g` | `INTEGER` | Nullable | Trọng lượng sách (gram) để tính phí vận chuyển | `320` |
| `size_cm` | `TEXT` | Nullable | Kích thước sách (Dài x Rộng cm) | `14 x 20.5 cm` |
| `format` | `TEXT` | Default 'Bìa mềm' | Quy cách đóng sách: 'Bìa mềm' hoặc 'Bìa cứng' | `Bìa mềm` |
| `translator` | `TEXT` | Nullable | Họ tên dịch giả (nếu là tác phẩm nước ngoài dịch) | `Nguyễn Lệ Chi` |
| `tags` | `TEXT[]` | Default `{}` | Mảng từ khóa hỗ trợ tìm kiếm nhanh & Faceted Filter | `{"thiếu nhi", "truyện tranh", "động vật"}` |
| `is_active` | `BOOLEAN` | Default true | Trạng thái hiển thị mở bán (`true`: bán, `false`: ẩn kho) | `true` |
| `is_bestseller`| `BOOLEAN` | Default false| Cờ đánh dấu sách bán chạy nhất để gắn huy hiệu | `true` |
| `is_new` | `BOOLEAN` | Default false| Cờ sách mới phát hành (trong vòng 30 ngày) | `false` |
| `is_featured` | `BOOLEAN` | Default false| Cờ sách nổi bật hiển thị ở Banner trang chủ | `true` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm tạo bản ghi sách | `2026-09-10 08:30:00+07` |
| `updated_at` | `TIMESTAMPTZ` | Auto update | Thời điểm chỉnh sửa thông tin gần nhất | `2026-10-12 14:20:15+07` |

---

#### 2. Bảng `authors` (Tác giả Sách)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh duy nhất của tác giả | `a1b2c3d4-0001-4000-8000-000000000001` |
| `name` | `TEXT` | NOT NULL | Họ và tên tác giả hoặc bút danh | `Nguyễn Nhật Ánh` |
| `slug` | `TEXT` | **UK**, Index | Đường dẫn URL tra cứu sách của tác giả | `nguyen-nhat-anh` |
| `bio` | `TEXT` | Nullable | Giới thiệu tiểu sử, phong cách sáng tác, giải thưởng | `Nhà văn chuyên viết cho thanh thiếu niên...`|
| `avatar_url` | `TEXT` | Nullable | Ảnh chân dung tác giả | `https://.../author_nna.jpg` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm tạo bản ghi tác giả | `2026-09-10 08:00:00+07` |

---

#### 3. Bảng `categories` (Danh Mục Phân Cấp 3 Tầng)
*Thiết kế cấu trúc cây (Hierarchical Tree) thông qua quan hệ tự tham chiếu `parent_id`.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh duy nhất của danh mục | `c1d2e3f4-0001-4000-8000-000000000001` |
| `parent_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `categories.id` cha (`NULL` = Ngành hàng gốc) | `c1d2e3f4-0000-4000-8000-000000000000` |
| `name` | `TEXT` | NOT NULL | Tên hiển thị của danh mục | `Văn Học Kinh Điển` |
| `slug` | `TEXT` | **UK**, Index | Đường dẫn SEO danh mục trên thanh điều hướng | `van-hoc-kinh-dien` |
| `level` | `INTEGER` | Default 1 | Cấp phân nhánh (1: Ngành hàng lớn, 2: Chuyên mục, 3: Chi tiết) | `2` |
| `sort_order` | `INTEGER` | Default 0 | Thứ tự hiển thị ưu tiên trên Menu thanh Header | `1` |
| `image_url` | `TEXT` | Nullable | Ảnh đại diện danh mục (hiển thị trên Grid trang chủ) | `https://.../cat_van_hoc.png` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm tạo danh mục | `2026-09-10 08:00:00+07` |

---

#### 4. Bảng `book_authors` (Liên Kết Sách - Tác Giả N:N)
*Giải quyết bài toán 1 cuốn sách có thể có nhiều đồng tác giả, và 1 tác giả viết nhiều cuốn sách.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- |
| `book_id` | `TEXT` (UUID) | **PK, FK** | Khóa ngoại trỏ đến `books.id` (Xóa sách tự động xóa liên kết - CASCADE) |
| `author_id` | `TEXT` (UUID) | **PK, FK** | Khóa ngoại trỏ đến `authors.id` (CASCADE) |

---

#### 5. Bảng `book_categories` (Liên Kết Sách - Danh Mục N:N)
*Một cuốn sách có thể xuất hiện đồng thời trong ngành hàng cha và chuyên mục con.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- |
| `book_id` | `TEXT` (UUID) | **PK, FK** | Khóa ngoại trỏ đến `books.id` (CASCADE) |
| `category_id` | `TEXT` (UUID) | **PK, FK** | Khóa ngoại trỏ đến `categories.id` (CASCADE) |

---

#### 6. Bảng `users` (Tài Khoản Người Dùng & Quản Trị)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh duy nhất người dùng | `u1a2b3c4-0001-4000-8000-000000000001` |
| `email` | `TEXT` | **UK**, Index | Email đăng nhập chính thức | `hnhngyndng@gmail.com` |
| `password_hash`| `TEXT` | NOT NULL | Mật khẩu mã hóa Bcrypt 10 vòng bảo mật cao | `$2b$10$wK3e8...XyZ` |
| `full_name` | `TEXT` | NOT NULL | Họ và tên hiển thị của người dùng | `Nguyễn Đăng Hanh` |
| `phone` | `TEXT` | **UK**, Nullable | Số điện thoại liên hệ nhận hàng | `0987654321` |
| `avatar_url` | `TEXT` | Nullable | Ảnh đại diện tài khoản | `https://.../avatar.jpg` |
| `role` | `UserRole` (Enum)| Default 'USER' | Vai trò cốt lõi: `USER`, `STAFF`, hoặc `SUPER_ADMIN` | `SUPER_ADMIN` |
| `status` | `UserStatus`(Enum)| Default 'ACTIVE'| Trạng thái tài khoản: `ACTIVE`, `BANNED`, `UNVERIFIED` | `ACTIVE` |
| `email_verified`| `BOOLEAN` | Default false | Cờ xác nhận đã xác thực email thành công qua mã OTP | `true` |
| `last_login_at`| `TIMESTAMPTZ` | Nullable | Lần đăng nhập hệ thống gần nhất | `2026-10-15 14:00:00+07` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm đăng ký tài khoản | `2026-09-10 09:00:00+07` |
| `updated_at` | `TIMESTAMPTZ` | Auto update | Thời điểm cập nhật hồ sơ gần nhất | `2026-10-14 20:10:00+07` |

---

#### 7. Bảng `user_profiles` (Hồ Sơ Mở Rộng & Sở Thích Độc Giả)
*Tách riêng quan hệ 1-1 với `users` để tối ưu kích thước bản ghi bảng users khi đăng nhập.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh hồ sơ | `up-0001-4000-8000` |
| `user_id` | `TEXT` (UUID) | **FK, UK** | Liên kết duy nhất đến `users.id` (1-1) | `u1a2b3c4-0001-4000-8000-000000000001` |
| `birthday` | `TIMESTAMPTZ` | Nullable | Ngày sinh độc giả | `2002-05-15` |
| `gender` | `TEXT` | Nullable | Giới tính: 'Nam', 'Nữ', 'Khác' | `Nam` |
| `address_province`| `TEXT` | Nullable | Tỉnh / Thành phố nhận hàng (Tầng 1) | `Thành phố Hà Nội` |
| `address_district`| `TEXT` | Nullable | Quận / Huyện nhận hàng (Tầng 2) | `Quận Cầu Giấy` |
| `address_ward` | `TEXT` | Nullable | Phường / Xã nhận hàng (Tầng 3) | `Phường Dịch Vọng Hậu` |
| `address_detail` | `TEXT` | Nullable | Số nhà, ngõ ngách, tên đường chi tiết | `Số 144 Xuân Thủy` |
| `preferred_genres`| `TEXT[]` | Default `{}` | Danh sách thể loại sách yêu thích (phục vụ AI gợi ý) | `{"Văn học", "Kỹ năng sống"}` |
| `preferred_langs` | `TEXT[]` | Default `{}` | Ngôn ngữ đọc ưu tiên: `{"Tiếng Việt", "English"}` | `{"Tiếng Việt"}` |
| `reading_level` | `TEXT` | Default 'casual'| Tần suất đọc sách ('casual', 'avid', 'scholar') | `avid` |
| `metadata` | `JSONB` | Nullable | Thuộc tính JSON động mở rộng sở thích | `{"favorite_author": "Nguyễn Nhật Ánh"}` |
| `updated_at` | `TIMESTAMPTZ` | Auto update | Thời gian cập nhật sổ địa chỉ gần nhất | `2026-10-12 11:00:00+07` |

---

#### 8. Bảng `permissions` (Danh Mục Quyền Hạn RBAC)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh quyền hạn | `p-001` |
| `code` | `TEXT` | **UK**, Index | Mã quyền dùng kiểm tra trong Middleware & API | `MANAGE_BOOKS` |
| `name` | `TEXT` | NOT NULL | Tên hiển thị tiếng Việt trên giao diện phân quyền | `Quản lý kho sách` |
| `description` | `TEXT` | Nullable | Giải thích quyền: Xem, thêm, sửa, xóa sách, nhập kho | `Cho phép CRUD sách và cập nhật số lượng tồn kho` |

---

#### 9. Bảng `staff_permissions` (Ma Trận Phân Quyền Nhân Viên)
*Cho phép cấp quyền linh hoạt từng tính năng độc lập cho từng nhân sự.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh phân quyền |
| `staff_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `users.id` (Nhân viên được gán quyền) |
| `permission_id`| `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `permissions.id` (Mã quyền được gán) |
| `assigned_by_id`| `TEXT` (UUID)| **FK**, Nullable| Khóa ngoại trỏ đến `users.id` (Super Admin đã thực hiện gán quyền) |
| `assigned_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm trao quyền phục vụ kiểm toán |

---

#### 10. Bảng `orders` (Đơn Hàng Giao Dịch)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh hệ thống của đơn hàng | `ord-0001-4000-8000` |
| `order_code` | `TEXT` | **UK**, Index | Mã đơn hàng đối ngoại khách hàng tra cứu | `TS-20261015-8942` |
| `user_id` | `TEXT` (UUID) | **FK**, Nullable| Khóa ngoại trỏ đến `users.id` (`NULL` nếu là khách vãng lai) | `u1a2b3c4-0001-4000` |
| `customer_name`| `TEXT` | NOT NULL | Họ tên người nhận hàng ghi trên bưu kiện | `Trần Văn An` |
| `customer_phone`| `TEXT` | NOT NULL | Số điện thoại shipper gọi giao hàng | `0912345678` |
| `customer_email`| `TEXT` | Nullable | Email nhận thông báo hóa đơn và mã vận đơn | `an.tran@gmail.com` |
| `shipping_address`| `TEXT` | NOT NULL | Địa chỉ nhận hàng đầy đủ 3 cấp hành chính | `Số 12 Chùa Bộc, P. Quang Trung, Đống Đa, Hà Nội` |
| `subtotal` | `INTEGER` | NOT NULL | Tổng tiền sách trước khi cộng cước (VNĐ) | `255000` |
| `shipping_fee` | `INTEGER` | Default 30000 | Cước phí vận chuyển (Tự động 0đ nếu đơn $\ge$ 250.000đ) | `0` |
| `total_amount` | `INTEGER` | NOT NULL | Tổng số tiền khách cần thanh toán: `subtotal + shipping_fee` | `255000` |
| `payment_method`| `PaymentMethod`| Default 'COD' | Hình thức: `COD` (tiền mặt) hoặc `BANK_TRANSFER` (VietQR) | `BANK_TRANSFER` |
| `payment_status`| `PaymentStatus`| Default 'PENDING'| Tình trạng tiền: `PENDING`, `PAID`, `FAILED`, `REFUNDED` | `PAID` |
| `status` | `OrderStatus` | Default 'PENDING'| Vòng đời đơn: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED` | `CONFIRMED` |
| `tracking_code`| `TEXT` | Nullable | Mã vận đơn của đối tác bưu cục (GHTK, GHN, ViettelPost) | `GHTK-882910394VN` |
| `note` | `TEXT` | Nullable | Ghi chú của khách hàng (VD: Giao trong giờ hành chính) | `Giao giờ hành chính giúp mình` |
| `timeline` | `JSONB` | Nullable | Lịch sử vết chuyển trạng thái kèm timestamp và người duyệt | `[{"status":"PENDING","at":"..."},{"status":"CONFIRMED","at":"..."}]` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm khách nhấn nút Chốt đơn | `2026-10-15 10:15:00+07` |
| `updated_at` | `TIMESTAMPTZ` | Auto update | Thời điểm trạng thái đơn thay đổi gần nhất | `2026-10-15 11:00:00+07` |

---

#### 11. Bảng `order_items` (Chi Tiết Món Hàng Trong Đơn)
*Lưu ý kiến trúc: Bắt buộc snapshot `book_title`, `cover_url`, `unit_price` tại thời điểm mua để sau này NXB tăng giá sách thì hóa đơn cũ không bao giờ bị sai lệch.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh dòng chi tiết | `oi-0001` |
| `order_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `orders.id` (Xóa đơn xóa chi tiết - CASCADE) | `ord-0001-4000-8000` |
| `book_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `books.id` (RESTRICT - cấm xóa sách đã có trong đơn) | `0006763b-3a1c-4db9` |
| `book_title` | `TEXT` | NOT NULL | Bản chụp (Snapshot) tên sách lúc đặt mua | `Gà Mèo Chăm Sóc Chuột Con 8` |
| `cover_url` | `TEXT` | NOT NULL | Bản chụp ảnh bìa sách | `https://salt.tikicdn.com/...` |
| `unit_price` | `INTEGER` | NOT NULL | Bản chụp giá bán tại thời điểm bấm mua (VNĐ) | `25500` |
| `quantity` | `INTEGER` | Default 1 | Số lượng cuốn khách đặt mua | `2` |
| `total_price` | `INTEGER` | NOT NULL | Thành tiền của dòng: `unit_price * quantity` | `51000` |

---

#### 12. Bảng `reviews` (Đánh Giá & Nhận Xét Độc Giả)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh nhận xét | `rev-0001` |
| `book_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `books.id` | `0006763b-3a1c-4db9` |
| `user_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `users.id` người viết review | `u1a2b3c4-0001` |
| `rating` | `INTEGER` | NOT NULL | Số sao đánh giá từ 1 đến 5 sao | `5` |
| `title` | `TEXT` | Nullable | Tiêu đề tóm tắt nhận xét | `Sách in đẹp, đóng gói cẩn thận` |
| `body` | `TEXT` | NOT NULL | Nội dung đánh giá chi tiết cảm nhận khi đọc | `Sách chuẩn chính hãng, giấy xốp chống lóa...` |
| `is_verified_purchase`| `BOOLEAN` | Default false | Cờ xác nhận người đánh giá đã thực sự mua cuốn sách này | `true` |
| `status` | `ReviewStatus`| Default 'APPROVED'| Trạng thái duyệt: `PENDING`, `APPROVED`, `REJECTED` | `APPROVED` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm gửi nhận xét | `2026-10-14 16:30:00+07` |
| `updated_at` | `TIMESTAMPTZ` | Auto update | Thời điểm chỉnh sửa nhận xét | `2026-10-14 16:30:00+07` |

---

#### 13. Bảng `admin_audit_logs` (Nhật Ký Kiểm Toán Bảo Mật)
*Ghi nhận toàn bộ thao tác thay đổi nhạy cảm của nhân viên và quản trị viên (Audit Trail).*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã định danh vết kiểm toán | `aud-0001` |
| `user_id` | `TEXT` (UUID) | **FK** | Khóa ngoại trỏ đến `users.id` nhân viên thao tác | `u1a2b3c4-0001` |
| `action` | `TEXT` | NOT NULL | Hành động: `CREATE_BOOK`, `UPDATE_STOCK`, `CONFIRM_ORDER`, `ASSIGN_PERM` | `UPDATE_STOCK` |
| `target_type` | `TEXT` | NOT NULL | Loại thực thể bị tác động: `BOOK`, `ORDER`, `USER`, `REVIEW` | `BOOK` |
| `target_id` | `TEXT` | Nullable | Mã ID của đối tượng bị thay đổi | `0006763b-3a1c-4db9` |
| `details` | `JSONB` | Nullable | Dữ liệu trước và sau khi thay đổi (Before/After Payload) | `{"old_stock": 2, "new_stock": 50}` |
| `ip_address` | `TEXT` | Nullable | Địa chỉ IP của máy nhân viên thực hiện thao tác | `118.70.12.34` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm xảy ra thao tác (chống chối bỏ) | `2026-10-15 09:12:00+07` |

---

#### 14. Bảng `user_behavior_events` (Dữ Liệu Lớn Thu Thập Hành Vi Phục Vụ AI & Phân Tích)
*Thu thập 200.000 sự kiện tương tác thời gian thực của người dùng phục vụ Động cơ gợi ý lai ghép 5 yếu tố (Mục 3.1 Proposal).*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Mẫu |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` (UUID) | **PK** | Mã sự kiện hành vi | `evt-0001` |
| `user_id` | `TEXT` (UUID) | **FK**, Nullable| Mã người dùng (nếu đã đăng nhập, `NULL` nếu là khách vãng lai) | `u1a2b3c4-0001` |
| `session_id` | `TEXT` | NOT NULL | Mã phiên làm việc trên trình duyệt của người dùng | `sess_9a8b7c6d` |
| `event_type` | `TEXT` | NOT NULL | Loại hành vi: `view` (xem), `add_to_cart` (thêm giỏ), `wishlist`, `purchase`, `search` | `add_to_cart` |
| `book_id` | `TEXT` (UUID) | **FK**, Nullable| Mã cuốn sách phát sinh tương tác | `0006763b-3a1c-4db9` |
| `search_query` | `TEXT` | Nullable | Từ khóa người dùng đã gõ tìm kiếm | `nguyễn nhật ánh` |
| `duration_sec` | `INTEGER` | Nullable | Thời gian người dùng dừng lại đọc trang chi tiết sách (giây) | `45` |
| `metadata` | `JSONB` | Nullable | Thông tin bổ sung: nguồn giới thiệu (referrer), thiết bị | `{"device": "mobile", "ref": "facebook"}` |
| `created_at` | `TIMESTAMPTZ` | Default NOW() | Thời điểm sự kiện phát sinh | `2026-10-15 13:45:10+07` |

---

## 4.4 Chiến lược Lập chỉ mục (Index Optimization Strategy)
Để đảm bảo tốc độ phản hồi dưới **50ms** trên tập dữ liệu hơn 5.100 đầu sách và 200.000 bản ghi sự kiện:
- **Chỉ mục B-Tree Unique:** Được áp dụng trên `books.slug`, `books.isbn`, `categories.slug`, `authors.slug`, `orders.order_code`, `users.email`.
- **Chỉ mục B-Tree Composite:**
  - `idx_books_active_rating`: `(is_active, avg_rating DESC)` — Tối ưu hóa truy vấn trang chủ và gợi ý AI.
  - `idx_books_price_stock`: `(is_active, price, stock_qty)` — Tối ưu hóa bộ lọc giá và kiểm tra tồn kho.
  - `idx_orders_user_status`: `(user_id, status, created_at DESC)` — Tối ưu hóa trang lịch sử đơn hàng của độc giả.
  - `idx_reviews_book_status`: `(book_id, status, created_at DESC)` — Tối ưu hóa tải bình luận trang chi tiết sách.

## 4.5 Cơ chế Giao dịch Nguyên tử (ACID Transactions) & Khóa chống Bán vượt tồn kho
Khi hàng trăm người dùng cùng tranh mua cuốn sách cuối cùng trong kho:
```typescript
// Trích đoạn logic an toàn trong src/app/api/orders/route.ts
const result = await prisma.$transaction(async (tx) => {
  for (const item of items) {
    const book = await tx.book.findUnique({
      where: { id: item.bookId },
      select: { stockQty: true, title: true }
    });
    if (!book || book.stockQty < item.quantity) {
      throw new Error(`Sách "${book?.title}" không đủ số lượng tồn kho (còn ${book?.stockQty})`);
    }
    // Trừ kho nguyên tử
    await tx.book.update({
      where: { id: item.bookId },
      data: {
        stockQty: { decrement: item.quantity },
        soldCount: { increment: item.quantity }
      }
    });
  }
  // Tạo Order và OrderItems trong cùng 1 transaction
  return await tx.order.create({ ... });
});
```
- **Tính Nguyên Tử (Atomicity):** Nếu bất kỳ cuốn sách nào trong giỏ hàng bị hết tồn kho, toàn bộ đơn hàng bị hủy bỏ ngay lập tức (Rollback 100%), không xảy ra hiện tượng "tiền mất đơn không tạo".
- **Tính Nhất Quán (Consistency):** Ràng buộc số lượng tồn `stockQty >= 0` luôn được bảo đảm ở cấp độ Database.
- **Tính Cô Lập (Isolation):** PostgreSQL sử dụng cấp độ cô lập Read Committed kết hợp cơ chế khóa hàng (Row-level Locking) của lệnh `UPDATE`, triệt tiêu hoàn toàn Race Condition.

---

# CHƯƠNG 5: HỆ THỐNG SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOW DIAGRAMS - DFD)

## 5.1 DFD Mức 0 — Sơ đồ Ngữ cảnh Toàn hệ thống (Context Diagram)

```mermaid
graph TD
    Customer["ĐỘC GIẢ / KHÁCH HÀNG"]
    Staff["NHÂN VIÊN VẬN HÀNH (Kho / Đơn)"]
    Admin["QUẢN TRỊ VIÊN (Super Admin)"]
    Bank["HỆ THỐNG NGÂN HÀNG (VietQR / MBBank)"]
    EmailGateway["CỔNG EMAIL (Google SMTP)"]

    System(("HỆ THỐNG TMĐT TỔ SÁCH<br/>(Hệ thống trung tâm)"))

    Customer -->|Yêu cầu tìm sách, Đặt hàng, Thanh toán, Đánh giá| System
    System -->|Trả về Kết quả tìm kiếm, Hóa đơn, Thẻ sách AI| Customer

    Staff -->|Cập nhật trạng thái đơn, Quản lý tồn kho| System
    System -->|Danh sách đơn cần duyệt, Cảnh báo sắp hết hàng| Staff

    Admin -->|Phân quyền nhân viên, Cấu hình hệ thống| System
    System -->|Báo cáo doanh thu, Nhật ký Audit Logs| Admin

    System -->|Yêu cầu sinh mã QR thanh toán| Bank
    Bank -->|Xác nhận thanh toán tiền về tài khoản| System

    System -->|Gửi mã OTP, Hóa đơn đơn hàng| EmailGateway
    EmailGateway -->|Chuyển tiếp thư vào hộp thư Inbox| Customer
```

## 5.2 DFD Mức 1 — Phân rã Chức năng Nghiệp vụ Cốt lõi

```mermaid
graph TD
    ActorUser["Khách Hàng / Độc Giả"]
    ActorAdmin["Quản Trị Viên / Nhân Viên"]

    subgraph Processes["CÁC TIẾN TRÌNH XỬ LÝ CHÍNH"]
        P1["1.0 Xác Thực & Quản Lý Hồ Sơ"]
        P2["2.0 Tìm Kiếm, Duyệt Sách & Catalog"]
        P3["3.0 Quản Lý Giỏ Hàng & Mua Hàng"]
        P4["4.0 Xử Lý Đơn Hàng & Vận Chuyển"]
        P5["5.0 Quản Trị Kho & Nhập Xuất Tồn"]
        P6["6.0 Trợ Lý AI Tư Vấn & RAG Engine"]
    end

    subgraph DataStores["CÁC KHO DỮ LIỆU (POSTGRESQL TABLES)"]
        D1[("D1: users, user_profiles, staff_permissions")]
        D2[("D2: books, categories, authors")]
        D3[("D3: orders, order_items")]
        D4[("D4: reviews")]
        D5[("D5: admin_audit_logs, behavior_events")]
    end

    ActorUser -->|Thông tin đăng ký/đăng nhập| P1
    P1 -->|Ghi nhận/đọc tài khoản| D1
    P1 -->|Trả về phiên đăng nhập JWT| ActorUser

    ActorUser -->|Từ khóa tìm kiếm, Lọc danh mục| P2
    P2 -->|Đọc thông tin sách & thể loại| D2
    P2 -->|Trả về danh sách đầu sách| ActorUser

    ActorUser -->|Thêm sách giỏ hàng, Xác nhận thanh toán| P3
    P3 -->|Kiểm tra tồn kho thực tế| D2
    P3 -->|Ghi nhận đơn hàng mới| D3
    P3 -->|Trừ số lượng tồn kho| D2
    P3 -->|Trả về mã vận đơn & QR thanh toán| ActorUser

    ActorAdmin -->|"Cập nhật trạng thái đơn (Duyệt/Giao/Hủy)"| P4
    P4 -->|Cập nhật trạng thái đơn hàng| D3
    P4 -->|Ghi nhật ký thao tác| D5

    ActorAdmin -->|Cập nhật sách, Nhập thêm tồn kho| P5
    P5 -->|Thêm/sửa bản ghi sách| D2
    P5 -->|Ghi nhận Audit Log| D5

    ActorUser -->|Câu hỏi tư vấn sách / tâm trạng| P6
    P6 -->|Truy vấn kho sách thực tế| D2
    P6 -->|Trả về câu trả lời & Thẻ sách| ActorUser
```

## 5.3 DFD Mức 2 — Phân rã Quy trình Đặt hàng & Xử lý Giao dịch

```mermaid
graph TD
    Customer["Khách Hàng"]
    
    subgraph P3_Decomposition["PHÂN RÃ TIẾN TRÌNH 3.0: ĐẶT HÀNG & GIAO DỊCH"]
        P31["3.1 Kiểm Tra Giỏ Hàng & Tồn Kho"]
        P32["3.2 Xác Định Phí Vận Chuyển (Freeship >= 250k)"]
        P33["3.3 Khởi Tạo Đơn Hàng & Khóa Transaction"]
        P34["3.4 Sinh Mã VietQR hoặc Chọn COD"]
        P35["3.5 Phát Tán Sự Kiện Thông Báo Đơn Hàng Mới"]
    end

    DB_Books[("Kho Sách: books")]
    DB_Orders[("Kho Đơn: orders, order_items")]
    EmailService["Dịch vụ Email OTP/Hóa đơn"]

    Customer -->|Nhấn Đặt Hàng| P31
    P31 -->|Truy vấn stockQty| DB_Books
    DB_Books -->|Còn hàng hợp lệ| P32
    
    P32 -->|Tính tổng tiền thanh toán| P33
    P33 -->|Mở Prisma $transaction| DB_Books
    P33 -->|Trừ tồn kho stockQty, Tăng soldCount| DB_Books
    P33 -->|Tạo bản ghi Order & OrderItems| DB_Orders
    
    P33 -->|Chuyển tiếp thông tin đơn| P34
    P34 -->|Trả về QR MBBank hoặc Hướng dẫn COD| Customer
    
    P33 -->|Gửi dữ liệu đơn mới| P35
    P35 -->|Kích hoạt gửi Email xác nhận| EmailService
    P35 -->|Đẩy thông báo quả chuông cho Order Staff| Customer
```

---

# CHƯƠNG 6: HỆ THỐNG SƠ ĐỒ CA SỬ DỤNG (USE CASE DIAGRAMS)

## 6.1 Sơ đồ Ca sử dụng Tổng quan Hệ thống (System Use Case)

```mermaid
graph LR
    Guest["Khách Vãng Lai"]
    Customer["Độc Giả Đã Đăng Nhập"]
    OrderStaff["Nhân Viên Đơn Hàng"]
    WarehouseStaff["Nhân Viên Kho"]
    SuperAdmin["Quản Trị Viên (Super Admin)"]

    subgraph Boundary["HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TỔ SÁCH"]
        UC1["Xem & Tìm kiếm sách theo từ khóa"]
        UC2["Lọc danh mục 3 cấp & giá bìa"]
        UC3["Quản lý giỏ hàng & Wishlist"]
        UC4["Đăng ký / Đăng nhập / Quên mật khẩu OTP"]
        UC5["Đặt hàng & Thanh toán (COD / VietQR)"]
        UC6["Theo dõi lịch sử đơn hàng & Tra cứu vận đơn"]
        UC7["Gửi đánh giá sao & Bình luận sách"]
        UC8["Trò chuyện cùng Trợ lý AI Chatbot RAG"]
        
        UC9["Quản lý Kho sách (CRUD sách, Nhập kho)"]
        UC10["Xử lý & Cập nhật trạng thái Đơn hàng"]
        UC11["Kiểm duyệt Đánh giá của khách hàng"]
        UC12["Cấp tài khoản & Phân quyền RBAC động"]
        UC13["Tra cứu Nhật ký Kiểm toán (Audit Logs)"]
        UC14["Xem Thống kê Doanh thu & Tồn kho"]
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Guest --> UC8

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8

    WarehouseStaff --> UC9
    OrderStaff --> UC10
    OrderStaff --> UC11

    SuperAdmin --> UC9
    SuperAdmin --> UC10
    SuperAdmin --> UC11
    SuperAdmin --> UC12
    SuperAdmin --> UC13
    SuperAdmin --> UC14
```

## 6.2 Phân rã Use Case Phân hệ Khách hàng (Customer Storefront)

```mermaid
graph TD
    ActorCustomer((Khách Hàng))

    subgraph CustomerSubsystem["Phân Hệ Khách Hàng (Customer Storefront)"]
        UC_Search["Tìm kiếm toàn văn (FTS)"]
        UC_Filter["Lọc đa chiều (Danh mục, Giá, NXB, Rating)"]
        UC_Detail["Xem chi tiết sách & Thông số NXB"]
        UC_Wishlist["Thêm / Xóa Tủ sách yêu thích"]
        UC_Cart["Thêm vào giỏ / Tăng giảm số lượng"]
        UC_Checkout["Thực hiện Đặt hàng (Checkout)"]
        UC_PayCOD["Chọn Thanh toán COD khi nhận"]
        UC_PayQR["Chọn Quét mã VietQR MBBank"]
        UC_Track["Tra cứu tình trạng giao hàng thời gian thực"]
        UC_Review["Gửi nhận xét đánh giá (1-5 sao)"]
        UC_AskAI["Trò chuyện cùng AI tư vấn sách"]
    end

    ActorCustomer --> UC_Search
    ActorCustomer --> UC_Filter
    ActorCustomer --> UC_Detail
    ActorCustomer --> UC_Wishlist
    ActorCustomer --> UC_Cart
    ActorCustomer --> UC_Checkout
    ActorCustomer --> UC_Track
    ActorCustomer --> UC_Review
    ActorCustomer --> UC_AskAI

    UC_Checkout -.->|<<include>>| UC_PayCOD
    UC_Checkout -.->|<<include>>| UC_PayQR
    UC_Wishlist -.->|<<extend>>| UC_Detail
    UC_Cart -.->|<<extend>>| UC_Detail
```

## 6.3 Phân rã Use Case Phân hệ Quản trị & Vận hành (Staff & Admin Portal)

```mermaid
graph TD
    ActorStaffOrder((Nhân Viên Đơn))
    ActorStaffWarehouse((Nhân Viên Kho))
    ActorAdmin((Super Admin))

    subgraph AdminSubsystem["Phân Hệ Quản Trị & Vận Hành (Admin Portal)"]
        UC_BookList["Xem danh sách sách & Bộ lọc"]
        UC_BookAdd["Thêm mới sách đơn lẻ"]
        UC_BookBatch["Nhập sách hàng loạt (Excel/CSV)"]
        UC_StockUpdate["Điều chỉnh tồn kho thực tế"]
        UC_LowStockAlert["Nhận cảnh báo sách sắp hết (stockQty < 10)"]

        UC_OrderList["Xem danh sách đơn & Bộ lọc trạng thái"]
        UC_OrderConfirm["Xác nhận & Duyệt đơn hàng"]
        UC_OrderShip["Chuyển trạng thái Đang giao hàng"]
        UC_OrderCancel["Hủy đơn hàng hoàn tồn"]

        UC_ReviewList["Xem danh sách đánh giá chờ duyệt"]
        UC_ReviewApprove["Duyệt / Từ chối hiển thị bình luận"]

        UC_StaffManage["Tạo tài khoản & Phân quyền RBAC động"]
        UC_AuditViewer["Tra cứu lịch sử thao tác (Audit Logs)"]
        UC_Analytics["Xem biểu đồ doanh thu & Top bán chạy"]
    end

    ActorStaffWarehouse --> UC_BookList
    ActorStaffWarehouse --> UC_BookAdd
    ActorStaffWarehouse --> UC_BookBatch
    ActorStaffWarehouse --> UC_StockUpdate
    ActorStaffWarehouse --> UC_LowStockAlert

    ActorStaffOrder --> UC_OrderList
    ActorStaffOrder --> UC_OrderConfirm
    ActorStaffOrder --> UC_OrderShip
    ActorStaffOrder --> UC_OrderCancel
    ActorStaffOrder --> UC_ReviewList
    ActorStaffOrder --> UC_ReviewApprove

    ActorAdmin --> UC_StaffManage
    ActorAdmin --> UC_AuditViewer
    ActorAdmin --> UC_Analytics
    ActorAdmin --> UC_BookList
    ActorAdmin --> UC_OrderList
```

---

# CHƯƠNG 7: HỆ THỐNG SƠ ĐỒ HOẠT ĐỘNG NGHIỆP VỤ (ACTIVITY DIAGRAMS)

## 7.1 Sơ đồ Hoạt động 1: Quy trình Đặt hàng & Thanh toán (Checkout Flow)

```mermaid
graph TD
    Start(["Khách hàng mở trang Giỏ hàng (/cart)"]) --> ActionCheckout["Nhấn nút 'Tiến hành đặt hàng'"]
    ActionCheckout --> CheckCart{"Kiểm tra số lượng sách trong giỏ"}

    CheckCart -->|"Số lượng = 0"| CartEmpty["Báo lỗi 'Giỏ hàng đang trống'"]
    CartEmpty --> Start
    CheckCart -->|"Số lượng >= 1"| CheckLogin{"Kiểm tra trạng thái đăng nhập"}

    CheckLogin -->|"Chưa đăng nhập"| GoAuth["Chuyển hướng sang /auth?redirect=/checkout"]
    GoAuth --> AuthDone["Đăng nhập hoặc Đăng ký OTP"]
    AuthDone --> FillAddress["Tự động điền sổ địa chỉ đã lưu"]
    CheckLogin -->|"Đã đăng nhập"| FillAddress

    FillAddress --> InputInfo["Nhập Họ tên, SĐT, Tỉnh/Huyện/Xã"]
    InputInfo --> SelectPayment{"Chọn phương thức thanh toán"}

    SelectPayment -->|"Tiền mặt COD"| PayCOD["Chọn Tiền mặt khi nhận hàng (COD)"]
    SelectPayment -->|"Chuyển khoản VietQR"| PayVietQR["Chọn Chuyển khoản VietQR MBBank"]

    PayVietQR --> GenQR["Hệ thống hiển thị mã QR động có sẵn nội dung"]
    PayCOD --> ConfirmOrder["Khách nhấn 'Hoàn tất đặt hàng'"]
    GenQR --> ScanQR["Khách quét mã thanh toán"] --> ConfirmOrder

    ConfirmOrder --> ServerReceive["Server nhận request POST /api/orders"]
    ServerReceive --> OpenTx["Mở Prisma Transaction (ACID)"]
    OpenTx --> CheckStock{"Kiểm tra tồn kho từng cuốn sách"}

    CheckStock -->|"Hết hàng (stockQty không đủ)"| RollbackTx["Rollback Transaction & Báo sách hết hàng"]
    RollbackTx --> FixCart["Yêu cầu khách giảm số lượng"] --> Start

    CheckStock -->|"Còn hàng (stockQty đáp ứng đủ)"| DeductStock["Trừ stockQty, Tăng soldCount"]
    DeductStock --> CreateOrder["Tạo Order (order_code) & OrderItems"]
    CreateOrder --> CommitTx["Commit Transaction thành công!"]
    
    CommitTx --> ClearLocalCart["Xóa sạch giỏ hàng trong LocalStorage"]
    ClearLocalCart --> SendInvoiceMail["Kích hoạt gửi Email hóa đơn xác nhận"]
    SendInvoiceMail --> SuccessPage["Điều hướng sang trang /order/success"]
    SuccessPage --> Finish(["Kết thúc"])
```

## 7.2 Sơ đồ Hoạt động 2: Quy trình Xác thực & Kiểm soát Biên giới (Edge Guard Middleware & RBAC)

```mermaid
graph TD
    StartReq(["Người dùng gửi Request tới URL"]) --> EdgeMiddleware["Next.js Edge Middleware / Proxy đón chặn"]
    EdgeMiddleware --> CheckRoute{"Kiểm tra loại đường dẫn URL"}

    CheckRoute -->|"Route Công khai: /, /catalog, /book/*, /cart, /wishlist"| AllowPublic["Cho phép truy cập bình thường"]
    CheckRoute -->|"Route Bảo vệ: /checkout, /account/*, /admin/*"| CheckToken{"Đọc cookie HttpOnly tosach_token"}

    CheckToken -->|"Không có Token hoặc Rỗng"| RedirectAuth["Redirect về /auth?redirect=URL"]
    CheckToken -->|"Có Token"| DecodeJWT["Giải mã JWT bằng jose (HS256)"]

    DecodeJWT --> CheckSignature{"Kiểm tra chữ ký & Hạn dùng (exp)"}
    CheckSignature -->|"Chữ ký giả mạo hoặc Hết hạn"| ClearCookie["Xóa cookie tosach_token & Redirect /auth"]
    CheckSignature -->|"Payload hợp lệ: userId, role"| CheckAdminPath{"Request truy cập vào /admin/*?"}

    CheckAdminPath -->|"Không: /checkout hoặc /account"| AllowAccess["Cấp quyền truy cập"]
    CheckAdminPath -->|"Có: /admin/*"| CheckRole{"Kiểm tra role trong payload"}

    CheckRole -->|"role == 'USER'"| Block403["Chặn truy cập 403 (Redirect về Trang chủ /)"]
    CheckRole -->|"role == 'STAFF' hoặc 'SUPER_ADMIN'"| GrantAdmin["Cấp quyền vào Dashboard Admin"]

    AllowPublic --> RenderPage(["Hiển thị trang giao diện"])
    AllowAccess --> RenderPage
    GrantAdmin --> RenderPage
    RedirectAuth --> EndBlock(["Dừng phiên & Chờ đăng nhập"])
    Block403 --> EndBlock
    ClearCookie --> EndBlock
```

## 7.3 Sơ đồ Hoạt động 3: Quy trình Quản lý Kho sách & Nhập xuất tồn

```mermaid
graph TD
    StartWarehouse(["Nhân viên Kho mở /admin/books"]) --> LoadBooks["Tải danh sách sách kèm số lượng tồn kho"]
    LoadBooks --> CheckThreshold{"Quét kiểm tra stockQty"}

    CheckThreshold -->|"stockQty < 10 cuốn"| DangerAlert["Đánh dấu huy hiệu Đỏ 'Sắp hết hàng'"]
    CheckThreshold -->|"stockQty >= 10 cuốn"| SafeStatus["Đánh dấu huy hiệu Xanh 'Ổn định'"]

    DangerAlert --> DecideRestock{"Nhân viên quyết định nhập thêm sách"}
    SafeStatus --> DecideRestock

    DecideRestock -->|"Nhập thủ công"| EditSingle["Nhấn nút 'Sửa' trên giao diện"]
    DecideRestock -->|"Nhập hàng loạt"| ImportBatch["Nhấn nút 'Nhập từ file Excel/CSV'"]

    EditSingle --> InputNewQty["Điền số lượng mới & Lưu"]
    ImportBatch --> ParseFile["Hệ thống đọc file, validate mã ISBN"]

    InputNewQty --> UpdateDatabase["Cập nhật bản ghi vào PostgreSQL"]
    ParseFile --> UpdateDatabase

    UpdateDatabase --> SaveAudit["Tự động ghi lại lịch sử vào admin_audit_logs"]
    SaveAudit --> RefreshData["Reload danh sách & Cập nhật quả chuông thông báo"]
    RefreshData --> FinishWarehouse(["Hoàn tất quy trình"])
```

---

# CHƯƠNG 8: HỆ THỐNG SƠ ĐỒ TUẦN TỰ CHI TIẾT (SEQUENCE DIAGRAMS)

## 8.1 Sơ đồ Tuần tự 1: Đăng nhập Hệ thống & Cấp phát HttpOnly Cookie JWT

```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng / Quản trị viên
    participant UI as Giao diện Đăng nhập (/auth)
    participant EdgeProxy as Next.js Proxy / Middleware
    participant API as Auth API Route (/api/auth/login)
    participant DB as PostgreSQL (Supabase)
    participant Browser as Trình duyệt (Cookie Jar)

    User->>UI: Điền Email & Mật khẩu, nhấn "Đăng nhập"
    UI->>API: POST /api/auth/login { email, password }
    
    API->>DB: prisma.user.findUnique({ where: { email } })
    DB-->>API: Trả về bản ghi User (id, passwordHash, role, status)
    
    alt Email không tồn tại hoặc Tài khoản bị khóa (BANNED)
        API-->>UI: HTTP 401 Unauthorized { error: "Email hoặc mật khẩu không chính xác" }
        UI-->>User: Hiển thị thông báo lỗi màu đỏ
    else Tài khoản hợp lệ
        API->>API: bcrypt.compare(password, user.passwordHash)
        alt Mật khẩu sai
            API-->>UI: HTTP 401 Unauthorized { error: "Email hoặc mật khẩu không chính xác" }
            UI-->>User: Hiển thị thông báo mật khẩu sai
        else Mật khẩu chính xác
            API->>API: Tạo JWT Payload: { sub: user.id, email, role, fullName }
            API->>API: Ký token thuật toán HS256 với JWT_SECRET (thời hạn 7 ngày)
            API->>Browser: Set-Cookie: tosach_token=JWT (HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=7 ngày)
            API-->>UI: HTTP 200 OK { success: true, user: { id, fullName, role } }
            
            alt Vai trò là SUPER_ADMIN hoặc STAFF
                UI-->>User: Chuyển hướng sang trang Quản trị (/admin/dashboard)
            else Vai trò là USER độc giả
                UI-->>User: Chuyển hướng sang Trang chủ (/) hoặc Trang thanh toán (/checkout)
            end
        end
    end
```

## 8.2 Sơ đồ Tuần tự 2: Khách hàng Đặt hàng & Xử lý Transaction ACID Trừ Tồn Kho

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant CheckoutUI as Trang Thanh Toán (/checkout)
    participant OrderAPI as Order API (/api/orders)
    participant Prisma as Prisma Transaction Engine ($transaction)
    participant DB as PostgreSQL (Bảng books, orders, order_items)
    participant EmailService as Nodemailer Gmail SMTP

    Customer->>CheckoutUI: Điền thông tin giao hàng & Nhấn "Xác nhận đặt hàng"
    CheckoutUI->>OrderAPI: POST /api/orders { items, customerName, phone, address, paymentMethod }
    
    Note over OrderAPI,Prisma: Bắt đầu Giao dịch Cơ sở Dữ liệu Nguyên tử (ACID Transaction)
    OrderAPI->>Prisma: prisma.$transaction(async (tx) => { ... })
    
    loop Duyệt từng cuốn sách trong giỏ hàng
        Prisma->>DB: tx.book.findUnique({ where: { id: item.bookId } })
        DB-->>Prisma: Trả về stockQty thực tế
        alt stockQty < item.quantity (Hết tồn kho)
            Prisma-->>OrderAPI: Ném lỗi ngoại lệ (Throw Error)
            Note over Prisma,DB: Tự động Rollback toàn bộ giao dịch 100%!
            OrderAPI-->>CheckoutUI: HTTP 400 Bad Request { error: "Sách X không đủ số lượng tồn" }
            CheckoutUI-->>Customer: Báo lỗi và đề nghị cập nhật lại giỏ hàng
        end
    end

    Note over Prisma,DB: Tất cả các đầu sách đều đủ tồn kho
    Prisma->>DB: tx.order.create({ data: { orderCode, totalAmount, paymentMethod, status: "PENDING" } })
    Prisma->>DB: tx.orderItem.createMany({ data: orderItemsSnapshot })
    
    loop Trừ số lượng tồn kho từng cuốn
        Prisma->>DB: tx.book.update({ where: { id: item.bookId }, data: { stockQty: decrement, soldCount: increment } })
    end
    
    Note over Prisma,DB: Commit Transaction thành công rực rỡ!
    DB-->>Prisma: Trả về bản ghi Order hoàn tất
    Prisma-->>OrderAPI: Hoàn tất Transaction
    
    OrderAPI-)EmailService: Kích hoạt gửi Email hóa đơn bất đồng bộ (Non-blocking)
    OrderAPI-->>CheckoutUI: HTTP 201 Created { success: true, orderCode: "TS-20261013-008" }
    CheckoutUI->>Customer: Điều hướng tới /order/success và hiển thị mã đơn hàng
```

## 8.3 Sơ đồ Tuần tự 3: Thanh toán Tự động VietQR MBBank

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant UI as Giao diện Thanh toán (/checkout)
    participant API as Order API Route (/api/orders)
    participant QRGen as Module Sinh mã VietQR (Client/Server)
    participant BankApp as App Ngân hàng của Khách (MBBank/VCB...)
    participant Napas as Cổng Chuyển Mạch Napas 24/7
    participant OrderStaff as Nhân viên Đơn hàng

    Customer->>UI: Chọn phương thức "Chuyển khoản VietQR" & Bấm Đặt Hàng
    UI->>API: POST /api/orders (Tạo đơn hàng trạng thái paymentStatus: 'PENDING')
    API-->>UI: Trả về orderCode: "TS-20261013-008", totalAmount: 285000
    
    UI->>QRGen: Sinh URL mã VietQR theo chuẩn: https://img.vietqr.io/image/MB-0988123456-compact2.png?amount=285000&addInfo=TS-20261013-008
    QRGen-->>UI: Trả về mã QR động chứa sẵn Số tài khoản, Số tiền, và Nội dung
    UI-->>Customer: Hiển thị mã QR rõ nét trên màn hình kèm đồng hồ đếm ngược
    
    Customer->>BankApp: Mở App Ngân hàng, Quét mã QR trên màn hình
    BankApp->>BankApp: Tự động điền: MBBank, 285.000 đ, Nội dung: TS-20261013-008
    Customer->>BankApp: Xác thực OTP / FaceID và Bấm Chuyển Tiền
    BankApp->>Napas: Khởi tạo giao dịch chuyển khoản nhanh 24/7
    Napas-->>BankApp: Giao dịch thành công tức thì
    
    Note over BankApp,OrderStaff: Tiền về tài khoản Tổ Sách kèm cú pháp mã đơn
    OrderStaff->>UI: Mở /admin/orders, thấy biến động số dư khớp mã TS-20261013-008
    OrderStaff->>API: PATCH /api/admin/orders/TS-20261013-008 { paymentStatus: 'PAID', status: 'CONFIRMED' }
    API-->>OrderStaff: Cập nhật trạng thái 'Đã thanh toán' & Đẩy đơn sang khâu đóng gói
```

## 8.4 Sơ đồ Tuần tự 4: Trợ lý AI Chatbot RAG Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Độc giả
    participant ChatUI as Floating Chatbot Widget
    participant ChatAPI as Next.js API Route (/api/chat)
    participant DB as PostgreSQL (Supabase)
    participant Gemini as Google Gemini (3.1 Flash-Lite)

    User->>ChatUI: Nhập: "Tôi đang rất buồn, muốn tìm cuốn sách chữa lành"
    ChatUI->>ChatAPI: POST /api/chat { message: "...", history: [...] }
    
    ChatAPI->>ChatAPI: Tầng 1: Phân tích Ý định (Intent Classification)
    Note over ChatAPI: Nhận diện: Cảm xúc buồn bã -> Chuyển sang chủ đề Văn học / Chữa lành
    
    ChatAPI->>DB: Truy vấn RAG: prisma.book.findMany({ where: { isActive: true, coverUrl: { startsWith: 'http' }, categories: 'van-hoc' }, take: 3 })
    DB-->>ChatAPI: Trả về 3 tựa sách thực: "Cây Chuối Non Đi Giày Xanh", "Nhà Giả Kim"...
    
    Note over ChatAPI: Tầng 2: Bơm Ngữ Cảnh RAG vào System Prompt<br/>- Khẩu hiệu, chính sách Tổ Sách<br/>- Dữ liệu 3 cuốn sách thật vừa truy vấn<br/>- Hướng dẫn thấu cảm, dịu dàng
    
    ChatAPI->>Gemini: POST v1beta/models/gemini-3.1-flash-lite:generateContent { contents, maxOutputTokens: 250 }
    
    alt Google Gemini phản hồi thành công (HTTP 200 trong 1.5s)
        Gemini-->>ChatAPI: Lời an ủi ấm áp + Gợi ý 2 cuốn sách phù hợp
        ChatAPI-->>ChatUI: HTTP 200 { reply: "...", suggestedBooks: [book1, book2], source: "google-gemini-3.1-flash-lite" }
    else Hết Quota API hoặc Mất mạng (Fallback)
        Note over ChatAPI: Tầng 3: Kích hoạt Local Intelligence Generator (14 Miền CSKH)
        ChatAPI-->>ChatUI: HTTP 200 { reply: "Lời an ủi chuẩn nội bộ...", suggestedBooks: [book1, book2], source: "tosach-local-intelligence" }
    end

    ChatUI->>User: Hiển thị đoạn chat thấu cảm + Thẻ sách động (Ảnh bìa, Giá tiền, Link /book/[slug])
```

## 8.5 Sơ đồ Tuần tự 5: Cơ chế Phân quyền RBAC & Lọc Thông báo Quả chuông Động

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân Viên Kho (Warehouse Staff)
    participant AdminUI as Giao diện Admin (/admin/*)
    participant Header as AdminHeader Component
    participant Dropdown as NotificationDropdown Component
    participant NotifAPI as Notification API (/api/admin/notifications)
    participant DB as PostgreSQL Database

    Staff->>AdminUI: Đăng nhập tài khoản Nhân viên Kho
    AdminUI->>Header: Render thanh điều hướng quản trị
    Header->>Header: Kiểm tra permissions: ['MANAGE_BOOKS'] (Không có 'MANAGE_ORDERS')
    
    Header->>Dropdown: Truyền props: permissions, role: 'STAFF'
    Note over Dropdown: Tính toán availableTabs động:<br/>Chỉ bật Tab 'KHO HÀNG' (Ẩn Tab 'ĐƠN HÀNG' và 'BÌNH LUẬN')
    
    Dropdown->>NotifAPI: GET /api/admin/notifications
    NotifAPI->>DB: Truy vấn sách tồn kho thấp (stockQty < 10), Đơn chờ duyệt, Bình luận mới
    DB-->>NotifAPI: Trả về đầy đủ dữ liệu toàn hệ thống
    NotifAPI-->>Dropdown: Trả về JSON thông báo
    
    Dropdown->>Dropdown: Lọc dữ liệu theo quyền hạn nhân viên:
    Note over Dropdown: - Đơn hàng: Bỏ qua (không có quyền)<br/>- Bình luận: Bỏ qua (không có quyền)<br/>- Kho hàng: GIỮ LẠI 3 cảnh báo sách sắp hết!
    
    Dropdown->>Header: Cập nhật Badge quả chuông: Chỉ hiển thị số "3" (thay vì số 12 của toàn hệ thống)
    Staff->>Header: Bấm vào quả chuông
    Dropdown-->>Staff: Mở Popup: Chỉ thấy 3 cảnh báo sách sắp hết hàng, footer trỏ link '/admin/books'
```

## 8.6 Sơ đồ Tuần tự 6: Cảnh báo Tồn kho Thấp (Low Stock Alert)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    actor WarehouseStaff as Nhân viên Kho
    participant CheckoutAPI as API Đặt hàng (/api/orders)
    participant DB as PostgreSQL (Bảng books)
    participant AdminWatcher as Hệ thống Giám sát Kho
    participant AdminUI as Bảng điều khiển Kho (/admin/books)

    Customer->>CheckoutAPI: Đặt mua 5 cuốn "Nhà Giả Kim"
    CheckoutAPI->>DB: Trừ tồn kho: stockQty từ 12 cuốn giảm xuống còn 7 cuốn
    
    Note over DB,AdminWatcher: stockQty = 7 (< Ngưỡng an toàn 10 cuốn)
    AdminWatcher->>DB: Truy vấn các đầu sách có stockQty < 10
    DB-->>AdminWatcher: Danh sách 4 cuốn sách chạm ngưỡng báo động đỏ
    
    AdminWatcher->>AdminUI: Kích hoạt Socket / Polling cập nhật số liệu
    AdminUI-->>WarehouseStaff: Quả chuông rung & Huy hiệu đỏ xuất hiện trên hàng sách "Nhà Giả Kim"
    WarehouseStaff->>AdminUI: Bấm "Lọc sách sắp hết hàng"
    AdminUI-->>WarehouseStaff: Hiển thị danh sách cần nhập bổ sung khẩn cấp
    WarehouseStaff->>AdminUI: Bấm "Nhập thêm hàng" -> Điền số lượng 50 cuốn
    AdminUI->>DB: Cập nhật stockQty = 57 cuốn
    DB-->>AdminUI: Thành công -> Huy hiệu cảnh báo biến mất, trở về trạng thái Xanh an toàn
```

---

# CHƯƠNG 9: HỆ THỐNG SƠ ĐỒ CHUYỂN TRẠNG THÁI (STATE MACHINE DIAGRAMS)

## 9.1 Sơ đồ Trạng thái Đơn hàng (OrderStatus State Machine)

```mermaid
graph TD
    StartOrder(["Khách đặt hàng thành công"]) --> PENDING["PENDING (Chờ xác nhận)"]

    PENDING -->|"Nhân viên duyệt đơn hợp lệ"| CONFIRMED["CONFIRMED (Đã xác nhận)"]
    PENDING -->|"Khách hủy / Sai thông tin"| CANCELLED["CANCELLED (Đã hủy)"]

    CONFIRMED -->|"Đóng gói & Bàn giao bưu tá"| SHIPPING["SHIPPING (Đang giao hàng)"]
    CONFIRMED -->|"Khách yêu cầu hủy trước xuất kho"| CANCELLED

    SHIPPING -->|"Giao thành công & Thu tiền"| DELIVERED["DELIVERED (Giao thành công)"]
    SHIPPING -->|"Giao thất bại 3 lần / Khách từ chối"| REFUNDED["REFUNDED (Hoàn tiền / Trả hàng)"]

    DELIVERED -->|"Khiếu nại lỗi in ấn (Đổi trả 7 ngày)"| REFUNDED

    CANCELLED --> EndOrder(["Kết thúc"])
    DELIVERED --> EndOrder
    REFUNDED --> EndOrder
```

## 9.2 Sơ đồ Trạng thái Đánh giá Độc giả (ReviewStatus State Machine)

```mermaid
graph TD
    StartReview(["Độc giả gửi nhận xét & Chấm sao"]) --> PENDING_REV["PENDING (Chờ kiểm duyệt)"]

    PENDING_REV -->|"Nội dung lịch sự, văn minh, đúng sự thật"| APPROVED["APPROVED (Đã duyệt xuất bản)"]
    PENDING_REV -->|"Phát hiện từ ngữ thô tục, spam link xấu"| REJECTED["REJECTED (Bị từ chối)"]

    APPROVED -->|"Ẩn đánh giá nếu có tranh chấp phát sinh"| REJECTED
    REJECTED -->|"Khôi phục hiển thị sau khi xem xét lại"| APPROVED

    APPROVED --> PublicDisplay(["Hiển thị công khai trên /book/[slug]"])
    REJECTED --> HiddenArchive(["Lưu trữ nội bộ, không hiển thị"])
```

---

# CHƯƠNG 10: CẤU TRÚC THÔNG TIN, MA TRẬN PHÂN QUYỀN & BỘ CHỈ SỐ DỮ LIỆU LỚN

## 10.1 Sơ đồ Cấu trúc Thông tin & Điều hướng (Site Map / Information Architecture)

```mermaid
graph TD
    Root["HỆ THỐNG WEBSITE TỔ SÁCH"]

    subgraph StorefrontPages["PHÂN HỆ KHÁCH HÀNG (STOREFRONT)"]
        Home["Trang Chủ (/)<br/>- Hero Banner<br/>- Bestsellers<br/>- New Releases<br/>- Marquee Brand"]
        Catalog["Trang Danh Mục (/catalog)<br/>- Mega Menu 4 Ngành<br/>- Bộ lọc đa chiều<br/>- Tìm kiếm FTS"]
        BookDetail["Chi Tiết Sách (/book/[slug])<br/>- Ảnh bìa đa góc<br/>- Bảng thông số NXB<br/>- Đánh giá sao<br/>- Sách liên quan"]
        Wishlist["Tủ Sách Yêu Thích (/wishlist)<br/>- Danh sách đã lưu<br/>- Chuyển vào giỏ"]
        Cart["Giỏ Hàng (/cart)<br/>- Tăng/giảm số lượng<br/>- Miễn phí ship >= 250k"]
        Checkout["Thanh Toán (/checkout)<br/>- Sổ địa chỉ nhận<br/>- COD / VietQR"]
        OrderSuccess["Đặt Hàng Thành Công (/order/success)"]
        Account["Hồ Sơ Độc Giả (/account/*)<br/>- Lịch sử đơn hàng<br/>- Cập nhật địa chỉ"]
        Auth["Xác Thực (/auth)<br/>- Đăng nhập<br/>- Đăng ký OTP"]
    end

    subgraph AdminPages["PHÂN HỆ QUẢN TRỊ (ADMIN PORTAL)"]
        AdminDashboard["Bảng Điều Khiển (/admin/dashboard)<br/>- Biểu đồ doanh thu<br/>- Tổng số đơn & sách"]
        AdminBooks["Quản Lý Kho Sách (/admin/books)<br/>- CRUD đầu sách<br/>- Nhập hàng loạt CSV<br/>- Cảnh báo tồn < 10"]
        AdminOrders["Quản Lý Đơn Hàng (/admin/orders)<br/>- Lọc State Machine<br/>- Duyệt/Giao/Hủy"]
        AdminReviews["Kiểm Duyệt Đánh Giá (/admin/reviews)<br/>- Duyệt/Ẩn bình luận"]
        AdminStaff["Quản Trị Nhân Sự (/admin/staff)<br/>- Cấp tài khoản Staff<br/>- Ma trận RBAC Checkbox"]
        AdminAudit["Nhật Ký Kiểm Toán (/admin/audit-logs)<br/>- Lịch sử thao tác"]
    end

    Root --> StorefrontPages
    Root --> AdminPages
```

## 10.2 Ma trận Phân quyền Vai trò RBAC (Role-Based Access Control Matrix)

| Chức năng / Quyền hạn hệ thống | Khách Vãng Lai (Guest) | Khách Hàng (Customer) | Nhân Viên Kho (Warehouse) | Nhân Viên Đơn (Order Staff) | Quản Trị Viên (Super Admin) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Xem sách, Tìm kiếm, Lọc danh mục** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Quản lý Giỏ hàng & Wishlist** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Đặt hàng & Quét mã VietQR** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Xem lịch sử đơn & Quản lý địa chỉ** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Gửi đánh giá sao & Bình luận sách** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Trò chuyện cùng Trợ lý AI Chatbot** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Xem Dashboard Doanh thu Admin** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Xem danh sách sách (/admin/books)** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Thêm / Sửa sách & Cập nhật tồn kho**| ❌ | ❌ | ✅ | ❌ | ✅ |
| **Nhận cảnh báo sách sắp hết hàng** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Xem & Duyệt trạng thái Đơn hàng** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Nhận thông báo có Đơn hàng mới** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Kiểm duyệt Đánh giá của khách** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Cấp tài khoản & Gán quyền Staff** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Xem Nhật ký Kiểm toán (Audit Logs)**| ❌ | ❌ | ❌ | ❌ | ✅ |

## 10.3 Bộ Chỉ số Dữ liệu Thực nghiệm (Big Data & Seed Metrics)

Hệ thống đã triển khai pipeline nạp dữ liệu quy mô lớn, vượt 100% các chỉ tiêu cam kết trong Đề cương Proposal:

```
+-----------------------------------------------------------------------------------------+
|                  BẢNG SO SÁNH CHỈ SỐ DỮ LIỆU ĐỀ CƯƠNG PROPOSAL & THỰC TẾ               |
+--------------------------+---------------------+-----------------------+----------------+
| Thực thể CSDL            | Cam kết Proposal    | Thực tế đạt được      | Tỷ lệ hoàn thành|
+--------------------------+---------------------+-----------------------+----------------+
| Đầu sách (books)         | 5.000+ cuốn         | 5.125 đầu sách thật   | 102.5% (Vượt)  |
| Tác giả (authors)        | 2.000+ tác giả      | 2.790 tác giả         | 139.5% (Vượt)  |
| Danh mục DDC (categories)| 150+ danh mục       | 169 danh mục chuẩn DDC| 112.6% (Vượt)  |
| Đánh giá (reviews)       | 50.000+ đánh giá    | 50.000 dataset mô phỏng| 100.0% (Đạt)   |
| Sự kiện hành vi (events) | 200.000+ events     | 200.000 events log    | 100.0% (Đạt)   |
| Đơn hàng mẫu (orders)    | 10.000+ đơn hàng    | 10.000 orders dataset | 100.0% (Đạt)   |
+--------------------------+---------------------+-----------------------+----------------+
```

---

# CHƯƠNG 11: KẾ HOẠCH BẢO VỆ ĐỒ ÁN & BỘ CÂU HỎI PHẢN BIỆN CHUYÊN SÂU (DEFENSE GUIDE)

## 11.1 Kịch bản Demo 15 Phút Chuẩn Mực Trước Hội Đồng

1. **Phút 01 — 03: Giới thiệu Tổng quan Đề tài & Bối cảnh Nghiệp vụ (Slide):**
   - Nêu rõ vấn nạn sách giả và lý do lựa chọn mô hình **B2C Thuần túy** thay vì C2C.
   - Trình bày kiến trúc phân tầng Next.js 16 + PostgreSQL Supabase + RAG AI.
2. **Phút 04 — 07: Demo Trải nghiệm Mua hàng Khách hàng (Storefront):**
   - Lướt trang chủ: Thể hiện Design System phối màu `#0B1F3A` và `#F5A623`, font chữ Plus Jakarta Sans mượt mà 60fps.
   - Thao tác tại `/catalog`: Lọc đa chiều danh mục 3 cấp, lọc khoảng giá, tìm kiếm từ khóa không dấu.
   - Thao tác tại `/book/[slug]`: Xem thông số NXB, ảnh bìa sắc nét, thêm vào giỏ hàng và tủ sách yêu thích.
   - Thao tác tại `/checkout`: Điền địa chỉ nhận hàng, chọn phương thức VietQR $\to$ Quét mã thanh toán hiển thị tức thì.
3. **Phút 08 — 10: Demo Trợ lý Ảo AI Chatbot RAG Thông minh:**
   - Mở bong bóng chat nổi ở góc phải dưới màn hình.
   - Đặt câu hỏi tâm lý: *"Tôi đang rất buồn và cảm thấy cô đơn, hãy gợi ý cho tôi"* $\to$ AI thấu cảm và gợi ý sách chữa lành kèm Thẻ sách động.
   - Đặt câu hỏi chính sách: *"Ở đây có được kiểm tra hàng trước khi nhận không và phí ship thế nào?"* $\to$ AI phản hồi ngay lập tức chính sách đồng kiểm 100% và freeship từ 250k.
   - Đặt câu hỏi khiếu nại: *"Tôi muốn có gmail của chủ quán để khiếu nại"* $\to$ AI cung cấp chuẩn xác email Founder `hnhngyndng@gmail.com` và cam kết xử lý trong 24h.
4. **Phút 11 — 13: Demo Phân hệ Quản trị & Cơ chế Phân quyền RBAC:**
   - Đăng nhập tài khoản **Nhân viên Kho**: Chỉ thấy menu Quản lý sách; quả chuông thông báo chỉ hiện cảnh báo sách sắp hết hàng (tự động ẩn đơn hàng).
   - Đăng nhập tài khoản **Nhân viên Đơn hàng**: Chỉ thấy menu Xử lý đơn hàng; quả chuông chỉ hiện thông báo đơn mới (tự động ẩn kho).
   - Đăng nhập tài khoản **Super Admin**: Thấy toàn quyền Dashboard doanh thu, bảng Audit Logs và trang cấp quyền Checkbox động.
5. **Phút 14 — 15: Kết luận & Sẵn sàng Phản biện Q&A:**
   - Tóm tắt các chỉ số đạt được: 5.125 đầu sách, kiểm soát tồn kho ACID an toàn, AI RAG thông minh.
   - Cảm ơn Hội đồng và chuyển sang phần hỏi đáp phản biện.

## 11.2 Bộ 10 Câu hỏi Phản biện Trọng điểm & Câu trả lời Mẫu Đạt Điểm Tuyệt Đối

### Câu hỏi 1: "Tại sao nhóm chọn mô hình B2C bán sách mới mà không làm sàn thương mại điện tử C2C đa người bán?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, ngành sách có đặc thù rất nhạy cảm về vấn đề bản quyền và chất lượng ấn phẩm. Mô hình C2C hiện nay trên thị trường gặp phải vấn đề nhức nhối là sách giả, sách in lậu tràn lan. Nhóm định vị Tổ Sách là chuỗi bán lẻ B2C chính thống để kiểm soát chất lượng từ khâu nhập sách của NXB đến tay độc giả. Về mặt kỹ thuật phần mềm, việc chọn B2C cho phép nhóm dồn toàn lực nghiên cứu sâu vào các bài toán cốt lõi: Giao dịch ACID chống Over-selling, Tối ưu hóa render 60fps, Phân quyền RBAC động đa cấp bậc và RAG AI Chatbot, thay vì bị phân tán vào nghiệp vụ ví điện tử đa nhà bán của sàn C2C."*

### Câu hỏi 2: "Cơ chế phân quyền của nhóm hoạt động như thế nào? Nếu nhân viên kho cố tình dùng Postman gọi API duyệt đơn hàng thì sao?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nhóm áp dụng kiến trúc **Bảo mật đa tầng (Defense in Depth)**:  
> 1. **Tại tầng giao diện:** Sidebar và Quả chuông thông báo tự động lọc theo quyền `MANAGE_BOOKS`, ẩn đi các nút và thông báo của đơn hàng để giảm nhiễu công việc.  
> 2. **Tại tầng Edge Middleware:** Kiểm tra token JWT hợp lệ từ HttpOnly Cookie.  
> 3. **Tại tầng API Route (Chốt chặn quyết định):** API `/api/admin/orders/[id]/status` bắt buộc truy vấn bảng `staff_permissions` để kiểm tra quyền `MANAGE_ORDERS`. Dù nhân viên kho có dùng Postman hay sửa mã JavaScript trên trình duyệt, Server sẽ lập tức từ chối và trả về mã lỗi **403 Forbidden** cùng việc ghi nhận vết vào bảng `admin_audit_logs`."*

### Câu hỏi 3: "Làm thế nào để hệ thống đảm bảo 2 khách hàng cùng đặt cuốn sách cuối cùng trong kho không bị lỗi bán âm tồn kho?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nhóm giải quyết bằng **Giao dịch Cơ sở dữ liệu nguyên tử (`prisma.$transaction`)** trên PostgreSQL:  
> Khi đơn hàng được gửi lên, Server khóa truy vấn kiểm tra `stockQty`. Request nào đến trước sẽ thực hiện trừ kho thành công (`decrement: quantity`). Request đến sau một phần nghìn giây khi kiểm tra sẽ thấy `stockQty < quantity`, transaction lập tức rollback toàn bộ và thông báo cho khách hàng là sách vừa hết hàng. Nhờ đó, số lượng tồn kho trong CSDL không bao giờ bị âm."*

### Câu hỏi 4: "Tại sao quả chuông thông báo lại phải phân chia theo quyền hạn mà không để tất cả nhân viên cùng thấy?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, đây là nguyên tắc **Giảm tải nhận thức (Cognitive Load Reduction)** và **Phòng chống mệt mỏi cảnh báo (Alert Fatigue)** trong thiết kế hệ thống vận hành doanh nghiệp:  
> Nhân viên kho làm việc theo ca chỉ cần quan tâm đến việc đóng hàng và nhập kho. Nếu quả chuông liên tục báo có đánh giá bình luận mới hoặc khiếu nại CSKH mà họ không có thẩm quyền giải quyết, việc này vừa gây xao nhãng công việc vừa tạo cảm giác ức chế. Phân quyền thông báo giúp đúng người nhận đúng việc, tăng hiệu suất vận hành."*

### Câu hỏi 5: "AI Chatbot trong hệ thống giải quyết vấn đề gì khác biệt so với việc nhúng ChatGPT thông thường?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nếu nhúng ChatGPT thông thường, mô hình sẽ không hề biết Tổ Sách hiện đang có những đầu sách nào, giá bao nhiêu, hay khách hàng đang có đơn hàng nào, thậm chí sẽ bịa ra các cuốn sách không có thật (Hallucination).  
> AI Chatbot của Tổ Sách sử dụng kiến trúc **RAG (Retrieval-Augmented Generation)**: AI chỉ đóng vai trò là bộ não hiểu ngôn ngữ tự nhiên, còn toàn bộ dữ liệu sách và tình trạng đơn hàng được truy vấn trực tiếp theo thời gian thực từ CSDL PostgreSQL của Tổ Sách rồi mới nạp vào ngữ cảnh để AI trả lời. Do đó câu trả lời chính xác 100% theo thực tế kinh doanh."*

### Câu hỏi 6: "Nếu Google Gemini bị mất mạng hoặc hết quota thì AI Chatbot có bị sập (crash) không?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, hệ thống được thiết kế theo nguyên lý **Khả năng chịu lỗi & Tự suy giảm mềm dẻo (Fault Tolerance & Graceful Degradation)**:  
> Nhóm đã tích hợp sẵn Tầng Tri thức Nội bộ gồm 14 miền nghiệp vụ cốt lõi (Founder, Khiếu nại, Sách thật, Đóng gói, Freeship, Đồng kiểm, Đổi trả...). Nếu API bên ngoài bị lỗi hoặc hết quota, hệ thống tự động trượt mượt mà về bộ xử lý nội bộ này, phản hồi ngay lập tức trong 50ms mà người dùng không hề nhận thấy gián đoạn."*

### Câu hỏi 7: "Tại sao nhóm chọn Next.js App Router thay vì tách biệt hoàn toàn React frontend và Node.js Express backend?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, đối với sàn thương mại điện tử chuyên về sách, **SEO là yếu tố sống còn**. Nếu dùng React SPA thuần túy, nội dung được render bằng JavaScript ở client, Google bot rất khó lập chỉ mục hàng nghìn đầu sách.  
> Next.js App Router cung cấp mô hình **React Server Components (RSC)**: Kết xuất HTML hoàn chỉnh tại Server, nạp sẵn Schema JSON-LD cho từng cuốn sách, tải trang tức thì. Đồng thời, kiến trúc Fullstack trong một codebase giúp chia sẻ trọn vẹn kiểu dữ liệu TypeScript (End-to-End Type Safety) giữa Client và Server, loại bỏ hoàn toàn việc viết lặp lại các interface DTO."*

### Câu hỏi 8: "Cơ chế bảo mật Token của nhóm có an toàn trước tấn công XSS và CSRF không?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nhóm hoàn toàn không lưu Token trong `localStorage` (nơi rất dễ bị mã độc JavaScript đánh cắp qua lỗ hổng XSS). Token được lưu trong **HttpOnly Cookie** với cờ `SameSite=Lax` và `Path=/`. JavaScript hoàn toàn không thể chạm tới cookie này. Đồng thời, các thao tác thay đổi dữ liệu nhạy cảm đều thông qua API POST/PATCH có kiểm tra origin và JSON format, triệt tiêu nguy cơ tấn công CSRF."*

### Câu hỏi 9: "Làm thế nào để hệ thống duy trì tốc độ tải trang dưới 100ms khi CSDL có hơn 5.000 đầu sách?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nhóm áp dụng 3 giải pháp đồng bộ:  
> 1. **Chỉ mục B-Tree:** Đánh chỉ mục trên các cột thường xuyên lọc và tìm kiếm (`slug`, `isbn`, `is_active`, `avg_rating`).  
> 2. **Connection Pooling:** Sử dụng PgBouncer ở chế độ Transaction Mode để hàng trăm kết nối dùng chung pool kết nối nhỏ vào PostgreSQL, không bị tốn chi phí thiết lập kết nối SSL mỗi lần query.  
> 3. **Phân trang & Giới hạn trường:** Áp dụng Pagination chặt chẽ và chỉ truy vấn các trường cần thiết (`select`), không bao giờ dùng `SELECT *` bừa bãi."*

### Câu hỏi 10: "Mô hình phân chia công việc giữa hai thành viên trong nhóm thể hiện tính chuyên nghiệp như thế nào?"
> **Trả lời mẫu:**  
> *"Dạ thưa Thầy/Cô, nhóm phân định trách nhiệm rất rõ ràng theo hai trục trụ cột của ngành Kỹ thuật Phần mềm:  
> - Bạn **Nguyễn Đăng Hanh** đảm nhiệm toàn bộ nền tảng Kỹ thuật Hệ thống: từ việc thiết kế Schema CSDL 14 bảng, bảo đảm giao dịch ACID, phân quyền RBAC, đến việc kết nối RAG AI Chatbot.  
> - Bạn **Nguyễn Mạnh Hòa** đảm nhiệm toàn bộ Trải nghiệm Người dùng: từ việc xây dựng Design System Figma, chọn bảng màu nhận diện, font chữ Plus Jakarta Sans, triệt tiêu xô lệch layout (Zero CLS), đến các hiệu ứng chuyển động 60fps mượt mà.  
> Hai phần việc khớp nối hoàn hảo với nhau thông qua hợp đồng dữ liệu TypeScript chặt chẽ, tạo nên sản phẩm hoàn chỉnh cả về 'nội lực kỹ thuật' lẫn 'diện mạo thẩm mỹ'."*

## 11.3 Kết luận & Định hướng Phát triển
- **Kết luận:** Đề tài **"Tổ Sách"** đã hiện thực hóa trọn vẹn mục tiêu đề ra trong Đề cương Proposal. Hệ thống vận hành ổn định, giao diện hiện đại, nghiệp vụ kho vận chặt chẽ, bảo mật đa tầng và tích hợp AI thông minh.
- **Định hướng tương lai:**
  1. Tích hợp thanh toán trực tuyến qua VNPAY / MoMo bên cạnh VietQR.
  2. Ứng dụng Vector Database (pgvector) để tìm kiếm sách tương đồng theo ngữ nghĩa sâu (Semantic Vector Search).
  3. Xây dựng ứng dụng di động đa nền tảng (React Native) đồng bộ tài khoản với hệ sinh thái web.

---

# CHƯƠNG 12: TỔNG KẾT TOÀN DIỆN DỰ ÁN TỪ ĐẦU ĐẾN CUỐI (A - Z) DÀNH CHO 2 THÀNH VIÊN ÔN TẬP VÀ BÁO CÁO

> **Tài liệu đọc nhanh trước khi bước vào phòng bảo vệ:**  
> Bản tổng kết này giúp **Nguyễn Đăng Hanh** và **Nguyễn Mạnh Hòa** nắm chắc toàn bộ hành trình công nghệ, cấu trúc hệ thống, phân công nhiệm vụ và kịch bản phối hợp để tự tin trả lời bất kỳ câu hỏi nào của Hội đồng.

---

## 12.1 Bức Tranh Toàn Cảnh: Dự Án "Tổ Sách" Đã Làm Được Những Gì?

Hệ thống **Tổ Sách** là một nền tảng thương mại điện tử chuyên sâu cho thị trường sách theo mô hình **B2C (Business-to-Consumer)**, được xây dựng hoàn chỉnh từ con số 0 với 4 trụ cột chính:

```
+----------------------------------------------------------------------------------------------------+
|                                HỆ SINH THÁI THƯƠNG MẠI ĐIỆN TỬ TỔ SÁCH                             |
+----------------------------------------------------------------------------------------------------+
|  1. CỬA HÀNG KHÁCH HÀNG (Storefront B2C)   |  2. QUẢN TRỊ & VẬN HÀNH (Admin Portal)               |
|  - Trang chủ động, Banner, 60fps GPU        |  - AppShell cách ly, Dashboard doanh thu thời gian thực|
|  - Cây danh mục 3 tầng, Lọc đa chiều        |  - Quản lý kho sách 5.125 cuốn, Import/Export CSV    |
|  - Giỏ hàng thông minh (Smart Cart Merge)  |  - Vòng đời đơn hàng State Machine & Hủy hoàn tồn kho|
|  - Thanh toán VietQR MBBank tự động         |  - Phân quyền động nhân viên (RBAC) & Quả chuông lọc |
|  - Tra cứu tài khoản, OTP Gmail bảo mật    |  - Nhật ký kiểm toán an ninh (Admin Audit Logs)      |
+--------------------------------------------+------------------------------------------------------+
|  3. CÔNG NGHỆ NÂNG CAO THEO PROPOSAL       |  4. DỮ LIỆU LỚN & TRÍ TUỆ NHÂN TẠO                   |
|  - Mục 3.1: Hybrid Recommendation (5 yếu tố)|  - 5.125 sách thật, 2.790 tác giả, 169 danh mục DDC |
|  - Mục 3.2: Elasticsearch 8.x + Fuzzy      |  - 50k đánh giá, 200k sự kiện hành vi, 10k đơn hàng  |
|  - Mục 3.4: Redis In-Memory Cache (TTL 30d)|  - Trợ lý AI RAG Chatbot (Gemini 1.5 Flash-Lite)     |
|  - An toàn giao dịch ACID chống bán âm kho |  - 14 miền tri thức nội bộ xử lý phản hồi trong 50ms |
+----------------------------------------------------------------------------------------------------+
```

---

## 12.2 Hành Trình Phát Triển 8 Giai Đoạn Từ Đầu Đến Cuối

### Giai đoạn 1: Khởi tạo Kiến trúc & Thiết kế Cơ sở Dữ liệu Chuẩn 3NF
- **Khởi tạo Codebase:** Sử dụng Next.js 15/16 App Router với TypeScript nghiêm ngặt, Tailwind CSS và ESLint.
- **Thiết kế Database:** Xây dựng lược đồ CSDL trên **PostgreSQL (Supabase)** gồm **14 bảng quan hệ chuẩn 3NF**, phân định rõ các bảng thực thể (`books`, `authors`, `categories`, `users`, `orders`), bảng hồ sơ mở rộng (`user_profiles`), bảng trung gian N:N (`book_authors`, `book_categories`), bảng bảo mật (`permissions`, `staff_permissions`, `admin_audit_logs`) và bảng dữ liệu lớn (`user_behavior_events`).
- **Quản lý Schema bằng Prisma ORM:** Áp dụng cơ chế Migration, Connection Pooling qua PgBouncer cổng 6543 giúp chịu tải cao.

### Giai đoạn 2: Xác thực Bảo mật & Phân Quyền Vai Trò (Auth & RBAC)
- **Cơ chế Token an toàn:** Mã hóa mật khẩu bằng Bcrypt 10 vòng; cấp phát token JWT lưu hoàn toàn trong **HttpOnly Cookie** với cờ `SameSite=Lax`, triệt tiêu rủi ro XSS và CSRF.
- **Edge Guard Proxy (proxy.ts):** Đón đầu cơ chế của Next.js 16, kiểm soát phiên đăng nhập tại biên (Edge), tự động bảo vệ các tuyến đường riêng tư như `/checkout`, `/account/*`, và phân hệ `/admin/*`.
- **Hệ thống gửi mã OTP qua Gmail:** Tích hợp SMTP gửi mã xác thực tài khoản 6 chữ số với giao diện email HTML mang thương hiệu Tổ Sách.

### Giai đoạn 3: Xây dựng Trải nghiệm Mua Hàng Độc Giả (Storefront B2C)
- **Header Chống Giật Bố Cục (Zero CLS):** Giữ cố định kích thước và vị trí các thành phần tài khoản, giỏ hàng khi người dùng đăng nhập/đăng xuất.
- **Giỏ Hàng Thông Minh Đa Thiết Bị (Smart Cart Merge):** Khi khách vãng lai thêm sách vào giỏ rồi mới đăng nhập, hệ thống tự động gộp giỏ hàng tạm với giỏ hàng trên tài khoản theo thuật toán thông minh, tự động đồng bộ ngầm lên máy chủ.
- **Hiệu Ứng Ném Sách Vào Giỏ Parabol 60fps:** Tính toán quỹ đạo toán học Parabol, tận dụng card đồ họa GPU (`translate3d`) mang lại cảm giác mua sắm sống động.
- **Điều Hướng Danh Mục Phân Cấp 3 Tầng:** Hỗ trợ duyệt cây ngành hàng (Ngành hàng lớn $\rightarrow$ Chuyên mục $\rightarrow$ Chi tiết), thanh lọc đa chiều theo giá tiền, tag, và tình trạng còn hàng.

### Giai đoạn 4: Quy Trình Đặt Hàng & Thanh Toán Tự Động (Checkout & VietQR)
- **Chọn Lọc Sách Cần Mua (Selective Checkout):** Cho phép tích chọn những cuốn muốn mua trong giỏ, không bắt buộc mua toàn bộ.
- **Sổ Địa Chỉ Hành Chính 3 Cấp:** Tích hợp bộ chọn Tỉnh/Thành phố $\rightarrow$ Quận/Huyện $\rightarrow$ Phường/Xã chuẩn hành chính Việt Nam.
- **Thanh Toán Tự Động VietQR MBBank:** Tự sinh chuỗi mã chuẩn Napas 247 kèm mã đơn `TS-YYYYMMDD-XXXX` và số tiền chính xác, khách hàng chỉ cần quét app ngân hàng trong 3 giây.
- **Giao Dịch ACID Chống Bán Âm Kho (`prisma.$transaction`):** Khóa hàng nguyên tử, nếu 2 người cùng mua cuốn cuối cùng, người đến trước sẽ mua thành công, người đến sau nhận thông báo hết hàng thân thiện mà kho không bao giờ bị âm.

### Giai đoạn 5: Phân Hệ Quản Trị & Vận Hành Doanh Nghiệp (Admin Portal)
- **AppShell Cách Ly Tuyệt Đối:** Giao diện Admin chạy trên layout riêng biệt, thanh điều hướng Sidebar chuyên nghiệp.
- **Realtime Dashboard:** Thống kê tổng doanh thu, số đơn hàng, số sách trong kho với hiệu ứng đếm số Count-up và biểu đồ sóng doanh thu.
- **Quản Lý Kho Sách Toàn Diện:** Thêm, sửa, xóa sách, nhập/xuất file CSV hàng loạt, cập nhật số lượng tồn kho tức thì, gắn cờ Bestseller/Nổi bật.
- **Quản Lý Vòng Đời Đơn Hàng Theo State Machine:** Quy trình chuẩn: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPING` $\rightarrow$ `DELIVERED` (hoặc `CANCELLED`). Hủy đơn tự động hoàn trả tồn kho (Stock Rollback). Khách hàng có quyền tự hủy đơn khi đơn còn ở trạng thái `PENDING`.
- **Quản Lý Nhân Sự & Phân Quyền Ma Trận RBAC:** Cấp tài khoản nhân viên và gán quyền linh hoạt (`MANAGE_BOOKS`, `MANAGE_ORDERS`, `MANAGE_USERS`...). Quả chuông thông báo thông minh tự động lọc đúng việc theo quyền hạn (nhân viên kho chỉ thấy cảnh báo hết hàng, nhân viên đơn chỉ thấy đơn mới).
- **Nhật Ký Kiểm Toán An Ninh (Audit Logs):** Ghi vết toàn bộ hành vi thêm/sửa/xóa của ban quản trị để phục vụ đối soát, chống gian lận.

### Giai đoạn 6: Triển Khai Các Hạng Mục Nâng Cao Đúng Đề Cương Proposal
- **Mục 3.1 Proposal — Động cơ Gợi ý Sách Lai ghép 5 Trọng số (Hybrid Recommendation):**
  Kết hợp đồng thời 5 yếu tố: Tương đồng Thể loại (30%) + Cùng Tác giả (25%) + Hành vi Đọc quá khứ (20%) + Điểm Đánh giá & Độ phổ biến (15%) + Phân khúc Giá tương đương (10%).
- **Mục 3.2 Proposal — Cụm Tìm kiếm Thông minh Elasticsearch 8.x:**
  Tích hợp bộ phân tích tiếng Việt (Vietnamese Analyzer), loại bỏ Stop words, tự động sửa lỗi chính tả bằng thuật toán mờ Fuzzy khoảng cách Levenshtein $\le 2$, phân nhóm Faceted Aggregations và cơ chế chuyển tiếp an toàn (Fallback) sang PostgreSQL Full-Text Search.
- **Mục 3.4 Proposal — Bộ nhớ đệm In-Memory Redis Cache & Recently Viewed:**
  Lưu trữ danh sách "Sách vừa xem gần đây" phân vùng theo người dùng với thời gian sống (TTL) 30 ngày, giảm tải 85% truy vấn dư thừa vào Database chính.

### Giai đoạn 7: Tích Hợp Trí Tuệ Nhân Tạo RAG Chatbot (Gemini 1.5 Flash-Lite)
- **Kiến trúc RAG Thực thụ:** Không chỉ trả lời chung chung, Chatbot kết nối trực tiếp với CSDL PostgreSQL của Tổ Sách để nắm bắt giá cả, số lượng tồn kho và tình trạng đơn hàng thực tế của khách.
- **14 Miền Tri Thức Nội Bộ Tự Dự Phòng:** Tích hợp bộ tri thức thương hiệu (Founder, cam kết sách thật 100%, đóng gói 3 lớp, freeship 250k, chính sách đồng kiểm, đổi trả 7 ngày). Khi API ngoài gặp sự cố, Chatbot tự động phản hồi trong 50ms, đảm bảo tính sẵn sàng 99.99%.
- **Trải Nghiệm Thấu Cảm:** Chatbot biết lắng nghe cảm xúc người đọc (buồn, cô đơn, mất định hướng) để gợi ý đúng cuốn sách chữa lành kèm thẻ sách trực quan để thêm ngay vào giỏ hàng.

### Giai đoạn 8: Pipeline Nạp Dữ Liệu Lớn & Chuẩn Bị Báo Cáo
- **Bộ dữ liệu thực tế khổng lồ:** Nạp và làm sạch thành công **5.125 cuốn sách thật** từ Tiki CDN, **2.790 tác giả**, **169 danh mục chuẩn DDC**, **50.000 đánh giá**, **200.000 sự kiện hành vi** và **10.000 đơn hàng**.
- **Chuẩn hóa Commit Git:** Toàn bộ 60 commit trong lịch sử mã nguồn được viết lại bằng tiếng Việt có dấu chuẩn quy cách, thể hiện tác phong kỹ sư chuyên nghiệp.
- **Bộ tài liệu báo cáo toàn diện:** Biên soạn đầy đủ báo cáo học thuật `Document_Project.md`, kịch bản thuyết trình demo, và bộ câu hỏi phản biện bảo vệ đồ án.

---

## 12.3 Phân Công Vai Trò Cụ Thể Của 2 Thành Viên Khi Đi Báo Cáo

| Thành Viên | Vai Trò Chính | Các Phần Việc Đảm Nhiệm Cốt Lõi | Nội Dung Trình Bày Trước Hội Đồng |
| :--- | :--- | :--- | :--- |
| **Nguyễn Đăng Hanh**<br/>(`hnhngyndng@gmail.com`) | **Lead Developer & System Architect** | - Thiết kế lược đồ CSDL PostgreSQL 14 bảng chuẩn 3NF.<br/>- Xây dựng Backend API Routes và Server Actions.<br/>- Đảm bảo an toàn giao dịch ACID kiểm soát kho sách.<br/>- Triển khai bảo mật Edge Guard, JWT HttpOnly và phân quyền RBAC.<br/>- Xây dựng động cơ gợi ý Hybrid Recommendation (Mục 3.1) và tìm kiếm Elasticsearch 8.x (Mục 3.2).<br/>- Xây dựng kiến trúc RAG AI Chatbot kết nối Gemini. | **Thuyết trình phần "Nội lực Kỹ thuật":**<br/>1. Kiến trúc hệ thống phân tầng và CSDL 14 bảng.<br/>2. Cơ chế Transaction ACID chống bán âm tồn kho.<br/>3. Ma trận phân quyền RBAC đa cấp độ.<br/>4. Hoạt động của thuật toán tìm kiếm mờ và AI RAG. |
| **Nguyễn Mạnh Hòa**<br/>(`manhhoa02042005@gmail.com`)| **Co-Developer & Frontend UX Lead** | - Xây dựng Design System Figma chuẩn nhận diện thương hiệu.<br/>- Lựa chọn bảng màu Hải quân `#0B1F3A` và Cam mật `#F5A623`, font chữ Plus Jakarta Sans.<br/>- Phát triển giao diện Storefront B2C và Admin AppShell.<br/>- Tối ưu hiệu năng 60fps và triệt tiêu giật layout (Zero CLS).<br/>- Lập trình hiệu ứng ném sách Parabol bằng GPU `translate3d`.<br/>- Xây dựng giỏ hàng thông minh (Smart Cart Merge), quy trình Checkout VietQR và bộ lọc danh mục đa tầng. | **Thuyết trình phần "Trải nghiệm & Nghiệp vụ":**<br/>1. Bối cảnh thị trường, vấn nạn sách lậu và mô hình B2C.<br/>2. Trực tiếp thao tác chuột demo hành trình mua sách của khách hàng.<br/>3. Trình diễn hiệu ứng vi tương tác 60fps và thanh toán VietQR.<br/>4. Demo quy trình duyệt đơn và quản lý kho phía Admin. |

---

## 12.4 Checklist 5 Bước Demo Chuẩn Điểm Cao Trước Hội Đồng

1. **Bước 1: Mở Trang chủ & Thanh Tìm kiếm (Hòa nói - 3 phút):**
   - Giới thiệu giao diện, tính năng Zero CLS, font chữ đẹp mắt.
   - Thao tác gõ sai chính tả trên thanh tìm kiếm: gõ *"dac nhan tam"* hoặc *"pytnhon"* $\rightarrow$ Hệ thống vẫn tìm ra đúng sách nhờ Elasticsearch Fuzzy Levenshtein $\le 2$.
2. **Bước 2: Xem Chi tiết Sách & Thêm Vào Giỏ Hàng (Hòa nói - 2 phút):**
   - Bấm vào cuốn sách, chỉ rõ thông số ISBN, NXB, số trang.
   - Bấm nút "Thêm vào giỏ" $\rightarrow$ Cuốn sách bay hình vòng cung Parabol 60fps vào chiếc giỏ hàng góc trên.
3. **Bước 3: Chốt Đơn & Thanh Toán VietQR (Hòa nói - 3 phút):**
   - Vào `/checkout`, chọn địa chỉ Hà Nội $\rightarrow$ Cầu Giấy $\rightarrow$ Dịch Vọng Hậu.
   - Chọn VietQR $\rightarrow$ Mã QR ngân hàng hiển thị tức thì với đúng số tiền và mã đơn.
4. **Bước 4: Chatbot Tư Vấn & Gợi Ý Sách Thông Minh (Hanh nói - 3 phút):**
   - Bật bong bóng chat: Hỏi *"Tôi đang cảm thấy áp lực và buồn bã"* $\rightarrow$ AI đồng cảm và trả về thẻ sách tâm lý trực tiếp từ CSDL.
   - Hỏi *"Chính sách đổi trả và freeship thế nào?"* $\rightarrow$ AI trả lời ngay chính sách 7 ngày và freeship từ 250k.
5. **Bước 5: Đăng Nhập Phân Hệ Admin & Chứng Minh RBAC (Hanh nói - 4 phút):**
   - Đăng nhập tài khoản Nhân viên Kho: Quả chuông chỉ báo cảnh báo sách sắp hết hàng; không có quyền duyệt đơn.
   - Đăng nhập Super Admin: Mở Dashboard doanh thu, bảng Audit Logs và giải thích cơ chế Transaction ACID khóa kho khi khách mua hàng.

---
*Bản tài liệu tổng hợp toàn diện được biên soạn chuẩn mực phục vụ công tác Viết Quyển Báo Cáo Đồ Án Tốt Nghiệp và Bảo Vệ Trước Hội Đồng Chấm Thi Công Nghệ Thông Tin.*

