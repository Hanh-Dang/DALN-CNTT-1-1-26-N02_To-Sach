import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import OrdersClient from '@/components/account/OrdersClient';

export const metadata: Metadata = {
  title: 'Lịch Sử Đơn Mua | Tổ Sách - Kho Tàng Tri Thức Việt',
  description: 'Theo dõi tiến độ vận chuyển và lịch sử các đơn đặt sách của bạn tại Tổ Sách.',
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/account/orders');
  }

  // Lấy toàn bộ đơn hàng của người dùng hiện tại
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="bg-slate-50/60 min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <OrdersClient 
          initialOrders={JSON.parse(JSON.stringify(orders))} 
          userName={user.fullName || user.email}
        />
      </div>
    </div>
  );
}
