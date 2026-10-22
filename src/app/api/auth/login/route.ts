import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { isLoginBlocked, recordLoginFailure, clearLoginFailures, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(req);
    // N19: Khóa đăng nhập theo cặp (IP, Email) chống kẻ xấu lợi dụng DoS khóa tài khoản admin
    const loginIdentifier = `${clientIp}:${normalizedEmail}`;

    // 1. Kiểm tra tài khoản từ IP này có đang bị khóa do nhập sai mật khẩu quá 5 lần không (N19)
    const lockCheck = await isLoginBlocked(loginIdentifier);
    if (lockCheck.blocked) {
      const waitMinutes = Math.max(1, Math.ceil(lockCheck.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error: `Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp trên thiết bị này. Vui lòng thử lại sau ${waitMinutes} phút hoặc đặt lại mật khẩu.`,
          retryAfter: lockCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        staffPerms: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      const fail = await recordLoginFailure(loginIdentifier);
      if (fail.isNowBlocked) {
        return NextResponse.json(
          {
            error: 'Bạn đã nhập sai thông tin quá 5 lần liên tiếp. Tạm thời khóa đăng nhập 15 phút từ thiết bị này.',
            retryAfter: 900,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Email hoặc mật khẩu không chính xác. Bạn còn ${fail.remainingAttempts} lần thử trước khi bị tạm khóa.` },
        { status: 401 }
      );
    }

    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const fail = await recordLoginFailure(loginIdentifier);
      if (fail.isNowBlocked) {
        return NextResponse.json(
          {
            error: 'Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Tạm thời khóa đăng nhập 15 phút từ thiết bị này.',
            retryAfter: 900,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Email hoặc mật khẩu không chính xác. Bạn còn ${fail.remainingAttempts} lần thử trước khi bị tạm khóa.` },
        { status: 401 }
      );
    }

    // Đăng nhập thành công -> Xóa bộ đếm thử sai
    await clearLoginFailures(loginIdentifier);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.staffPerms.map((sp) => sp.permission.code);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        permissions,
      },
    });

    // Set secure HttpOnly cookie
    response.cookies.set('tosach_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trong quá trình đăng nhập' },
      { status: 500 }
    );
  }
}
