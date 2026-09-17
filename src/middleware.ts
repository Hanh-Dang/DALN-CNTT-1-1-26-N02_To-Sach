import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default_tosach_jwt_secret_dev_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('tosach_token')?.value;

  // Protect Admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, key);
      const role = (payload as any).role;

      // Only STAFF or SUPER_ADMIN can enter /admin
      if (role !== 'STAFF' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Invalid token
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('tosach_token');
      return response;
    }
  }

  // Protect Checkout route (Trường phái 1: Guest cart allowed, Auth required at checkout)
  if (pathname.startsWith('/checkout')) {
    if (!token) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, key);
    } catch {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('tosach_token');
      return response;
    }
  }

  // Protect User Account & Orders routes
  if (pathname.startsWith('/account') || pathname.startsWith('/profile')) {
    if (!token) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, key);
    } catch {
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('tosach_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/profile/:path*', '/checkout/:path*'],
};
