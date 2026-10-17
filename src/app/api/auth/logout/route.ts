import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Trích xuất token từ Cookie hoặc Authorization Header
    const cookieStore = await cookies();
    let token = cookieStore.get('tosach_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Thu hồi token phía Server (Lỗi M6)
    if (token) {
      await revokeToken(token);
    }

    // 3. Xóa cookie trên client
    const response = NextResponse.json({
      success: true,
      message: 'Đăng xuất thành công, phiên đăng nhập đã được vô hiệu hóa an toàn.',
    });
    response.cookies.delete('tosach_token');
    return response;
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    const response = NextResponse.json({ success: true, message: 'Đã xóa phiên đăng nhập.' });
    response.cookies.delete('tosach_token');
    return response;
  }
}

