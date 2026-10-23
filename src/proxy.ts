import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from './lib/jwtKey';

const key = getJwtSecretKey();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('tosach_token')?.value;

  // Helper điều hướng về trang đăng nhập và xóa token lỗi/hết hạn
  const redirectToAuth = () => {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('tosach_token');
    return response;
  };

  // Protect Admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return redirectToAuth();
    }

    try {
      const { payload } = await jwtVerify(token, key);
      const role = (payload as any).role;

      // Only STAFF or SUPER_ADMIN can enter /admin
      if (role !== 'STAFF' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Invalid or expired token
      return redirectToAuth();
    }
  }

  // Protect Checkout route (Guest cart allowed, Auth required at checkout)
  if (pathname.startsWith('/checkout')) {
    if (!token) {
      return redirectToAuth();
    }

    try {
      await jwtVerify(token, key);
    } catch {
      return redirectToAuth();
    }
  }

  // Protect User Account & Orders routes
  if (pathname.startsWith('/account') || pathname.startsWith('/profile')) {
    if (!token) {
      return redirectToAuth();
    }

    try {
      await jwtVerify(token, key);
    } catch {
      return redirectToAuth();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*', '/profile/:path*', '/checkout/:path*'],
};
