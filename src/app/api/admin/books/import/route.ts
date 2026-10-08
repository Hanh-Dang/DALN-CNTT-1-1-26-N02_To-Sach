import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * Hàm phân tích dòng CSV hỗ trợ dấu ngoặc kép chứa dấu phẩy
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * POST /api/admin/books/import
 * Nạp hàng loạt sách từ nội dung file CSV
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
        { error: 'Bạn không có quyền MANAGE_BOOKS để import sách.' },
        { status: 403 }
      );
    }

    const { csvContent } = await req.json();
    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { error: 'Dữ liệu CSV không hợp lệ hoặc rỗng.' },
        { status: 400 }
      );
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File CSV phải có ít nhất dòng tiêu đề và 1 dòng dữ liệu.' },
        { status: 400 }
      );
    }

    const header = parseCSVLine(lines[0]);
    const headerMap: Record<string, number> = {};
    header.forEach((col, idx) => {
      headerMap[col.trim()] = idx;
    });

    let importedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cols = parseCSVLine(line);
      const title = cols[headerMap['title']];
      if (!title) continue;

      const slug =
        cols[headerMap['slug']] ||
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const authorName = cols[headerMap['author']] || 'Nhiều tác giả';
      const isbn = cols[headerMap['isbn']] || null;
      const publisher = cols[headerMap['publisher']] || null;
      const publishYear = parseInt(cols[headerMap['publishYear']], 10) || null;
      const pageCount = parseInt(cols[headerMap['pageCount']], 10) || null;
      const originalPrice = parseInt(cols[headerMap['originalPrice']], 10) || 0;
      const price = parseInt(cols[headerMap['price']], 10) || originalPrice || 100000;
      const weightG = parseInt(cols[headerMap['weightG']], 10) || null;
      const sizeCm = cols[headerMap['sizeCm']] || null;
      const format = cols[headerMap['format']] || 'Bìa mềm';
      const translator = cols[headerMap['translator']] || null;
      const language = cols[headerMap['language']] || 'Tiếng Việt';
      const description = cols[headerMap['description']] || null;
      const tags = cols[headerMap['tags']]
        ? cols[headerMap['tags']].split(',').map((t) => t.trim())
        : [];
      const coverUrl =
        cols[headerMap['coverUrl']] ||
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80';
      const stockQty = parseInt(cols[headerMap['stockQty']], 10) || 20;
      const isBestseller = cols[headerMap['isBestseller']] === 'true';
      const isNew = cols[headerMap['isNew']] === 'true';
      const isFeatured = cols[headerMap['isFeatured']] === 'true';

      const catL1 = cols[headerMap['category_level1']];
      const catL2 = cols[headerMap['category_level2']];
      const catL3 = cols[headerMap['category_level3']];

      try {
        // 1. Tác giả
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

        // 2. Tìm danh mục tương ứng (ưu tiên L3 -> L2 -> L1)
        let category = null;
        if (catL3) {
          category = await prisma.category.findFirst({
            where: { name: { equals: catL3.trim(), mode: 'insensitive' } },
          });
        }
        if (!category && catL2) {
          category = await prisma.category.findFirst({
            where: { name: { equals: catL2.trim(), mode: 'insensitive' } },
          });
        }
        if (!category && catL1) {
          category = await prisma.category.findFirst({
            where: { name: { equals: catL1.trim(), mode: 'insensitive' } },
          });
        }

        // 3. Upsert Book
        const existingBook = await prisma.book.findFirst({
          where: {
            OR: [{ slug }, ...(isbn ? [{ isbn }] : [])],
          },
        });

        if (existingBook) {
          await prisma.book.update({
            where: { id: existingBook.id },
            data: {
              title,
              isbn: isbn || existingBook.isbn,
              publisher: publisher || existingBook.publisher,
              publishYear: publishYear || existingBook.publishYear,
              pageCount: pageCount || existingBook.pageCount,
              originalPrice: originalPrice || existingBook.originalPrice,
              price: price || existingBook.price,
              weightG: weightG || existingBook.weightG,
              sizeCm: sizeCm || existingBook.sizeCm,
              format: format || existingBook.format,
              translator: translator || existingBook.translator,
              language: language || existingBook.language,
              description: description || existingBook.description,
              stockQty: stockQty !== undefined ? stockQty : existingBook.stockQty,
              coverUrl: coverUrl || existingBook.coverUrl,
              tags: tags.length > 0 ? tags : existingBook.tags,
              isBestseller,
              isNew,
              isFeatured,
            },
          });
          updatedCount++;
        } else {
          const newBook = await prisma.book.create({
            data: {
              title,
              slug,
              isbn,
              publisher,
              publishYear,
              pageCount,
              originalPrice: originalPrice || price,
              price,
              weightG,
              sizeCm,
              format,
              translator,
              language,
              description,
              coverUrl,
              stockQty,
              tags,
              isBestseller,
              isNew,
              isFeatured,
              authors: {
                create: [{ authorId: author.id }],
              },
              ...(category
                ? {
                    categories: {
                      create: [{ categoryId: category.id }],
                    },
                  }
                : {}),
            },
          });
          importedCount++;
        }
      } catch (err: any) {
        errors.push(`Dòng ${i + 1} (${title}): ${err.message}`);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'IMPORT_BOOKS_CSV',
          targetType: 'BOOK',
          details: {
            importedCount,
            updatedCount,
            totalRows: lines.length - 1,
            errorsCount: errors.length,
          },
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Đã nạp thành công: ${importedCount} sách mới, cập nhật ${updatedCount} sách có sẵn.`,
      importedCount,
      updatedCount,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể xử lý file CSV.' },
      { status: 500 }
    );
  }
}
