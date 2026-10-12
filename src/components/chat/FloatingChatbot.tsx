'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, X, Send, Sparkles, MessageSquare, Loader2, 
  ShoppingBag, ArrowRight, RefreshCw, ChevronDown 
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

const QUICK_PROMPTS = [
  '📈 Gợi ý sách kinh tế hay',
  '🌱 Sách tâm lý & chữa lành',
  '🔥 Top sách bán chạy',
  '🚚 Chính sách giao hàng & đổi trả',
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào bạn! Tôi là **Trợ lý AI của Nhà Sách Tổ Sách** 🦉. Tôi có thể giúp bạn tìm kiếm sách theo thể loại, gợi ý sách tâm đắc hoặc giải đáp các chính sách mua hàng. Bạn đang tìm cuốn sách nào hôm nay?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
                    Flash
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Sẵn sàng tư vấn chọn sách & chính sách
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#0B1F3A] text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
                        <Link
                          key={book.id}
                          href={`/books/${book.slug}`}
                          className="bg-white hover:bg-amber-50/60 p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 transition-all flex items-center gap-3 group shadow-2xs"
                        >
                          <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative border border-slate-100">
                            {book.coverUrl ? (
                              <Image
                                src={book.coverUrl}
                                alt={book.title}
                                fill
                                sizes="40px"
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                Sách
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
