import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const body = await req.json();
    const message: string = (body.message || '').trim();
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'Nội dung tin nhắn không được để trống' }, { status: 400 });
    }

    const lowerMsg = message.toLowerCase();

    // 1. Tìm kiếm sách liên quan từ CSDL PostgreSQL (RAG - Retrieval)
    let relatedBooks: any[] = [];
    try {
      if (
        lowerMsg.includes('kinh tế') ||
        lowerMsg.includes('kinh doanh') ||
        lowerMsg.includes('tài chính') ||
        lowerMsg.includes('đầu tư') ||
        lowerMsg.includes('khởi nghiệp')
      ) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            OR: [
              { categories: { some: { category: { slug: { contains: 'kinh-te' } } } } },
              { title: { contains: 'kinh tế', mode: 'insensitive' } },
              { title: { contains: 'kinh doanh', mode: 'insensitive' } },
              { title: { contains: 'lãnh đạo', mode: 'insensitive' } },
            ],
          },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (
        lowerMsg.includes('tâm lý') ||
        lowerMsg.includes('kỹ năng') ||
        lowerMsg.includes('chữa lành') ||
        lowerMsg.includes('phát triển bản thân') ||
        lowerMsg.includes('sống')
      ) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            OR: [
              { categories: { some: { category: { slug: { contains: 'tam-ly' } } } } },
              { title: { contains: 'tâm lý', mode: 'insensitive' } },
              { title: { contains: 'kỹ năng', mode: 'insensitive' } },
              { title: { contains: 'sống', mode: 'insensitive' } },
            ],
          },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (
        lowerMsg.includes('văn học') ||
        lowerMsg.includes('tiểu thuyết') ||
        lowerMsg.includes('truyện')
      ) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            OR: [
              { categories: { some: { category: { slug: { contains: 'van-hoc' } } } } },
              { title: { contains: 'truyện', mode: 'insensitive' } },
            ],
          },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (
        lowerMsg.includes('thiếu nhi') ||
        lowerMsg.includes('trẻ em') ||
        lowerMsg.includes('cổ tích')
      ) {
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            OR: [{ categories: { some: { category: { slug: { contains: 'thieu-nhi' } } } } }],
          },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
          orderBy: { avgRating: 'desc' },
        });
      } else if (
        lowerMsg.includes('bán chạy') ||
        lowerMsg.includes('nổi bật') ||
        lowerMsg.includes('hot') ||
        lowerMsg.includes('gợi ý')
      ) {
        relatedBooks = await prisma.book.findMany({
          where: { isActive: true },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
          orderBy: [{ isBestseller: 'desc' }, { ratingCount: 'desc' }],
        });
      } else {
        // Tìm kiếm linh hoạt theo cụm từ khóa của người dùng
        const searchKeyword = message.split(' ').slice(0, 3).join(' ');
        relatedBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            OR: [
              { title: { contains: searchKeyword, mode: 'insensitive' } },
              { description: { contains: searchKeyword, mode: 'insensitive' } },
            ],
          },
          include: {
            authors: { include: { author: true } },
          },
          take: 3,
        });

        // Nếu vẫn chưa có sách, lấy 3 cuốn ngẫu nhiên rating cao
        if (relatedBooks.length === 0) {
          relatedBooks = await prisma.book.findMany({
            where: { isActive: true },
            include: {
              authors: { include: { author: true } },
            },
            take: 3,
            orderBy: { ratingCount: 'desc' },
          });
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

    // 2. Kiểm tra nếu có GEMINI_API_KEY -> Gọi Google Gemini 1.5 Flash
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
          : 'Hiện tại có hơn 5.000 đầu sách thuộc các thể loại Kinh tế, Văn học, Tâm lý - Kỹ năng, Thiếu nhi...';

        const systemPrompt = `Bạn là Trợ lý AI thông minh, thân thiện của Nhà Sách Trực Tuyến Tổ Sách (mô hình B2C bán sách mới chính hãng).
Nhiệm vụ: Tư vấn sách, gợi ý tác phẩm phù hợp với độc giả, giải đáp thắc mắc về chính sách mua sách.
Chính sách Tổ Sách:
- Miễn phí vận chuyển toàn quốc cho đơn hàng từ 250.000 đ (nội thành 20k, liên tỉnh 30k).
- Đổi trả miễn phí trong 7 ngày nếu sách lỗi in ấn hoặc dập gãy khi vận chuyển.
- Hình thức thanh toán: COD (tiền mặt khi nhận hàng) hoặc Chuyển khoản QR MBBank tự động.
- Sách 100% bản quyền từ các NXB uy tín (Trẻ, Kim Đồng, Nhã Nam, NXB Tổng Hợp...).
${bookContextText}

Hãy trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích (dưới 150 từ). Nếu có sách phù hợp trong danh sách trên, hãy khuyên độc giả tham khảo.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 350,
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
              source: 'gemini-1.5-flash',
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local RAG generator:', geminiError);
      }
    }

    // 3. Intelligent Local RAG Generator (Cơ chế dự phòng hoàn hảo khi không có API Key)
    let reply = '';

    const isOnlyGreeting = /^(chào|xin chào|hi|hello|alo|hey)\b/i.test(lowerMsg) && message.split(' ').length <= 4;

    if (isOnlyGreeting) {
      reply =
        'Xin chào bạn! Tôi là Trợ lý AI của Nhà Sách Tổ Sách 🦉. Tôi có thể giúp bạn tìm kiếm sách theo chủ đề, gợi ý sách bán chạy hoặc giải đáp chính sách mua hàng. Bạn đang quan tâm đến thể loại sách nào hôm nay?';
    } else if (
      lowerMsg.includes('giao hàng') ||
      lowerMsg.includes('ship') ||
      lowerMsg.includes('vận chuyển')
    ) {
      reply =
        '🚚 **Chính sách giao hàng của Tổ Sách:**\n- Miễn phí vận chuyển toàn quốc cho đơn hàng từ **250.000 đ**.\n- Đơn dưới 250k: Phí ship nội thành 20.000 đ, ngoại tỉnh 30.000 đ.\n- Thời gian giao hàng: 1–2 ngày với nội thành và 2–4 ngày với các tỉnh thành khác.';
    } else if (
      lowerMsg.includes('đổi trả') ||
      lowerMsg.includes('bảo hành') ||
      lowerMsg.includes('lỗi')
    ) {
      reply =
        '🔄 **Chính sách đổi trả 7 ngày:**\n- Hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ khi nhận hàng nếu sách bị lỗi in ấn, rách trang hoặc hư hỏng do vận chuyển.\n- Bạn chỉ cần giữ hóa đơn hoặc liên hệ qua email `support@tosach.vn` để được hỗ trợ gửi sách mới ngay!';
    } else if (
      lowerMsg.includes('thanh toán') ||
      lowerMsg.includes('mbbank') ||
      lowerMsg.includes('cod') ||
      lowerMsg.includes('chuyển khoản')
    ) {
      reply =
        '💳 **Phương thức thanh toán:**\n- **COD:** Thanh toán tiền mặt khi nhận sách tận tay.\n- **VietQR:** Quét mã QR ngân hàng MBBank tự động xác nhận đơn hàng trong vài giây.';
    } else if (formattedBooks.length > 0) {
      const bookNames = formattedBooks.map((b) => `**"${b.title}"** (${b.authorName})`).join(', ');
      reply = `Dựa trên yêu cầu của bạn, Tổ Sách gợi ý những tựa sách nổi bật được nhiều độc giả yêu thích: ${bookNames}. Bạn có thể bấm vào thẻ sách bên dưới để xem chi tiết và thêm vào giỏ nhé!`;
    } else {
      reply =
        'Cảm ơn bạn đã trò chuyện cùng Tổ Sách! Hiện tại kho sách của chúng tôi có hơn 5.000 tựa sách phong phú. Bạn có thể nhập từ khóa thể loại như *Kinh tế, Tâm lý, Văn học, Thiếu nhi* hoặc hỏi về chính sách giao hàng để tôi hỗ trợ tốt nhất nhé!';
    }

    return NextResponse.json({
      reply,
      suggestedBooks: formattedBooks,
      source: 'local-rag-intelligence',
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
