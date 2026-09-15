import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký trên hệ thống' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        role: UserRole.USER,
        profile: {
          create: {},
        },
      },
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        permissions: [],
      },
    });

    response.cookies.set('tosach_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trong quá trình đăng ký' },
      { status: 500 }
    );
  }
}
