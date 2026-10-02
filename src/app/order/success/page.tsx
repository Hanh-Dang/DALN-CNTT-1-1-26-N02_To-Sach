import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import OrderSuccessClient from '@/components/checkout/OrderSuccessClient';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đặt Hàng Thành Công | Tổ Sách - Kho Tàng Tri Thức Việt',
  description: 'Cảm ơn bạn đã đặt sách tại Tổ Sách. Đơn hàng của bạn đã được tiếp nhận và xử lý.',
};

interface OrderSuccessPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const { code } = await searchParams;

  if (!code) {
    redirect('/');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth?redirect=/order/success?code=${code}`);
  }

  // Truy vấn chi tiết đơn hàng từ database
  const order = await prisma.order.findUnique({
    where: { orderCode: code },
    include: {
      items: true,
    },
  });

  if (!order || (order.userId !== user.id && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#F5A623] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#0B1F3A]">Không tìm thấy đơn hàng</h1>
            <p className="text-xs text-slate-500">
              Mã đơn hàng <strong>{code}</strong> không tồn tại hoặc bạn không có quyền xem đơn hàng này.
            </p>
          </div>
          <div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-[#0B1F3A] hover:bg-[#163156] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#F5A623]" />
              <span>Khám phá kho sách</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen py-10">
      <OrderSuccessClient order={order} />
    </div>
  );
}
