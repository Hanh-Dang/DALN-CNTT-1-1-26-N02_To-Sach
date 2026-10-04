import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatVND } from '@/lib/utils';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          book: true,
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPING').length;
  const completedCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFDDB4] text-[#6B4500] text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            Chờ duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DEE8FF] text-[#0B1F3A] text-xs font-bold">
            <Truck className="w-3.5 h-3.5" />
            Đã xác nhận
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold">
            <Truck className="w-3.5 h-3.5" />
            Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            Hoàn tất
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111C2D]">
              Quản lý Đơn hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFDDB4] text-[#6B4500] text-xs font-bold">
              {pendingCount} đơn chờ duyệt
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, xử lý và phân phối xuất kho các đơn đặt hàng trực tuyến từ khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-lg bg-[#E7EEFF] text-[#0B1F3A] hover:bg-[#D8E3FB] text-xs font-semibold transition-colors"
          >
            ← Về Dashboard
          </Link>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(11,31,58,0.06)] border border-slate-100 flex flex-col gap-4">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F0F3FF] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200">
                <th className="py-3 px-3">MÃ ĐƠN</th>
                <th className="py-3 px-3">KHÁCH HÀNG</th>
                <th className="py-3 px-3">SẢN PHẨM & SỐ LƯỢNG</th>
                <th className="py-3 px-3">TỔNG TIỀN</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3">NGÀY ĐẶT</th>
                <th className="py-3 px-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const customerName = order.customerName || order.user?.fullName || 'Khách vãng lai';
                const mainBookTitle = order.items[0]?.bookTitle || order.items[0]?.book?.title || 'Đơn hàng sách';
                const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-[#F0F3FF]/50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#0B1F3A]">
                      #{order.orderCode}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.user?.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{mainBookTitle}</div>
                      {totalItems > 1 && (
                        <div className="text-[11px] text-slate-400">+{totalItems - 1} cuốn khác</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#111C2D]">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        className="px-2.5 py-1 rounded bg-[#0B1F3A] text-white font-semibold text-xs hover:bg-[#263143] transition-colors"
                        type="button"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
