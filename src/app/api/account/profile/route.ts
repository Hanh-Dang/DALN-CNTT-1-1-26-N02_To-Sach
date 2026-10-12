import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Không trả về passwordHash
    const { passwordHash, ...safeUser } = fullUser;

    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin hồ sơ:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      phone,
      avatarUrl,
      gender,
      birthday,
      bio,
      addressProvince,
      addressDistrict,
      addressWard,
      addressDetail,
    } = body;

    // Validate họ và tên
    if (fullName !== undefined && (!fullName || fullName.trim().length < 2)) {
      return NextResponse.json({ error: 'Họ và tên phải có ít nhất 2 ký tự' }, { status: 400 });
    }

    // Kiểm tra số điện thoại nếu thay đổi xem có bị trùng với user khác không
    if (phone && phone.trim()) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: phone.trim(),
          id: { not: user.id },
        },
      });
      if (existingPhone) {
        return NextResponse.json({ error: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' }, { status: 400 });
      }
    }

    // Cập nhật User và UserProfile bằng transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật bảng users
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
          ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl ? avatarUrl.trim() : null } : {}),
        },
      });

      // 2. Upsert bảng user_profiles
      const parsedBirthday = birthday ? new Date(birthday) : null;
      await tx.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          gender: gender || null,
          birthday: parsedBirthday,
          addressProvince: addressProvince || null,
          addressDistrict: addressDistrict || null,
          addressWard: addressWard || null,
          addressDetail: addressDetail || null,
        },
        update: {
          ...(gender !== undefined ? { gender: gender || null } : {}),
          ...(birthday !== undefined ? { birthday: parsedBirthday } : {}),
          ...(addressProvince !== undefined ? { addressProvince: addressProvince || null } : {}),
          ...(addressDistrict !== undefined ? { addressDistrict: addressDistrict || null } : {}),
          ...(addressWard !== undefined ? { addressWard: addressWard || null } : {}),
          ...(addressDetail !== undefined ? { addressDetail: addressDetail || null } : {}),
        },
      });

      return u;
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    const { passwordHash, ...safeRefreshed } = refreshedUser!;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: safeRefreshed,
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật hồ sơ:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}
