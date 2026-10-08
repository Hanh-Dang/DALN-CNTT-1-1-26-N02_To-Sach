import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/user/sync
 * Lấy giỏ hàng và tủ sách yêu thích đã lưu trên Database của người dùng
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { metadata: true },
    });

    const metadata = (profile?.metadata as any) || {};
    const cart = Array.isArray(metadata.cart) ? metadata.cart : [];
    const wishlist = Array.isArray(metadata.wishlist) ? metadata.wishlist : [];

    return NextResponse.json({
      success: true,
      data: { cart, wishlist },
    });
  } catch (error) {
    console.error('Error fetching user sync data:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tải dữ liệu đồng bộ' }, { status: 500 });
  }
}

/**
 * POST /api/user/sync
 * Lưu giỏ hàng và tủ sách yêu thích lên Database
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { cart, wishlist } = body;

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { metadata: true },
    });

    const currentMetadata = (existingProfile?.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(cart !== undefined ? { cart } : {}),
      ...(wishlist !== undefined ? { wishlist } : {}),
      lastSyncedAt: new Date().toISOString(),
    };

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        metadata: updatedMetadata,
      },
      update: {
        metadata: updatedMetadata,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã đồng bộ thành công vào Database',
    });
  } catch (error) {
    console.error('Error saving user sync data:', error);
    return NextResponse.json({ success: false, error: 'Lỗi lưu dữ liệu đồng bộ' }, { status: 500 });
  }
}
