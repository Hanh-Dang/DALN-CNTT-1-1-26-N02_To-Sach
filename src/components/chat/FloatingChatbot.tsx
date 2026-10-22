'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bot, X, Send, Sparkles, Loader2,
  ArrowRight, RefreshCw, ShoppingBag,
  Check, Zap, Ticket, Tag
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface SuggestedBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  coverUrl: string | null;
  authorName: string;
  publisher?: string;
  stockQty?: number;
  inStock?: boolean;
  description?: string;
  isSuggestion?: boolean;
}

interface BestVoucherData {
  code: string;
  name: string;
  discountAmount?: number;
  minOrderValue?: number;
  type?: string;
  value?: number;
  finalPrice?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedBooks?: SuggestedBook[];
  bestVoucher?: BestVoucherData | null;
  timestamp: string;
}

const STORAGE_KEY_MESSAGES = 'tosach_chatbot_history_v2';
const STORAGE_KEY_OPEN = 'tosach_chatbot_open_state';

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào bạn! Tôi là **Trợ lý Bán Hàng AI của Nhà Sách Tổ Sách** 🦉.\n\nTôi sẵn sàng hỗ trợ bạn:\n- 📖 Tư vấn, tìm kiếm sách hay mọi thể loại (Trinh thám, Lập trình, Văn học, Kinh tế, Tâm lý...)\n- 🛒 Đầy đủ thông tin: Tác giả, NXB, Giá ưu đãi & Số lượng tồn kho thực tế\n- ⚡ **Mua Ngay** 1 chạm hoặc Thêm vào giỏ hàng trực tiếp\n- 🎟️ Tự động tìm & áp **Mã Voucher giảm nhiều tiền nhất** cho bạn\n- 🚚 Nhắc nhở chính sách **Freeship đơn từ 150k & Đổi trả 7 ngày**\n\nBạn đang quan tâm đến cuốn sách hay chủ đề nào hôm nay?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  '🕵️ Sách trinh thám Nhật Bản',
  '💻 Sách lập trình Python',
  '📈 Sách kinh tế & đầu tư',
  '🌱 Sách tâm lý & chữa lành',
  '🎟️ Kiểm tra voucher tốt nhất',
  '🚚 Chính sách giao hàng & đổi trả',
];

// =========================================================================
// BỘ PARSER VÀ RENDER MARKDOWN CHO NỘI DUNG CHAT
// =========================================================================
function parseInlineTokens(text: string) {
  const tokens: Array<{ type: 'text' | 'bold' | 'code' | 'italic'; value: string }> = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.substring(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', value: raw.slice(1, -1) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.substring(lastIndex) });
  }

  return tokens;
}

function InlineText({ text, isUser }: { text: string; isUser: boolean }) {
  const tokens = parseInlineTokens(text);
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'bold') {
          return (
            <strong
              key={i}
              className={`font-bold ${isUser ? 'text-amber-200' : 'text-[#0B1F3A]'}`}
            >
              {token.value}
            </strong>
          );
        }
        if (token.type === 'code') {
          return (
            <code
              key={i}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${isUser
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100/90 text-amber-900 border border-amber-200/80'
                }`}
            >
              {token.value}
            </code>
          );
        }
        if (token.type === 'italic') {
          return (
            <em
              key={i}
              className={`italic ${isUser ? 'text-slate-200' : 'text-slate-600'}`}
            >
              {token.value}
            </em>
          );
        }
        return <span key={i}>{token.value}</span>;
      })}
    </>
  );
}

function MarkdownMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed break-words">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        // List item bullet
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-1.5 pl-1">
              <span className={`shrink-0 ${isUser ? 'text-amber-300' : 'text-[#F5A623]'}`}>•</span>
              <div className="flex-1">
                <InlineText text={trimmed.substring(2)} isUser={isUser} />
              </div>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={index} className="flex items-start gap-1.5 pl-1">
              <span className={`shrink-0 font-bold ${isUser ? 'text-amber-300' : 'text-[#0B1F3A]'}`}>
                {numMatch[1]}.
              </span>
              <div className="flex-1">
                <InlineText text={numMatch[2]} isUser={isUser} />
              </div>
            </div>
          );
        }

        return (
          <p key={index}>
            <InlineText text={line} isUser={isUser} />
          </p>
        );
      })}
    </div>
  );
}

// =========================================================================
// HÀM TÁCH LỜI DẪN MỞ ĐẦU VÀ KẾT THÚC CỦA TIN NHẮN (CHỐNG LẶP NỘI DUNG)
// =========================================================================
function splitMessageContent(content: string, books: SuggestedBook[]) {
  if (!books || books.length === 0) {
    return { intro: content, outro: '' };
  }

  const lines = content.split('\n');
  const bookTitles = books.map((b) => b.title.toLowerCase().trim());

  let firstBookIndex = -1;
  let outroIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const trimmed = line.trim();

    // 1. Tìm vị trí bắt đầu danh sách sách (dòng chứa tên sách hoặc format "* **", "1. **")
    if (firstBookIndex === -1) {
      const matchesAnyBook = bookTitles.some(
        (t) => (t.length >= 4 && lower.includes(t)) || (t.length > 8 && lower.includes(t.slice(0, 10)))
      );
      if (
        matchesAnyBook ||
        /^(\*|\-|\d+\.)\s+(\*\*[^*]+\*\*|"[^"]+")/.test(trimmed) ||
        /^(sách\s+\d+|cuốn\s+\d+)/i.test(trimmed)
      ) {
        firstBookIndex = i;
      }
    }

    // 2. Tìm vị trí bắt đầu phần kết luận (outro: ưu đãi, freeship, voucher, chính sách)
    if (firstBookIndex !== -1 && i > firstBookIndex) {
      if (
        trimmed.startsWith('---') ||
        lower.includes('để tối ưu chi phí') ||
        lower.includes('ưu đãi đặc biệt') ||
        lower.includes('chính sách freeship') ||
        (lower.includes('freeship') && !lower.includes('giá bán')) ||
        lower.includes('chúc bạn chọn được')
      ) {
        outroIndex = i;
        break;
      }
    }
  }

  if (firstBookIndex === -1) {
    return { intro: content, outro: '' };
  }

  const intro = lines.slice(0, firstBookIndex).join('\n').trim();
  const outro = outroIndex !== -1
    ? lines.slice(outroIndex).filter((l) => l.trim() !== '---').join('\n').trim()
    : '';

  return { intro, outro };
}

// =========================================================================
// THẺ SÁCH TRỰC QUAN CAO CẤP: THÔNG TIN CHI TIẾT -> HÌNH ẢNH + NÚT MUA NGAY DƯỚI
// =========================================================================
interface ChatBookCardProps {
  book: SuggestedBook;
  index: number;
  bestVoucher?: BestVoucherData | null;
  onAddToCart: (book: SuggestedBook, e: React.MouseEvent<HTMLElement>) => void;
  onBuyNow: (book: SuggestedBook) => void;
}

function ChatBookCard({ book, index, bestVoucher, onAddToCart, onBuyNow }: ChatBookCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = book.inStock === false || (typeof book.stockQty === 'number' && book.stockQty <= 0);

  const handleAdd = (e: React.MouseEvent<HTMLElement>) => {
    if (isOutOfStock) return;
    onAddToCart(book, e);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  const discountPercent =
    book.originalPrice && book.originalPrice > book.price
      ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
      : 0;

  // Tính voucher có thể áp dụng cho cuốn sách này
  let voucherNote = '';
  if (bestVoucher?.code) {
    if (book.price >= (bestVoucher.minOrderValue || 0)) {
      voucherNote = `Áp mã ${bestVoucher.code} để được giảm ${bestVoucher.discountAmount?.toLocaleString('vi-VN')} đ`;
    } else {
      voucherNote = `Mua đơn từ ${(bestVoucher.minOrderValue || 150000).toLocaleString('vi-VN')} đ áp mã ${bestVoucher.code} & Freeship`;
    }
  } else {
    if (book.price >= 150000) {
      voucherNote = 'Đạt tiêu chuẩn Freeship toàn quốc 0đ';
    } else {
      voucherNote = `Mua thêm ${(150000 - book.price).toLocaleString('vi-VN')} đ để được Freeship toàn quốc`;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-3.5 space-y-2.5">
      {/* 1. Header: Thứ tự & Tình trạng kho */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <span className="font-extrabold text-[11px] text-[#0B1F3A] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0">
            {index + 1}
          </span>
          <span className="font-black">Cuốn #{index + 1}</span>
          {book.isSuggestion && (
            <span className="text-[9px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded italic border border-amber-200/50">
              Gợi ý tương tự
            </span>
          )}
        </span>

        {/* Tình trạng tồn kho */}
        {isOutOfStock ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            Hết hàng
          </span>
        ) : typeof book.stockQty === 'number' && book.stockQty < 10 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 animate-pulse">
            Chỉ còn {book.stockQty} cuốn
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Còn hàng ({book.stockQty || 'Sẵn kho'})
          </span>
        )}
      </div>

      {/* 2. Tên cuốn sách (nổi bật, link) */}
      <div>
        <Link
          href={`/book/${book.slug}`}
          className="text-xs sm:text-[13px] font-extrabold text-[#0B1F3A] hover:text-amber-800 transition-colors leading-snug line-clamp-2 block"
          title={book.title}
        >
          {book.title}
        </Link>
      </div>

      {/* 3. Thông điệp cuốn sách (lời giới thiệu / điểm nổi bật) */}
      {book.description && (
        <div className="bg-amber-50/60 border-l-3 border-[#F5A623] pl-2.5 pr-2 py-2 rounded-r-xl text-[11px] text-slate-700 leading-relaxed italic">
          <span className="font-bold not-italic text-[#0B1F3A] mr-1">Thông điệp:</span>
          <span>{book.description}</span>
        </div>
      )}

      {/* 4. Thông tin chi tiết: Tác giả, NXB, Giá bán, Voucher có thể áp */}
      <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1.5 text-[11px] border border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div className="truncate">
            <span className="text-slate-400">Tác giả: </span>
            <strong className="text-slate-800 font-semibold">{book.authorName}</strong>
          </div>
          <div className="truncate">
            <span className="text-slate-400">NXB: </span>
            <strong className="text-slate-800 font-semibold">{book.publisher || 'NXB Trẻ'}</strong>
          </div>
        </div>

        {/* Giá bán và Giá gốc */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-slate-200/60">
          <span className="text-slate-400">Giá bán: </span>
          <span className="text-[13.5px] font-black text-[#D97706]">
            {book.price.toLocaleString('vi-VN')} đ
          </span>
          {discountPercent > 0 && (
            <>
              <span className="text-[10px] text-slate-400 line-through">
                {book.originalPrice?.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9.5px] font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200/60">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Voucher có thể áp */}
        <div className="flex items-center gap-1.5 text-[10.5px] pt-1 border-t border-slate-200/60 text-emerald-800">
          <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium truncate">
            {voucherNote}
          </span>
        </div>
      </div>

      {/* 5. NGAY BÊN DƯỚI: HÌNH ẢNH CUỐN SÁCH + NÚT THÊM VÀO GIỎ HÀNG + NÚT MUA NGAY */}
      <div className="flex gap-3 items-center pt-1 border-t border-slate-100">
        {/* Hình ảnh cuốn sách */}
        <Link
          href={`/book/${book.slug}`}
          className="relative w-16 h-22 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70 block group cursor-pointer shadow-2xs hover:border-amber-400 transition-all"
          title={`Xem chi tiết ${book.title}`}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
              Tổ Sách
            </div>
          )}
        </Link>

        {/* Nút thêm vào giỏ hàng và Mua ngay */}
        <div className="flex-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] active:scale-98'
              }`}
            title={isOutOfStock ? 'Sách đã hết hàng' : 'Thêm vào giỏ hàng'}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Đã thêm vào giỏ ✓</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                <span>Thêm vào giỏ hàng</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onBuyNow(book)}
            disabled={isOutOfStock}
            className={`w-full py-2 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white active:scale-98 hover:shadow-md'
              }`}
            title={isOutOfStock ? 'Sách đã hết hàng' : 'Mua ngay và chuyển sang thanh toán'}
          >
            <span>Mua Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// THẺ VOUCHER THÔNG MINH TRỰC QUAN (SMART VOUCHER CARD)
// =========================================================================
interface VoucherCardProps {
  voucher: BestVoucherData;
  onApply: (voucher: BestVoucherData) => void;
  isApplied: boolean;
}

function SmartVoucherCard({ voucher, onApply, isApplied }: VoucherCardProps) {
  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
          <Ticket className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-black text-xs text-[#0B1F3A] bg-amber-200/90 px-1.5 py-0.5 rounded">
              {voucher.code}
            </span>
            <span className="text-[10px] text-amber-800 font-bold truncate">
              {voucher.name}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-600 mt-0.5">
            {voucher.discountAmount ? (
              <>Tiết kiệm ngay <strong className="text-rose-600">{voucher.discountAmount.toLocaleString('vi-VN')} đ</strong></>
            ) : (
              voucher.name
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onApply(voucher)}
        className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition-all cursor-pointer ${isApplied
            ? 'bg-emerald-600 text-white'
            : 'bg-[#0B1F3A] hover:bg-[#163156] text-white active:scale-95 shadow-xs'
          }`}
      >
        {isApplied ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-200" />
            Đã áp mã
          </span>
        ) : (
          'Áp dụng ngay'
        )}
      </button>
    </div>
  );
}

// =========================================================================
// COMPONENT CHÍNH: FLOATING CHATBOT WIDGET
// =========================================================================
export function FloatingChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [currentBestVoucher, setCurrentBestVoucher] = useState<BestVoucherData | null>(null);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);

  // Kết nối Giỏ hàng thông qua CartContext
  const { items: cartItems, totalItems, subtotal, addToCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  // 1. Khôi phục lịch sử chat từ sessionStorage
  useEffect(() => {
    try {
      const savedMessages = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const savedOpen = sessionStorage.getItem(STORAGE_KEY_OPEN);
      if (savedOpen === 'true') {
        setIsOpen(true);
      }
      const storedVoucher = sessionStorage.getItem('tosach_checkout_voucher');
      if (storedVoucher) {
        const parsedV = JSON.parse(storedVoucher);
        if (parsedV?.code) setAppliedVoucherCode(parsedV.code);
      }
    } catch (e) {
      console.warn('Lỗi đọc sessionStorage chat:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Lưu lịch sử chat vào sessionStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Lỗi ghi sessionStorage chat:', e);
    }
  }, [messages, isInitialized]);

  // 3. Lưu trạng thái đóng/mở chat
  useEffect(() => {
    if (!isInitialized) return;
    try {
      sessionStorage.setItem(STORAGE_KEY_OPEN, isOpen ? 'true' : 'false');
    } catch (e) {
      console.warn('Lỗi ghi sessionStorage isOpen:', e);
    }
  }, [isOpen, isInitialized]);

  // 4. Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // 5. Làm mới cuộc trò chuyện
  const handleResetChat = () => {
    const freshWelcome: Message = {
      ...DEFAULT_WELCOME_MESSAGE,
      id: `welcome-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([freshWelcome]);
    setCurrentBestVoucher(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch (e) {
      console.warn('Lỗi xóa sessionStorage:', e);
    }
  };

  // 6. Thêm vào giỏ từ thẻ sách
  const handleAddToCartFromCard = (book: SuggestedBook, e: React.MouseEvent<HTMLElement>) => {
    if (typeof book.stockQty === 'number' && book.stockQty <= 0) {
      setToastNotification(`Sách "${book.title}" hiện tại đã hết hàng.`);
      return;
    }

    addToCart(
      {
        bookId: book.id,
        title: book.title,
        slug: book.slug,
        price: book.price,
        originalPrice: book.originalPrice || book.price,
        coverUrl: book.coverUrl || '',
        authorName: book.authorName,
        stockQty: book.stockQty ?? 50,
      },
      1,
      e.currentTarget
    );

    setToastNotification(`🛒 Đã thêm 1 cuốn "${book.title}" vào giỏ hàng!`);
  };

  // 7. Mua ngay trực tiếp từ thẻ sách (1 chạm chuyển tới /checkout)
  const handleBuyNowFromCard = (book: SuggestedBook) => {
    if (typeof book.stockQty === 'number' && book.stockQty <= 0) {
      setToastNotification(`Sách "${book.title}" hiện tại đã hết hàng.`);
      return;
    }

    // 1. Đảm bảo sách có mặt trong giỏ hàng
    addToCart(
      {
        bookId: book.id,
        title: book.title,
        slug: book.slug,
        price: book.price,
        originalPrice: book.originalPrice || book.price,
        coverUrl: book.coverUrl || '',
        authorName: book.authorName,
        stockQty: book.stockQty ?? 50,
      },
      1
    );

    // 2. Ghi đè chỉ chọn duy nhất cuốn sách này để checkout
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('tosach_checkout_selected_ids', JSON.stringify([book.id]));

        // 3. Nếu đang có voucher tốt nhất được tư vấn VÀ giá sách đủ điều kiện minOrderValue (N13)
        if (currentBestVoucher && book.price >= (currentBestVoucher.minOrderValue || 0)) {
          sessionStorage.setItem('tosach_checkout_voucher', JSON.stringify(currentBestVoucher));
        } else {
          sessionStorage.removeItem('tosach_checkout_voucher');
        }
      } catch (err) {
        console.warn('Lỗi ghi sessionStorage checkout:', err);
      }
    }

    // 4. Chuyển thẳng tới trang checkout
    setIsOpen(false);
    router.push('/checkout');
  };

  // 8. Áp dụng mã Voucher
  const handleApplyVoucher = (voucher: BestVoucherData) => {
    try {
      sessionStorage.setItem('tosach_checkout_voucher', JSON.stringify(voucher));
      setAppliedVoucherCode(voucher.code);
      setToastNotification(`🎟️ Đã áp dụng mã "${voucher.code}"! Mã sẽ tự động kích hoạt khi bạn thanh toán.`);
    } catch (e) {
      console.warn('Lỗi lưu voucher:', e);
    }
  };

  // 9. Gửi tin nhắn đến API Chat
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          cartItems: cartItems.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      // Thực thi actions từ AI
      if (Array.isArray(data.actions) && data.actions.length > 0) {
        for (const act of data.actions) {
          if (act.type === 'ADD_TO_CART' && act.item) {
            addToCart(
              {
                bookId: act.item.bookId,
                title: act.item.title,
                slug: act.item.slug,
                price: act.item.price,
                originalPrice: act.item.originalPrice || act.item.price,
                coverUrl: act.item.coverUrl || '',
                authorName: act.item.authorName,
                stockQty: act.item.stockQty ?? 50,
              },
              act.quantity || 1
            );
            setToastNotification(`🛒 ${act.message || `Đã thêm "${act.item.title}" vào giỏ!`}`);
          } else if (act.type === 'APPLY_VOUCHER' && act.voucher) {
            handleApplyVoucher(act.voucher);
          }
        }
      }

      if (data.bestVoucher) {
        setCurrentBestVoucher(data.bestVoucher);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Cảm ơn bạn! Tôi đã ghi nhận yêu cầu của bạn.',
        suggestedBooks: data.suggestedBooks || [],
        bestVoucher: data.bestVoucher || null,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0B1F3A] to-[#163156] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-amber-400/40 cursor-pointer"
            aria-label="Mở Trợ lý Bán Hàng AI Tổ Sách"
          >
            {/* Ping animation effect */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F5A623]"></span>
            </span>

            {/* Badge số lượng sách trong giỏ */}
            {totalItems > 0 && (
              <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {totalItems}
              </span>
            )}

            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-[#F5A623]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <div className="text-left hidden sm:block pr-1">
              <div className="text-xs font-black tracking-wide flex items-center gap-1 text-white">
                <span>Trợ Lý Bán Hàng AI</span>
              </div>
              <div className="text-[10px] text-amber-300/90 font-medium">
                Tư vấn sách & Chốt đơn 24/7
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 2. CHAT DIALOG MODAL WINDOW */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[640px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-6 duration-200"
          role="dialog"
          aria-label="Khung trò chuyện Trợ lý Bán Hàng AI"
        >
          {/* Header */}
          <div className="bg-[#0B1F3A] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[#F5A623]">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0B1F3A] rounded-full"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 leading-snug">
                  Trợ Lý Bán Hàng AI
                  <span className="text-[10px] bg-amber-400/20 text-[#F5A623] px-1.5 py-0.5 rounded font-mono font-bold">
                    Tổ Sách
                  </span>
                </h3>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng chat"
                aria-label="Đóng chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast Notification Strip */}
          {toastNotification && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-emerald-900 text-[11px] font-semibold animate-in fade-in slide-in-from-top-1 shrink-0">
              <span className="truncate pr-2">{toastNotification}</span>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const hasBooks = Array.isArray(msg.suggestedBooks) && msg.suggestedBooks.length > 0;
              const { intro, outro } = hasBooks && msg.role === 'assistant'
                ? splitMessageContent(msg.content, msg.suggestedBooks || [])
                : { intro: msg.content, outro: '' };

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* 1. Lời mở đầu của AI hoặc nội dung tin nhắn người dùng */}
                  {intro && (
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 leading-relaxed shadow-2xs ${msg.role === 'user'
                          ? 'bg-[#0B1F3A] text-white rounded-br-xs font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                    >
                      <MarkdownMessage content={intro} isUser={msg.role === 'user'} />
                    </div>
                  )}

                  {/* 2. Danh sách từng cuốn sách tuần tự: Thông điệp, Tên, NXB, Giá, Voucher, Tồn kho -> Hình ảnh + Nút Mua ngay bên dưới */}
                  {hasBooks && (
                    <div className="mt-2.5 space-y-3 w-full max-w-[98%]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
                          Gợi ý tuyển chọn ({msg.suggestedBooks?.length} cuốn):
                        </span>
                      </div>
                      <div className="space-y-3">
                        {msg.suggestedBooks?.map((book, idx) => (
                          <ChatBookCard
                            key={book.id}
                            book={book}
                            index={idx}
                            bestVoucher={msg.bestVoucher}
                            onAddToCart={handleAddToCartFromCard}
                            onBuyNow={handleBuyNowFromCard}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Voucher gợi ý đính kèm tin nhắn AI nếu có */}
                  {msg.bestVoucher && (
                    <div className="mt-2.5 w-full max-w-[98%]">
                      <SmartVoucherCard
                        voucher={msg.bestVoucher}
                        onApply={handleApplyVoucher}
                        isApplied={appliedVoucherCode === msg.bestVoucher.code}
                      />
                    </div>
                  )}

                  {/* 4. Lời kết luận / Chính sách ưu đãi Freeship & Đổi trả */}
                  {outro && (
                    <div className="mt-2 max-w-[90%] rounded-2xl px-3.5 py-2.5 bg-amber-50/70 text-slate-700 border border-amber-200/60 text-xs">
                      <MarkdownMessage content={outro} isUser={false} />
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 px-1 mt-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl w-fit shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5A623]" />
                <span className="text-[11px] font-medium">Đang thực hiện tra cứu...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Giỏ Hàng Strip: Hiển thị nhanh khi giỏ có sách */}
          {totalItems > 0 && (
            <div className="bg-amber-50/95 border-t border-amber-200/90 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#0B1F3A] flex items-center justify-center text-amber-400 shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] truncate">
                  <span className="text-slate-600">Giỏ hàng: </span>
                  <span className="font-bold text-[#0B1F3A]">{totalItems} cuốn</span>
                  <span className="text-slate-400 mx-1">•</span>
                  <span className="font-extrabold text-[#D97706]">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0B1F3A] hover:bg-[#163156] px-3 py-1 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <span>Thanh toán ngay</span>
                <ArrowRight className="w-3 h-3 text-[#F5A623]" />
              </Link>
            </div>
          )}

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 min-w-max">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-100 text-[#0B1F3A] text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi về sách, tác giả, voucher... (VD: 'Tìm sách trinh thám')..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0B1F3A] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] focus:outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-[#0B1F3A] hover:bg-[#163156] disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Gửi câu hỏi"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
              ) : (
                <Send className="w-4 h-4 text-[#F5A623]" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
