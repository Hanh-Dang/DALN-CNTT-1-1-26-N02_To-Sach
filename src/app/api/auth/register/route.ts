import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { verifyOtp } from '@/lib/email';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, otp } = await req.json();

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ và tên' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'Định dạng email không hợp lệ' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' },
        { status: 400 }
      );
    }

    // Bắt buộc phải có mã OTP 6 chữ số hợp lệ (Khắc phục triệt để lỗ hổng H3)
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mã xác minh OTP gồm 6 chữ số' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Xác minh mã OTP bắt buộc (giới hạn 5 lần thử sai & TTL 5 phút - H5, H6)
    const isValidOtp = await verifyOtp(normalizedEmail, otp.trim());
    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Mã xác minh không chính xác, đã hết hạn hoặc bị hủy do nhập sai quá 5 lần' },
        { status: 400 }
      );
    }

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
        phone: phone && typeof phone === 'string' ? phone.trim() : null,
        role: UserRole.USER,
        emailVerified: true,
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
