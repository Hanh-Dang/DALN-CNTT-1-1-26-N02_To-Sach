import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/admin/books
 * Lấy danh sách sách có hỗ trợ tìm kiếm, lọc theo tồn kho, phân trang
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập danh sách quản trị sách.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'ALL'; // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK
    const categoryId = searchParams.get('categoryId') || '';
    const publisher = searchParams.get('publisher') || '';

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { isbn: { contains: search.trim(), mode: 'insensitive' } },
        { publisher: { contains: search.trim(), mode: 'insensitive' } },
        { authors: { some: { author: { name: { contains: search.trim(), mode: 'insensitive' } } } } },
      ];
    }

    if (status === 'IN_STOCK') {
      where.stockQty = { gt: 10 };
    } else if (status === 'LOW_STOCK') {
      where.stockQty = { gt: 0, lte: 10 };
    } else if (status === 'OUT_OF_STOCK') {
      where.stockQty = { lte: 0 };
    }

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (publisher && publisher !== 'Tất cả NXB') {
      where.publisher = publisher;
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error('Error fetching admin books:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách sách.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/books
 * Thêm sách mới (Chỉ SUPER_ADMIN hoặc Staff có quyền MANAGE_BOOKS)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasBookPerm = user.permissions?.includes('MANAGE_BOOKS');

    if (!isSuperAdmin && !hasBookPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_BOOKS để thêm sách mới.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug,
      isbn,
      publisher,
      publishYear,
      pageCount,
      originalPrice,
      price,
      stockQty = 10,
      coverUrl,
      extraImages = [],
      description,
      weightG,
      sizeCm,
      format = 'Bìa mềm',
      language = 'Tiếng Việt',
      translator,
      authorName = 'Nhiều tác giả',
      categoryId,
      tags = [],
      isBestseller = false,
      isNew = true,
      isFeatured = false,
    } = body;

    if (!title || !price || !coverUrl) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ tiêu đề, giá bán và ảnh bìa.' },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    const numOriginalPrice = originalPrice !== undefined ? Number(originalPrice) : numPrice;
    if (!Number.isFinite(numPrice) || numPrice <= 0 || !Number.isFinite(numOriginalPrice) || numOriginalPrice <= 0) {
      return NextResponse.json(
        { error: 'Giá bán và giá bìa phải là số nguyên dương lớn hơn 0.' },
        { status: 400 }
      );
    }

    // Tạo slug chuẩn hóa nếu chưa có
    let safeSlug = slug;
    if (!safeSlug) {
      safeSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Kiểm tra trùng slug
    const existing = await prisma.book.findUnique({ where: { slug: safeSlug } });
    if (existing) {
      safeSlug = `${safeSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Tìm hoặc tạo tác giả
    let author = await prisma.author.findFirst({
      where: { name: { equals: authorName.trim(), mode: 'insensitive' } },
    });

    if (!author) {
      const authorSlug = authorName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      author = await prisma.author.create({
        data: {
          name: authorName.trim(),
          slug: `${authorSlug}-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // Tạo sách
    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        slug: safeSlug,
        isbn: isbn?.trim() || null,
        publisher: publisher?.trim() || null,
        publishYear: publishYear ? parseInt(publishYear, 10) : null,
        pageCount: pageCount ? parseInt(pageCount, 10) : null,
        originalPrice: originalPrice ? parseInt(originalPrice, 10) : parseInt(price, 10),
        price: parseInt(price, 10),
        stockQty: parseInt(stockQty, 10) || 0,
        coverUrl: coverUrl.trim(),
        extraImages: Array.isArray(extraImages) ? extraImages : [],
        description: description?.trim() || null,
        weightG: weightG ? parseInt(weightG, 10) : null,
        sizeCm: sizeCm?.trim() || null,
        format: format || 'Bìa mềm',
        language: language || 'Tiếng Việt',
        translator: translator?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        isBestseller: !!isBestseller,
        isNew: !!isNew,
        isFeatured: !!isFeatured,
        authors: {
          create: [{ authorId: author.id }],
        },
        ...(categoryId
          ? {
              categories: {
                create: [{ categoryId }],
              },
            }
          : {}),
      },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    // Ghi nhận Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_BOOK',
          targetType: 'BOOK',
          targetId: newBook.id,
          details: {
            title: newBook.title,
            stockQty: newBook.stockQty,
            price: newBook.price,
            publisher: newBook.publisher,
          },
        },
      });
    } catch (e) {
      console.warn('AuditLog creation ignored:', e);
    }

    return NextResponse.json({ success: true, book: newBook }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo sách mới.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/books
 * Cập nhật sách hoặc nhập thêm tồn kho (RESTOCK)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasBookPerm = user.permissions?.includes('MANAGE_BOOKS');

    if (!isSuperAdmin && !hasBookPerm) {
      return NextResponse.json(
        { error: 'Bạn không có quyền MANAGE_BOOKS để cập nhật thông tin sách.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, bookId } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu mã sách (bookId).' }, { status: 400 });
    }

    const currentBook = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!currentBook) {
      return NextResponse.json({ error: 'Không tìm thấy sách.' }, { status: 404 });
    }

    // 1. KỊCH BẢN NHẬP KHO NHANH (Tạo phiếu nhập kho / RESTOCK)
    if (action === 'RESTOCK') {
      const addedQty = parseInt(body.addedQty, 10);
      const note = body.note || 'Nhập thêm từ NXB';
      const supplier = body.supplier || currentBook.publisher || 'NXB';

      if (isNaN(addedQty) || addedQty <= 0) {
        return NextResponse.json(
          { error: 'Số lượng nhập kho phải lớn hơn 0.' },
          { status: 400 }
        );
      }

      const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: {
          stockQty: { increment: addedQty },
        },
        include: {
          authors: { include: { author: true } },
          categories: { include: { category: true } },
        },
      });

      // Ghi nhận Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE_BOOK_STOCK',
            targetType: 'BOOK',
            targetId: bookId,
            details: {
              previousStock: currentBook.stockQty,
              addedQty,
              newStock: updatedBook.stockQty,
              supplier,
              note,
            },
          },
        });
      } catch (e) {
        console.warn('AuditLog error:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Đã nhập thêm ${addedQty} cuốn vào kho thành công!`,
        book: updatedBook,
      });
    }

    // 2. KỊCH BẢN SỬA THÔNG TIN SÁCH (EDIT_BOOK)
    const {
      title,
      price,
      originalPrice,
      stockQty,
      isbn,
      publisher,
      format,
      pageCount,
      coverUrl,
      description,
      categoryId,
      authorName,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (price !== undefined) {
      const p = parseInt(price, 10);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ error: 'Giá bán phải là số nguyên dương lớn hơn 0.' }, { status: 400 });
      }
      updateData.price = p;
    }
    if (originalPrice !== undefined) {
      const op = parseInt(originalPrice, 10);
      if (isNaN(op) || op <= 0) {
        return NextResponse.json({ error: 'Giá bìa gốc phải là số nguyên dương lớn hơn 0.' }, { status: 400 });
      }
      updateData.originalPrice = op;
    }
    if (stockQty !== undefined) updateData.stockQty = Math.max(0, parseInt(stockQty, 10));
    if (isbn !== undefined) updateData.isbn = isbn ? isbn.trim() : null;
    if (publisher !== undefined) updateData.publisher = publisher ? publisher.trim() : null;
    if (format !== undefined) updateData.format = format;
    if (pageCount !== undefined) updateData.pageCount = pageCount ? parseInt(pageCount, 10) : null;
    if (coverUrl) updateData.coverUrl = coverUrl.trim();
    if (description !== undefined) updateData.description = description;

    // Cập nhật quan hệ danh mục nếu có thay đổi
    if (categoryId) {
      await prisma.bookCategory.deleteMany({ where: { bookId } });
      await prisma.bookCategory.create({
        data: { bookId, categoryId },
      });
    }

    // Cập nhật tác giả nếu có
    if (authorName) {
      let author = await prisma.author.findFirst({
        where: { name: { equals: authorName.trim(), mode: 'insensitive' } },
      });
      if (!author) {
        const authorSlug = authorName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        author = await prisma.author.create({
          data: {
            name: authorName.trim(),
            slug: `${authorSlug}-${Date.now().toString().slice(-4)}`,
          },
        });
      }
      await prisma.bookAuthor.deleteMany({ where: { bookId } });
      await prisma.bookAuthor.create({
        data: { bookId, authorId: author.id },
      });
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    // Ghi nhận Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_BOOK',
          targetType: 'BOOK',
          targetId: bookId,
          details: {
            title: updatedBook.title,
            price: updatedBook.price,
            stockQty: updatedBook.stockQty,
          },
        },
      });
    } catch (e) {
      console.warn('AuditLog error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin sách thành công.',
      book: updatedBook,
    });
  } catch (error: any) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể cập nhật sách.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/books
 * Xóa sách (Chỉ SUPER_ADMIN)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới có quyền xóa tựa sách khỏi hệ thống.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('id');

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu mã sách cần xóa.' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { orderItems: true },
    });

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy sách.' }, { status: 404 });
    }

    if (book.orderItems.length > 0) {
      // Nếu đã có đơn hàng thì không xóa cứng, chuyển sang ẩn bán
      await prisma.book.update({
        where: { id: bookId },
        data: { isActive: false, stockQty: 0 },
      });
      return NextResponse.json({
        success: true,
        message: 'Sách đã có trong lịch sử đơn mua nên đã được chuyển sang trạng thái Ẩn bán và tồn kho = 0.',
      });
    }

    await prisma.book.delete({ where: { id: bookId } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_BOOK',
          targetType: 'BOOK',
          targetId: bookId,
          details: { title: book.title },
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tựa sách khỏi cơ sở dữ liệu.',
    });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xóa sách.' },
      { status: 500 }
    );
  }
}
