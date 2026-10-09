import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { syncBooksToElasticsearch } from '@/lib/elasticsearch';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.SUPER_ADMIN && !user.permissions?.includes('MANAGE_BOOKS'))) {
      return NextResponse.json({ error: 'Không đủ quyền hạn thực hiện đồng bộ.' }, { status: 403 });
    }

    const result = await syncBooksToElasticsearch();
    return NextResponse.json({
      success: true,
      result,
      message: `Đã đồng bộ ${result.count} cuốn sách sang Elasticsearch 8.x index books_v1.`,
    });
  } catch (error: any) {
    console.error('Error syncing books to ES:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi đồng bộ' }, { status: 500 });
  }
}
