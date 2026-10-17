import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  coverUrl: string | null;
  authorName: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: Tối đa 20 tin nhắn / 60 giây từ 1 IP (H4)
    const chatLimit = await checkRateLimit(`chat_ip:${clientIp}`, 20, 60);
    if (!chatLimit.success) {
      return NextResponse.json(
        { error: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút trước khi tiếp tục trò chuyện!' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const message: string = (body.message || '').trim();
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'Nội dung tin nhắn không được để trống' }, { status: 400 });
    }

    const lowerMsg = message.toLowerCase();

    // =========================================================================
    // I. BỘ NHẬN DIỆN Ý ĐỊNH ĐỘC QUYỀN VỀ THƯƠNG HIỆU & VẬN HÀNH TỔ SÁCH (CSKH)
    // =========================================================================

    // 1. Người sáng lập, Founder, Đội ngũ quản trị
    const isFounderInfo =
      lowerMsg.includes('ai là chủ') ||
      lowerMsg.includes('chủ quán là ai') ||
      lowerMsg.includes('chủ tiệm là ai') ||
      lowerMsg.includes('chủ shop là ai') ||
      lowerMsg.includes('founder') ||
      lowerMsg.includes('ai sáng lập') ||
      lowerMsg.includes('ai tạo ra') ||
      lowerMsg.includes('người tạo ra') ||
      lowerMsg.includes('ai lập trình') ||
      lowerMsg.includes('nguyễn đăng hanh') ||
      lowerMsg.includes('nguyễn mạnh hòa');

    if (isFounderInfo) {
      return NextResponse.json({
        reply:
          '👤 **Đội ngũ sáng lập & Phát triển Hệ sinh thái Tổ Sách:**\n\n' +
          '1. **Nguyễn Đăng Hanh:** Founder & Lead System Architect\n' +
          '   - Phụ trách kiến trúc hệ thống, Backend, CSDL PostgreSQL, bảo mật RBAC & công nghệ RAG AI.\n' +
          '   - Email: `hnhngyndng@gmail.com`\n\n' +
          '2. **Nguyễn Mạnh Hòa:** Co-Founder & Head of Product Design\n' +
          '   - Phụ trách thiết kế trải nghiệm người dùng UI/UX, Design System, hiệu ứng chuyển động 60fps.\n' +
          '   - Email: `manhhoa02042005@gmail.com`\n\n' +
          'Cả hai nhà sáng lập đều trực tiếp theo dõi chất lượng vận hành và tiếp nhận mọi góp ý của độc giả!',
        suggestedBooks: [],
        source: 'knowledge-founder',
      });
    }

    // 2. Khiếu nại, phản ánh, liên hệ chủ quán / quản trị viên
    const isComplaintOrContact =
      lowerMsg.includes('khiếu nại') ||
      lowerMsg.includes('chủ quán') ||
      lowerMsg.includes('chủ tiệm') ||
      lowerMsg.includes('gmail') ||
      lowerMsg.includes('email') ||
      lowerMsg.includes('phản ánh') ||
      lowerMsg.includes('liên hệ') ||
      lowerMsg.includes('hotline') ||
      lowerMsg.includes('gặp admin') ||
      lowerMsg.includes('số điện thoại') ||
      lowerMsg.includes('gặp nhân viên') ||
      lowerMsg.includes('tổng đài');

    if (isComplaintOrContact) {
      return NextResponse.json({
        reply:
          'Chào bạn, Tổ Sách rất tiếc nếu bạn có trải nghiệm chưa trọn vẹn và chúng tôi luôn cam kết bảo vệ 100% quyền lợi của bạn:\n\n' +
          '📧 **Email tiếp nhận phản ánh & khiếu nại của Quản trị viên:**\n' +
          '- **Gmail Chủ quán / Founder:** `hnhngyndng@gmail.com` (Nguyễn Đăng Hanh - Lead System Architect)\n' +
          '- **Email hỗ trợ dịch vụ khách hàng:** `support@tosach.vn`\n\n' +
          '📞 **Hotline hỗ trợ 24/7:** **0988.123.456** (8:00 - 22:00 hàng ngày, kể cả Thứ 7 & CN)\n' +
          '🏢 **Văn phòng đại diện & Kho trung tâm:** Nhà sách Tổ Sách, Hà Nội, Việt Nam\n\n' +
          '⏱️ Tổ Sách cam kết phản hồi và giải quyết thỏa đáng khiếu nại trong vòng **24 giờ làm việc**. Mọi quyền lợi đổi trả (miễn phí trong 7 ngày) của bạn đều được bảo đảm 100%!',
        suggestedBooks: [],
        source: 'knowledge-contact',
      });
    }

    // 3. Giới thiệu Tổ Sách, Slogan, Ý nghĩa thương hiệu
    const isBrandInfo =
      lowerMsg.includes('tổ sách là gì') ||
      lowerMsg.includes('ý nghĩa') ||
      lowerMsg.includes('slogan') ||
      lowerMsg.includes('khẩu hiệu') ||
      lowerMsg.includes('giới thiệu tổ sách') ||
      lowerMsg.includes('về tổ sách') ||
      lowerMsg.includes('sách về tổ') ||
      (lowerMsg.includes('tổ sách') && (lowerMsg.includes('là ai') || lowerMsg.includes('thế nào')));

    if (isBrandInfo) {
      return NextResponse.json({
        reply:
          '🦉 **Giới thiệu về Tổ Sách (To Sach Studio):**\n\n' +
          '- **Khẩu hiệu chính thức:** *"Sách về tổ, tri thức bay xa"*\n' +
          '- **Ý nghĩa tên gọi:** "Tổ Sách" lấy cảm hứng từ chiếc tổ chim ấm áp — nơi che chở, gìn giữ và ươm mầm cho những tâm hồn yêu sách. Biểu trưng logo Tổ Sách kết hợp đôi cánh tri thức và hạt mầm đang lớn trên nền xanh hải quân `#0B1F3A`.\n' +
          '- **Mô hình hoạt động:** B2C (Business-to-Consumer) trực tiếp phân phối sách mới 100% chính hãng từ các NXB lớn tới tay bạn đọc, đảm bảo đóng gói hoàn hảo và trải nghiệm mua sắm hiện đại nhất.',
        suggestedBooks: [],
        source: 'knowledge-brand',
      });
    }

    // 4. Chất lượng sách, Sách thật / sách lậu, Nhà xuất bản, Bản quyền
    const isBookAuthenticity =
      lowerMsg.includes('sách thật') ||
      lowerMsg.includes('chính hãng') ||
      lowerMsg.includes('sách lậu') ||
      lowerMsg.includes('sách giả') ||
      lowerMsg.includes('sách photo') ||
      lowerMsg.includes('nguồn gốc') ||
      lowerMsg.includes('bản quyền') ||
      lowerMsg.includes('nhà xuất bản nào') ||
      lowerMsg.includes('sách có mới không');

    if (isBookAuthenticity) {
      return NextResponse.json({
        reply:
          '📚 **Cam kết nguồn gốc & bản quyền tại Tổ Sách:**\n\n' +
          '- **100% Sách mới & Bản quyền chính hãng:** Tổ Sách nhập trực tiếp từ các NXB và đơn vị phát hành uy tín hàng đầu Việt Nam: *NXB Trẻ, Kim Đồng, Nhã Nam, NXB Tổng Hợp TP.HCM, Phụ Nữ, NXB Hội Nhà Văn, NXB Thế Giới...*\n' +
          '- **Kiên quyết bài trừ sách lậu:** Chúng tôi tuyệt đối nói KHÔNG với sách in lậu, sách photo, sách scan mờ xén gáy.\n' +
          '- **Chất lượng từng ấn phẩm:** Sách được bọc màng co nguyên seal, giấy in chuẩn định lượng, rõ nét từng trang và bảo tồn trọn vẹn giá trị tác quyền của tác giả.',
        suggestedBooks: [],
        source: 'knowledge-authenticity',
      });
    }

    // 5. Quy cách đóng gói, Bọc màng co, Chống sốc, Bookmark quà tặng
    const isPackaging =
      lowerMsg.includes('đóng gói') ||
      lowerMsg.includes('bọc sách') ||
      lowerMsg.includes('màng co') ||
      lowerMsg.includes('bọc bìa') ||
      lowerMsg.includes('bookmark') ||
      lowerMsg.includes('kẹp sách') ||
      lowerMsg.includes('chống sốc') ||
      lowerMsg.includes('hộp');

    if (isPackaging) {
      return NextResponse.json({
        reply:
          '📦 **Tiêu chuẩn đóng gói sách "chuẩn Tổ Sách":**\n\n' +
          '- **Bảo vệ 3 lớp chống va đập:** Sách được bọc màng co nguyên seal, quấn 2–3 lớp xốp bóng khí (bubble wrap) dày dặn.\n' +
          '- **Hộp carton nẹp góc chống móp:** Sử dụng hộp carton cứng cáp chuyên dụng có đệm nẹp 4 góc, ngăn chặn triệt để tình trạng quăn mép hay gãy gáy sách trong quá trình vận chuyển liên tỉnh.\n' +
          '- **Quà tặng kèm:** Mọi đơn hàng đều được tặng kèm **Bookmark (thẻ kẹp sách) thiết kế độc quyền** của Tổ Sách!',
        suggestedBooks: [],
        source: 'knowledge-packaging',
      });
    }

    // 6. Đồng kiểm, Kiểm tra hàng trước khi thanh toán
    const isInspection =
      lowerMsg.includes('đồng kiểm') ||
      lowerMsg.includes('kiểm tra hàng') ||
      lowerMsg.includes('xem hàng trước') ||
      lowerMsg.includes('mở ra xem') ||
      lowerMsg.includes('có được kiểm hàng');

    if (isInspection) {
      return NextResponse.json({
        reply:
          '🔍 **Chính sách đồng kiểm khi nhận hàng:**\n\n' +
          '- **ĐƯỢC PHÉP ĐỒNG KIỂM 100%:** Khi bưu tá giao hàng, bạn hoàn toàn có quyền mở hộp kiểm tra ngoại quan kiện hàng trước khi thanh toán tiền.\n' +
          '- **Nội dung kiểm tra:** Bạn kiểm tra đúng tựa sách, đúng số lượng, sách mới nguyên vẹn không bị ướt hoặc móp rách.\n' +
          '- Nếu phát hiện dấu hiệu bất thường do vận chuyển, bạn có quyền từ chối nhận hàng và gọi hotline `0988.123.456` để Tổ Sách gửi lại kiện hàng mới ngay!',
        suggestedBooks: [],
        source: 'knowledge-inspection',
      });
    }

    // 7. Chính sách Vận chuyển, Phí ship, Freeship, Thời gian nhận hàng
    const isShipping =
      lowerMsg.includes('vận chuyển') ||
      lowerMsg.includes('phí ship') ||
      lowerMsg.includes('freeship') ||
      lowerMsg.includes('miễn phí vận chuyển') ||
      lowerMsg.includes('giao hàng') ||
      lowerMsg.includes('tiền ship') ||
      lowerMsg.includes('mấy ngày tới') ||
      lowerMsg.includes('bao lâu nhận được') ||
      lowerMsg.includes('thời gian giao');

    if (isShipping) {
      return NextResponse.json({
        reply:
          '🚚 **Chính sách giao hàng & Cước phí vận chuyển Tổ Sách:**\n\n' +
          '- **CHÍNH SÁCH FREESHIP:** Miễn phí vận chuyển toàn quốc cho đơn hàng từ **150.000 đ** trở lên.\n' +
          '- **Cước phí vận chuyển:** Đơn hàng dưới 150.000 đ áp dụng phí ship đồng giá siêu ưu đãi chỉ **25.000 đ** trên toàn quốc.\n' +
          '- **Thời gian giao hàng ước tính:**\n' +
          '  + Nội thành Hà Nội & TP.HCM: **1 – 2 ngày làm việc**.\n' +
          '  + Các tỉnh thành khác: **2 – 4 ngày làm việc**.',
        suggestedBooks: [],
        source: 'knowledge-shipping',
      });
    }

    // 8. Chính sách Đổi trả, Bảo hành sách lỗi
    const isReturnPolicy =
      lowerMsg.includes('đổi trả') ||
      lowerMsg.includes('bảo hành') ||
      lowerMsg.includes('đổi sách') ||
      lowerMsg.includes('trả hàng') ||
      lowerMsg.includes('hoàn tiền') ||
      lowerMsg.includes('sách lỗi') ||
      lowerMsg.includes('thiếu trang') ||
      lowerMsg.includes('rách') ||
      lowerMsg.includes('nhòe');

    if (isReturnPolicy) {
      return NextResponse.json({
        reply:
          '🔄 **Chính sách đổi trả 7 ngày miễn phí của Tổ Sách:**\n\n' +
          '- **1 ĐỔI 1 MIỄN PHÍ TRONG 7 NGÀY:** Áp dụng nếu sách gặp lỗi in ấn từ NXB (thiếu trang, ngược trang, nhòe mực) hoặc dập gãy gáy do vận chuyển.\n' +
          '- **Tổ Sách chịu 100% phí ship đổi trả:** Bạn không phải thanh toán thêm bất kỳ chi phí nào.\n' +
          '- **Quy trình siêu nhanh:** Bạn chỉ cần chụp ảnh tình trạng sách, nhắn tin qua Zalo/Email `support@tosach.vn` hoặc gọi hotline `0988.123.456`, chúng tôi sẽ điều phối gửi cuốn sách mới tinh tới tận cửa nhà bạn!',
        suggestedBooks: [],
        source: 'knowledge-return',
      });
    }

    // 9. Phương thức Thanh toán (COD, VietQR, Chuyển khoản)
    const isPayment =
      lowerMsg.includes('thanh toán') ||
      lowerMsg.includes('cod') ||
      lowerMsg.includes('vietqr') ||
      lowerMsg.includes('mbbank') ||
      lowerMsg.includes('chuyển khoản') ||
      lowerMsg.includes('quét qr') ||
      lowerMsg.includes('tiền mặt');

    if (isPayment) {
      return NextResponse.json({
        reply:
          '💳 **Phương thức thanh toán an toàn tại Tổ Sách:**\n\n' +
          '- **COD (Thanh toán khi nhận hàng):** Nhận sách, kiểm tra đồng kiểm rồi mới thanh toán tiền mặt cho shipper.\n' +
          '- **Chuyển khoản VietQR MBBank 24/7:** Quét mã QR tự động điền đúng số tiền và nội dung đơn hàng. Hệ thống tự động xác nhận giao dịch thành công ngay trong 3 giây mà không cần chụp biên lai chuyển tiền.',
        suggestedBooks: [],
        source: 'knowledge-payment',
      });
    }

    // 10. Địa chỉ cửa hàng, Shop ở đâu, Giờ mở cửa, Mua trực tiếp
    const isStoreLocation =
      lowerMsg.includes('địa chỉ') ||
      lowerMsg.includes('ở đâu') ||
      lowerMsg.includes('cửa hàng') ||
      lowerMsg.includes('shop ở đâu') ||
      lowerMsg.includes('mua trực tiếp') ||
      lowerMsg.includes('giờ mở cửa') ||
      lowerMsg.includes('văn phòng') ||
      lowerMsg.includes('chi nhánh');

    if (isStoreLocation) {
      return NextResponse.json({
        reply:
          '🏢 **Thông tin địa chỉ & Kênh phục vụ của Tổ Sách:**\n\n' +
          '- **Mô hình vận hành:** Để đem lại mức giá sách chiết khấu tốt nhất (10% - 35%) và dịch vụ giao vận toàn quốc nhanh chóng, Tổ Sách vận hành theo mô hình kho trung tâm thương mại điện tử chuyên sâu.\n' +
          '- **Trụ sở & Kho hàng phân phối:** Hà Nội, Việt Nam.\n' +
          '- **Thời gian đặt hàng trực tuyến:** Hoạt động **24/7** trên website `tosach.vn`.\n' +
          '- **Hotline hỗ trợ trực tiếp:** **0988.123.456** (8:00 - 22:00 hàng ngày, kể cả Thứ 7 & Chủ Nhật).',
        suggestedBooks: [],
        source: 'knowledge-location',
      });
    }

    // 11. Tra cứu đơn hàng, Tình trạng vận chuyển
    const isOrderTracking =
      lowerMsg.includes('đơn hàng của tôi') ||
      lowerMsg.includes('tra cứu đơn') ||
      lowerMsg.includes('đơn của tôi') ||
      lowerMsg.includes('mã đơn') ||
      lowerMsg.includes('ts-') ||
      lowerMsg.includes('đơn đang ở đâu') ||
      lowerMsg.includes('giao đến đâu rồi');

    if (isOrderTracking) {
      return NextResponse.json({
        reply:
          '📦 **Cách tra cứu đơn hàng của bạn tại Tổ Sách:**\n\n' +
          '- Bạn có thể bấm vào mục **[Tài khoản -> Lịch sử đơn hàng](/account/orders)** để theo dõi tiến độ giao hàng thời gian thực.\n' +
          '- **Các trạng thái đơn:** *Chờ xử lý -> Đã xác nhận -> Đang đóng gói -> Đang giao hàng -> Đã giao thành công*.\n' +
          '- Nếu bạn có mã đơn cụ thể (Ví dụ: `TS-20261013-0001`), bạn có thể nhắn tin cho tôi để tôi hỗ trợ kiểm tra chi tiết ngay nhé!',
        suggestedBooks: [],
        source: 'knowledge-tracking',
      });
    }

    // 12. Khuyến mãi, Giảm giá, Mã Voucher, Điểm tích lũy
    const isPromotion =
      lowerMsg.includes('khuyến mãi') ||
      lowerMsg.includes('voucher') ||
      lowerMsg.includes('mã giảm giá') ||
      lowerMsg.includes('giảm giá') ||
      lowerMsg.includes('ưu đãi') ||
      lowerMsg.includes('sale') ||
      lowerMsg.includes('chiết khấu') ||
      lowerMsg.includes('tích điểm') ||
      lowerMsg.includes('điểm thưởng');

    if (isPromotion) {
      return NextResponse.json({
        reply:
          '🎁 **Chương trình khuyến mãi & Ưu đãi thành viên tại Tổ Sách:**\n\n' +
          '- **Chiết khấu giá bìa tự động:** Hầu hết đầu sách trên website đều được giảm từ **10% đến 35%** so với giá niêm yết của NXB.\n' +
          '- **Trợ giá Freeship:** Tự động miễn phí vận chuyển cho đơn hàng từ **250.000 đ** trở lên.\n' +
          '- **Điểm tích lũy thành viên:** Mỗi đơn hàng thành công sẽ tích lũy điểm thưởng theo cấp bậc thành viên để trừ tiền trực tiếp cho các đơn mua tiếp theo!',
        suggestedBooks: [],
        source: 'knowledge-promotions',
      });
    }

    // =========================================================================
    // II. TƯ VẤN & GỢI Ý SÁCH THEO NGỮ CẢNH / TÂM TRẠNG / CHUYÊN NGÀNH (RAG ENGINE)
    // LỌC 100% SÁCH CÓ BÌA CDN HỢP LỆ (startsWith 'http') ĐỂ TRÁNH VỠ ẢNH
    // =========================================================================
    let relatedBooks: any[] = [];

    const isSadnessOrEmotion =
      lowerMsg.includes('buồn') ||
      lowerMsg.includes('chuyện buồn') ||
      lowerMsg.includes('nỗi buồn') ||
      lowerMsg.includes('cô đơn') ||
      lowerMsg.includes('tâm sự') ||
      lowerMsg.includes('chia tay') ||
      lowerMsg.includes('thất tình') ||
      lowerMsg.includes('khóc') ||
      lowerMsg.includes('chữa lành') ||
      lowerMsg.includes('tâm trạng') ||
      lowerMsg.includes('mệt mỏi') ||
      lowerMsg.includes('áp lực') ||
      lowerMsg.includes('bình yên');

    const isEconomy =
      lowerMsg.includes('kinh tế') ||
      lowerMsg.includes('kinh doanh') ||
      lowerMsg.includes('tài chính') ||
      lowerMsg.includes('đầu tư') ||
      lowerMsg.includes('khởi nghiệp') ||
      lowerMsg.includes('lãnh đạo') ||
      lowerMsg.includes('chứng khoán') ||
      lowerMsg.includes('tiền bạc');

    const isPsychologySkills =
      lowerMsg.includes('tâm lý') ||
      lowerMsg.includes('kỹ năng') ||
      lowerMsg.includes('phát triển bản thân') ||
      lowerMsg.includes('giao tiếp') ||
      lowerMsg.includes('thói quen') ||
      lowerMsg.includes('sống');

    const isLiterature =
      lowerMsg.includes('văn học') ||
      lowerMsg.includes('tiểu thuyết') ||
      lowerMsg.includes('truyện ngắn') ||
      lowerMsg.includes('tản văn') ||
      lowerMsg.includes('thơ') ||
      lowerMsg.includes('kinh điển');

    const isChildren =
      lowerMsg.includes('thiếu nhi') ||
      lowerMsg.includes('trẻ em') ||
      lowerMsg.includes('cổ tích') ||
      lowerMsg.includes('truyện tranh') ||
      lowerMsg.includes('bé yêu') ||
      lowerMsg.includes('nuôi dạy con');

    const isBestseller =
      lowerMsg.includes('bán chạy') ||
      lowerMsg.includes('nổi bật') ||
      lowerMsg.includes('hot') ||
      lowerMsg.includes('gợi ý') ||
      lowerMsg.includes('nên đọc');

    try {
      if (isSadnessOrEmotion) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            coverUrl: { startsWith: 'http' },
            OR: [
              { title: { contains: 'chuối non', mode: 'insensitive' } },
              { title: { contains: 'giả kim', mode: 'insensitive' } },
              { title: { contains: 'yêu', mode: 'insensitive' } },
              { title: { contains: 'bình an', mode: 'insensitive' } },
              { title: { contains: 'chữa lành', mode: 'insensitive' } },
              { categories: { some: { category: { slug: { contains: 'van-hoc' } } } } },
              { categories: { some: { category: { slug: { contains: 'tam-ly' } } } } },
            ],
          },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (isEconomy) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            coverUrl: { startsWith: 'http' },
            OR: [
              { categories: { some: { category: { slug: { contains: 'kinh-te' } } } } },
              { title: { contains: 'kinh tế', mode: 'insensitive' } },
              { title: { contains: 'kinh doanh', mode: 'insensitive' } },
              { title: { contains: 'khởi nghiệp', mode: 'insensitive' } },
              { title: { contains: 'lãnh đạo', mode: 'insensitive' } },
            ],
          },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (isPsychologySkills) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            coverUrl: { startsWith: 'http' },
            OR: [
              { categories: { some: { category: { slug: { contains: 'tam-ly' } } } } },
              { title: { contains: 'tâm lý', mode: 'insensitive' } },
              { title: { contains: 'kỹ năng', mode: 'insensitive' } },
              { title: { contains: 'sống', mode: 'insensitive' } },
            ],
          },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (isLiterature) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            coverUrl: { startsWith: 'http' },
            OR: [
              { categories: { some: { category: { slug: { contains: 'van-hoc' } } } } },
              { title: { contains: 'truyện', mode: 'insensitive' } },
              { title: { contains: 'tiểu thuyết', mode: 'insensitive' } },
            ],
          },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (isChildren) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            coverUrl: { startsWith: 'http' },
            OR: [
              { categories: { some: { category: { slug: { contains: 'thieu-nhi' } } } } },
              { title: { contains: 'thiếu nhi', mode: 'insensitive' } },
              { title: { contains: 'bé', mode: 'insensitive' } },
            ],
          },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (isBestseller) {
        relatedBooks = await prisma.book.findMany({
          where: { isActive: true, coverUrl: { startsWith: 'http' } },
          include: { authors: { include: { author: true } } },
          take: 3,
          orderBy: [{ isBestseller: 'desc' }, { ratingCount: 'desc' }],
        });
      } else {
        // Chỉ tìm sách khi câu hỏi có ngữ cảnh tìm kiếm/tư vấn sách
        const isAskingForBook =
          lowerMsg.includes('sách') ||
          lowerMsg.includes('cuốn') ||
          lowerMsg.includes('truyện') ||
          lowerMsg.includes('tiểu thuyết') ||
          lowerMsg.includes('tác giả') ||
          lowerMsg.includes('tác phẩm') ||
          lowerMsg.includes('gợi ý') ||
          lowerMsg.includes('tư vấn') ||
          lowerMsg.includes('đọc gì') ||
          lowerMsg.includes('mua gì');

        if (isAskingForBook) {
          const searchKeyword = message.split(' ').slice(0, 3).join(' ');
          relatedBooks = await prisma.book.findMany({
            where: {
              isActive: true,
              coverUrl: { startsWith: 'http' },
              OR: [
                { title: { contains: searchKeyword, mode: 'insensitive' } },
                { description: { contains: searchKeyword, mode: 'insensitive' } },
              ],
            },
            include: { authors: { include: { author: true } } },
            take: 3,
            orderBy: { ratingCount: 'desc' },
          });

          // Nếu không khớp từ khóa cụ thể, lấy 3 tựa sách tiêu biểu
          if (relatedBooks.length === 0) {
            relatedBooks = await prisma.book.findMany({
              where: { isActive: true, coverUrl: { startsWith: 'http' } },
              include: { authors: { include: { author: true } } },
              take: 3,
              orderBy: { ratingCount: 'desc' },
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn('Chat RAG DB retrieval error:', dbErr);
    }

    const formattedBooks: SuggestedBook[] = relatedBooks.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      price: Number(b.price),
      coverUrl: b.coverUrl,
      authorName: b.authors?.[0]?.author?.name || 'Tổ Sách Tuyển Chọn',
    }));

    // =========================================================================
    // III. GỌI MÔ HÌNH GOOGLE GEMINI (3.5 FLASH-LITE / 3.5 FLASH / 3.8 FLASH)
    // =========================================================================
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiApiKey) {
      try {
        const bookContextText = formattedBooks.length > 0
          ? `Các cuốn sách liên quan đang có sẵn tại Tổ Sách:\n` +
            formattedBooks
              .map(
                (b, i) =>
                  `${i + 1}. "${b.title}" - Tác giả: ${b.authorName} - Giá: ${b.price.toLocaleString('vi-VN')} đ`
              )
              .join('\n')
          : 'Hiện tại kho sách có hơn 5.100 tựa sách phong phú.';

        const systemPrompt = `Bạn là Trợ lý AI thông minh, hiểu biết sâu rộng của Nhà Sách Trực Tuyến Tổ Sách ("Sách về tổ, tri thức bay xa").
- Sáng lập viên: Nguyễn Đăng Hanh (Lead System Architect, email khiếu nại: hnhngyndng@gmail.com) và Nguyễn Mạnh Hòa (Head of Design, email: manhhoa02042005@gmail.com).
- Hotline 24/7: 0988.123.456, CSKH: support@tosach.vn.
- Chính sách: Freeship toàn quốc cho đơn hàng từ 150k (đơn dưới 150k phí ship đồng giá 25k), 1 đổi 1 trong 7 ngày nếu dập gáy lỗi in ấn, đồng kiểm tra hàng trước khi nhận, bọc màng co 3 lớp chống sốc & tặng kèm bookmark độc quyền trong mọi đơn hàng.
- Cam kết 100% sách thật bản quyền (NXB Trẻ, Kim Đồng, Nhã Nam, NXB Tổng Hợp...), nói không với sách lậu.
- Thanh toán tiện lợi qua COD tiền mặt hoặc quét mã VietQR MBBank 24/7.
- Khi người dùng buồn bã, cô đơn: Hãy an ủi dịu dàng, đồng cảm, gợi ý sách văn học / tản văn / chữa lành, tuyệt đối không gợi ý sách kỹ thuật hay sách không liên quan.
- BẠN CÓ THỂ TRẢ LỜI MỌI CÂU HỎI: từ tư vấn sách, chính sách Tổ Sách, cho đến kiến thức tổng quát ngoài đời sống (khoa học, đời sống, văn hóa, học tập, xã hội...). Hãy trả lời nhiệt tình, thông minh, lịch sự, chuẩn tiếng Việt (dưới 200 từ). Nếu phù hợp, có thể lồng ghép tinh tế tình yêu sách và tri thức.
${bookContextText}`;

        const recentHistory = history.slice(-4).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        }));

        const contents = [
          ...recentHistory,
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }],
          },
        ];

        // Ưu tiên dòng Flash Lite nhẹ nhất để tiết kiệm token & hạn mức tối đa (không lo cạn quota)
        // 1. gemini-3.1-flash-lite (Bản 3.1 Flash Lite tiết kiệm theo yêu cầu)
        // 2. gemini-flash-lite-latest (Bản Lite tự động ổn định của Google)
        // 3. gemini-3.5-flash-lite (Bản Flash Lite dự phòng tốc độ cao)
        const candidateModels = [
          'gemini-3.1-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3.5-flash-lite',
        ];

        for (const model of candidateModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents,
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 250, // Tiết kiệm token đầu ra để giữ trọn quota miễn phí
                  },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const candidateText =
                geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidateText) {
                return NextResponse.json({
                  reply: candidateText.trim(),
                  suggestedBooks: formattedBooks,
                  source: `google-${model}`,
                });
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${model} fetch failed:`, modelErr);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local RAG generator:', geminiError);
      }
    }

    // =========================================================================
    // IV. TẦNG TRẢ LỜI CỤC BỘ THÔNG MINH (KHI CHƯA CÓ HOẶC HẾT QUOTA API KEY)
    // =========================================================================
    let reply = '';

    const isOnlyGreeting = /^(chào|xin chào|hi|hello|alo|hey)\b/i.test(lowerMsg) && message.split(' ').length <= 4;

    if (isOnlyGreeting) {
      reply =
        'Xin chào bạn! Tôi là Trợ lý AI của Nhà Sách Tổ Sách 🦉.\n\n' +
        'Tôi có thể giúp bạn giải đáp mọi thắc mắc về Tổ Sách: *Chính sách giao hàng, Freeship, Đồng kiểm, Đổi trả 7 ngày, Thanh toán VietQR, Thông tin liên hệ chủ quán*, hoặc tư vấn tựa sách phù hợp theo tâm trạng và sở thích của bạn hôm nay. Bạn cần tôi hỗ trợ điều gì nào?';
    } else if (isSadnessOrEmotion && formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply =
        `Chào bạn, ai trong chúng ta cũng có những ngày mang nặng nỗi buồn trong lòng. Đọc sách là một cách dịu dàng để cảm xúc được thấu hiểu, lắng đọng và dần xoa dịu.\n\n` +
        `Tổ Sách xin gợi ý cho bạn những tựa sách văn học & chữa lành sâu lắng: ${bookNames}. Bạn có thể bấm vào thẻ sách bên dưới để tìm cho mình một khoảng lặng bình yên nhé 🌿!`;
    } else if (isEconomy && formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Dành cho độc giả quan tâm đến lĩnh vực kinh tế, tài chính và khởi sự kinh doanh, Tổ Sách gợi ý những cuốn cẩm nang thực chiến được đánh giá rất cao: ${bookNames}. Bạn tham khảo bên dưới nhé!`;
    } else if (isPsychologySkills && formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Để rèn luyện tư duy, thấu hiểu tâm lý và nâng cao kỹ năng sống mỗi ngày, đây là những tác phẩm sâu sắc mà Tổ Sách muốn gửi tới bạn: ${bookNames}.`;
    } else if (isLiterature && formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Dành cho những tâm hồn say mê văn chương, Tổ Sách xin giới thiệu những áng văn kinh điển và truyện ngắn giàu cảm xúc: ${bookNames}.`;
    } else if (isChildren && formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Dành cho các độc giả nhí và quý phụ huynh nuôi dạy con, đây là những cuốn sách thiếu nhi bổ ích, giàu tính nhân văn: ${bookNames}.`;
    } else if (formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Dựa trên yêu cầu của bạn, Tổ Sách xin gợi ý những tựa sách nổi bật được nhiều độc giả yêu thích: ${bookNames}. Bạn có thể bấm vào thẻ sách bên dưới để xem chi tiết và thêm vào giỏ nhé!`;
    } else {
      reply =
        'Cảm ơn bạn đã trò chuyện cùng Tổ Sách 🦉! Kho sách của chúng tôi hiện có hơn 5.100 tựa sách phong phú từ các NXB uy tín. ' +
        'Bạn có thể hỏi tôi về bất kỳ chủ đề sách nào (*Kinh tế, Tâm lý, Văn học, Thiếu nhi*), hoặc các chính sách *Giao hàng, Freeship, Đổi trả 7 ngày, Thông tin liên hệ chủ quán* để tôi hỗ trợ chu đáo nhất nhé!';
    }

    return NextResponse.json({
      reply,
      suggestedBooks: formattedBooks,
      source: 'tosach-comprehensive-intelligence',
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        reply:
          'Xin lỗi bạn, trợ lý AI đang bận xử lý dữ liệu một chút. Bạn vui lòng thử lại sau vài giây nhé!',
        suggestedBooks: [],
      },
      { status: 500 }
    );
  }
}
