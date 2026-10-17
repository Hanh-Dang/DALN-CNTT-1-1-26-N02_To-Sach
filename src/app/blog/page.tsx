import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';
import { Newspaper, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Góc đọc sách & Bài viết hay | Tổ Sách Studio',
  description: 'Góc nhìn, điểm sách hay, chia sẻ kinh nghiệm đọc sách cùng cộng đồng mọt sách Tổ Sách.',
};

export default function BlogPage() {
  const posts = [
    {
      id: '1',
      title: 'Top 5 cuốn sách khởi nghiệp tinh gọn dành cho người mới bắt đầu',
      excerpt: 'Khởi sự kinh doanh không bắt đầu từ vốn lớn, mà bắt đầu từ tư duy thử nghiệm nhanh và học hỏi từ phản hồi khách hàng.',
      category: 'Kinh tế & Khởi nghiệp',
      date: '16/10/2026',
      readTime: '5 phút đọc',
      link: '/catalog?category=kinh-te-khoi-nghiep',
    },
    {
      id: '2',
      title: 'Xây dựng thói quen đọc sách mỗi ngày: Bắt đầu từ 15 phút',
      excerpt: 'Làm thế nào để duy trì thói quen đọc sách ngay cả khi công việc bận rộn? Phương pháp nguyên tử giúp bạn đọc 20 cuốn sách mỗi năm.',
      category: 'Kỹ năng sống',
      date: '14/10/2026',
      readTime: '4 phút đọc',
      link: '/catalog?category=ky-nang-song',
    },
    {
      id: '3',
      title: 'Những tác phẩm văn học kinh điển nên đọc ít nhất một lần trong đời',
      excerpt: 'Cùng Tổ Sách chiêm nghiệm những kiệt tác văn học trường tồn qua thời gian, nuôi dưỡng tâm hồn và mở rộng nhân sinh quan.',
      category: 'Văn học',
      date: '10/10/2026',
      readTime: '6 phút đọc',
      link: '/catalog?category=van-hoc',
    },
  ];

  return (
    <PolicyPageLayout
      title="Góc đọc sách & Điểm sách hay"
      subtitle="Nơi sẻ chia niềm đam mê con chữ, review sách chất lượng và lan tỏa văn hóa đọc bền vững."
      badge="Blog Tổ Sách"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0B1F3A] flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-500" />
            Bài viết mới nhất
          </h2>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Cập nhật tuần này
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  {post.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <Link
                  href={post.link}
                  className="font-bold text-[#0B1F3A] group-hover:text-amber-600 flex items-center gap-0.5 transition-colors"
                >
                  <span>Xem sách</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PolicyPageLayout>
  );
}
