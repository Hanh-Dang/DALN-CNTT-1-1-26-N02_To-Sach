import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/admin/categories
 * Lấy toàn bộ cây danh mục kèm số lượng sách
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true, slug: true, level: true },
        },
        _count: {
          select: {
            books: true,
            children: true,
          },
        },
      },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách danh mục.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Tạo mới danh mục (Cần quyền MANAGE_CATEGORIES hoặc SUPER_ADMIN)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasCategoryPerm = user.permissions?.includes('MANAGE_CATEGORIES');

    if (!isSuperAdmin && !hasCategoryPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_CATEGORIES để tạo danh mục.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, slug, parentId, level = 1, sortOrder = 0, imageUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tên danh mục không được để trống.' },
        { status: 400 }
      );
    }

    let safeSlug = slug?.trim();
    if (!safeSlug) {
      safeSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Kiểm tra trùng slug
    const existing = await prisma.category.findUnique({
      where: { slug: safeSlug },
    });
    if (existing) {
      safeSlug = `${safeSlug}-${Date.now().toString().slice(-4)}`;
    }

    let calculatedLevel = parseInt(level, 10) || 1;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (parent) {
        calculatedLevel = Math.min(3, parent.level + 1);
      }
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: safeSlug,
        parentId: parentId || null,
        level: calculatedLevel,
        sortOrder: parseInt(sortOrder, 10) || 0,
        imageUrl: imageUrl?.trim() || null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true, level: true },
        },
        _count: {
          select: {
            books: true,
            children: true,
          },
        },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: newCategory.id,
          details: {
            name: newCategory.name,
            level: newCategory.level,
            slug: newCategory.slug,
          },
        },
      });
    } catch (e) {}

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo danh mục.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/categories
 * Sửa thông tin danh mục
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasCategoryPerm = user.permissions?.includes('MANAGE_CATEGORIES');

    if (!isSuperAdmin && !hasCategoryPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_CATEGORIES để sửa danh mục.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, slug, parentId, sortOrder, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã danh mục (id).' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = slug.trim();
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;

    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        updateData.parentId = null;
        updateData.level = 1;
      } else {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (parent) {
          updateData.parentId = parentId;
          updateData.level = Math.min(3, parent.level + 1);
        }
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, slug: true, level: true },
        },
        _count: {
          select: {
            books: true,
            children: true,
          },
        },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: id,
          details: { name: updated.name, slug: updated.slug },
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      category: updated,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể cập nhật danh mục.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories
 * Xóa danh mục
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasCategoryPerm = user.permissions?.includes('MANAGE_CATEGORIES');

    if (!isSuperAdmin && !hasCategoryPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_CATEGORIES để xóa danh mục.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã danh mục cần xóa.' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { books: true, children: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục.' }, { status: 404 });
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa vì danh mục đang chứa ${category._count.children} danh mục con. Hãy xóa hoặc di chuyển các danh mục con trước.`,
        },
        { status: 400 }
      );
    }

    if (category._count.books > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa vì danh mục đang có ${category._count.books} cuốn sách trực thuộc. Vui lòng chuyển sách sang danh mục khác trước khi xóa.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: id,
          details: { name: category.name },
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục "${category.name}" thành công.`,
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xóa danh mục.' },
      { status: 500 }
    );
  }
}
