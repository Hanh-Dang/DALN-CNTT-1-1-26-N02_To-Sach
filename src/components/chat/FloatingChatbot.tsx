'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, X, Send, Sparkles, Loader2, 
  ArrowRight, RefreshCw, BookOpen 
} from 'lucide-react';

interface SuggestedBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  coverUrl: string | null;
  authorName: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedBooks?: SuggestedBook[];
  timestamp: string;
}

const STORAGE_KEY_MESSAGES = 'tosach_chatbot_history_v1';
const STORAGE_KEY_OPEN = 'tosach_chatbot_open_state';

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào bạn! Tôi là **Trợ lý AI của Nhà Sách Tổ Sách** 🦉.\n\nTôi có thể giúp bạn:\n- 📖 Gợi ý sách hay theo sở thích và tâm trạng\n- 🚚 Giải đáp chính sách *Freeship từ 250k, Đồng kiểm, Đổi trả 7 ngày*\n- 💳 Hướng dẫn thanh toán *VietQR MBBank* & thông tin liên hệ\n\nBạn đang quan tâm đến cuốn sách hay cần hỗ trợ điều gì hôm nay?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  '📈 Gợi ý sách kinh tế hay',
  '🌱 Sách tâm lý & chữa lành',
  '🔥 Top sách bán chạy',
  '🚚 Chính sách giao hàng & đổi trả',
];

// =========================================================================
// BỘ PARSER VÀ RENDER MARKDOWN THÔNG MINH CHO NỘI DUNG CHAT
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
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                isUser
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
        return <React.Fragment key={i}>{token.value}</React.Fragment>;
      })}
    </>
  );
}

function MarkdownMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        // 1. Dòng trống ngăn cách đoạn
        if (!line) {
          return <div key={idx} className="h-1" />;
        }

        // 2. Heading: ### hoặc ##
        if (line.startsWith('### ') || line.startsWith('## ')) {
          const headingText = line.replace(/^#+\s+/, '');
          return (
            <h4
              key={idx}
              className={`font-extrabold text-[12.5px] pt-1 pb-0.5 flex items-center gap-1.5 ${
                isUser ? 'text-amber-300' : 'text-[#0B1F3A]'
              }`}
            >
              <InlineText text={headingText} isUser={isUser} />
            </h4>
          );
        }

        // 3. Danh sách gạch đầu dòng: - hoặc * hoặc •
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  isUser ? 'bg-amber-300' : 'bg-[#F5A623]'
                }`}
              />
              <span className="flex-1">
                <InlineText text={line.slice(2)} isUser={isUser} />
              </span>
            </div>
          );
        }

        // 4. Danh sách đánh số: 1. 2. 3.
        const matchNum = line.match(/^(\d+)\.\s+(.*)$/);
        if (matchNum) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span
                className={`font-mono font-bold text-[11px] shrink-0 min-w-[16px] ${
                  isUser ? 'text-amber-300' : 'text-amber-800'
                }`}
              >
                {matchNum[1]}.
              </span>
              <span className="flex-1">
                <InlineText text={matchNum[2]} isUser={isUser} />
              </span>
            </div>
          );
        }

        // 5. Đoạn văn bản bình thường
        return (
          <p key={idx}>
            <InlineText text={line} isUser={isUser} />
          </p>
        );
      })}
    </div>
  );
}

// =========================================================================
// COMPONENT THẺ SÁCH GỢI Ý (BOOK CARD)
// =========================================================================

function ChatBookCard({ book }: { book: SuggestedBook }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/book/${book.slug}`}
      className="bg-white hover:bg-amber-50/60 p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 transition-all flex items-center gap-3 group shadow-2xs"
    >
      <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative border border-slate-200/80 flex items-center justify-center">
        {book.coverUrl && !imgError ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="40px"
            className="object-cover group-hover:scale-105 transition-transform"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center text-amber-700">
            <BookOpen className="w-4 h-4 text-amber-600 mb-0.5" />
            <span className="text-[7px] font-bold text-amber-800 uppercase">Sách</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-[#0B1F3A] truncate text-[11px] group-hover:text-amber-800 transition-colors">
          {book.title}
        </h4>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">
          {book.authorName}
        </p>
        <p className="text-[11px] font-extrabold text-[#F5A623] mt-0.5">
          {book.price.toLocaleString('vi-VN')} đ
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F3A] transition-colors shrink-0" />
    </Link>
  );
}

// =========================================================================
// COMPONENT CHÍNH: FLOATING CHATBOT WIDGET
// =========================================================================

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Khôi phục lịch sử chat từ sessionStorage khi chuyển trang
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
    } catch (e) {
      console.warn('Lỗi đọc sessionStorage chat:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Lưu lịch sử chat vào sessionStorage mỗi khi có tin nhắn mới
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

  // 3. Lưu trạng thái đóng/mở chat vào sessionStorage
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

  // 5. Xóa/Làm mới cuộc trò chuyện
  const handleResetChat = () => {
    const freshWelcome: Message = {
      ...DEFAULT_WELCOME_MESSAGE,
      id: `welcome-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([freshWelcome]);
    try {
      sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch (e) {
      console.warn('Lỗi xóa sessionStorage:', e);
    }
  };

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
        }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Cảm ơn bạn! Tôi đã ghi nhận câu hỏi của bạn.',
        suggestedBooks: data.suggestedBooks || [],
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
      {/* 1. FLOATING ACTION BUTTON (Góc phải dưới màn hình) */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0B1F3A] to-[#163156] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-amber-400/40 cursor-pointer"
            aria-label="Mở Trợ lý AI Tổ Sách"
          >
            {/* Ping animation effect */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F5A623]"></span>
            </span>

            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-[#F5A623]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <div className="text-left hidden sm:block pr-1">
              <div className="text-xs font-black tracking-wide flex items-center gap-1 text-white">
                <span>Hỏi AI Tổ Sách</span>
              </div>
              <div className="text-[10px] text-amber-300/90 font-medium">
                Tư vấn sách 24/7
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 2. CHAT DIALOG MODAL WINDOW */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-6 duration-200"
          role="dialog"
          aria-label="Khung trò chuyện Trợ lý AI"
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
                  Trợ Lý AI Tổ Sách
                  <span className="text-[10px] bg-amber-400/20 text-[#F5A623] px-1.5 py-0.5 rounded font-mono font-bold">
                    Flash-Lite
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Sẵn sàng tư vấn chọn sách & chính sách
                </p>
              </div>
            </div>

            {/* Action buttons: Reset & Close */}
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

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#0B1F3A] text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <MarkdownMessage content={msg.content} isUser={msg.role === 'user'} />
                </div>

                {/* Danh sách thẻ sách gợi ý đính kèm tin nhắn AI */}
                {msg.suggestedBooks && msg.suggestedBooks.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[95%]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#F5A623]" />
                      Sách gợi ý cho bạn:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.suggestedBooks.map((book) => (
                        <ChatBookCard key={book.id} book={book} />
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-slate-400 px-1 mt-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl w-fit shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5A623]" />
                <span className="text-[11px] font-medium">Trợ lý AI đang suy nghĩ...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
              placeholder="Nhập câu hỏi cho trợ lý AI..."
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
