import { prisma } from '@/lib/prisma';
import { validateVoucher, calculateVoucherDiscount, getEffectiveVoucherDates } from '@/lib/voucher';
import { Prisma } from '@prisma/client';

/**
 * Ngữ cảnh thực thi Tool phía Server (Bảo mật: lấy từ Session / Client Context)
 */
export interface ToolContext {
  userId?: string | null;
  currentCartItems?: Array<{ bookId: string; quantity: number }>;
}

export interface ToolDefinition<TArgs = any, TResult = any> {
  declaration: {
    name: string;
    description: string;
    parameters?: {
      type: 'OBJECT';
      properties?: Record<string, any>;
      required?: string[];
    };
  };
  execute: (args: TArgs, ctx: ToolContext) => Promise<TResult>;
}

// =========================================================================
// 1. TOOL: search_books (Tìm kiếm thông minh trên 5.125 cuốn sách thật)
// =========================================================================
export const searchBooksTool: ToolDefinition = {
  declaration: {
    name: 'search_books',
    description:
      'Tìm kiếm sách trong kho dữ liệu hơn 5.000 cuốn của Tổ Sách theo mảng từ khóa mở rộng (tiêu đề, tác giả, danh mục, nội dung) hoặc thể loại, khoảng giá. Trả về thông tin chính xác 100% về giá, tồn kho thực tế, nhà xuất bản và tác giả.',
    parameters: {
      type: 'OBJECT',
      properties: {
        keywords: {
          type: 'ARRAY',
          description:
            'Mảng 2-5 từ khóa ngắn, từ đồng nghĩa hoặc cụm từ trọng tâm không dấu/có dấu (Ví dụ: ["trinh thám", "nhật bản", "keigo"], ["lập trình", "python"], ["cảm xúc", "buồn", "chữa lành"]). Không truyền cả câu dài.',
          items: { type: 'STRING' },
        },
        categorySlug: {
          type: 'STRING',
          description:
            'Slug danh mục nếu khách muốn lọc cụ thể (Ví dụ: "cong-nghe-lap-trinh", "trinh-tham-nhat-ban", "kinh-te-ky-nang", "tam-ly-triet-hoc", "van-hoc", "thieu-nhi", "lich-su-van-hoa").',
        },
        minPrice: {
          type: 'NUMBER',
          description: 'Mức giá bán tối thiểu bằng VNĐ',
        },
        maxPrice: {
          type: 'NUMBER',
          description: 'Mức giá bán tối đa bằng VNĐ',
        },
      },
      required: ['keywords'],
    },
  },
  execute: async (
    args: { keywords?: string[]; categorySlug?: string; minPrice?: number; maxPrice?: number },
    ctx: ToolContext
  ) => {
    try {
      const rawKeywords = Array.isArray(args.keywords) ? args.keywords : [];
      // Làm sạch mảng từ khóa: 1-5 từ, 2-40 ký tự mỗi từ
      const cleanKeywords = Array.from(
        new Set(
          rawKeywords
            .map((k) => (typeof k === 'string' ? k.trim() : ''))
            .filter((k) => k.length >= 2 && k.length <= 40)
        )
      ).slice(0, 5);
      // 4.1: Nếu không có từ khóa nhưng có lọc khoảng giá hoặc thể loại, tìm trực tiếp sách phù hợp
      if (cleanKeywords.length === 0 && (args.minPrice !== undefined || args.maxPrice !== undefined || args.categorySlug)) {
        const minP = typeof args.minPrice === 'number' && args.minPrice >= 0 ? args.minPrice : null;
        const maxP = typeof args.maxPrice === 'number' && args.maxPrice > 0 ? args.maxPrice : null;
        let validCatSlug: string | null = null;
        if (args.categorySlug) {
          const catExists = await prisma.category.findUnique({
            where: { slug: args.categorySlug.trim() },
            select: { slug: true },
          });
          if (catExists) validCatSlug = catExists.slug;
        }

        const directBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            stockQty: { gt: 0 },
            ...(minP !== null || maxP !== null
              ? {
                  price: {
                    ...(minP !== null ? { gte: minP } : {}),
                    ...(maxP !== null ? { lte: maxP } : {}),
                  },
                }
              : {}),
            ...(validCatSlug
              ? { categories: { some: { category: { slug: validCatSlug } } } }
              : {}),
          },
          take: 5,
          orderBy: [{ isBestseller: 'desc' }, { soldCount: 'desc' }],
          include: {
            authors: { include: { author: { select: { name: true } } } },
            categories: { include: { category: { select: { name: true, slug: true } } } },
          },
        });

        if (directBooks.length > 0) {
          return {
            success: true,
            totalFound: directBooks.length,
            isSuggestion: false,
            books: directBooks.map((b) => ({
              id: b.id,
              title: b.title,
              slug: b.slug,
              price: b.price,
              originalPrice: b.originalPrice || b.price,
              stockQty: b.stockQty,
              inStock: true,
              coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
              authorName: b.authors.map((ba) => ba.author.name).join(', ') || 'Tổ Sách Tuyển Chọn',
              publisher: b.publisher || 'Nhà Xuất Bản Trẻ',
              categoryName: b.categories[0]?.category.name || 'Sách Hay',
              catSlug: b.categories[0]?.category.slug || 'van-hoc',
              description: b.description || '',
              isSuggestion: false,
            })),
          };
        }
      }

      if (cleanKeywords.length === 0) {
        cleanKeywords.push('sách');
      }

      // Kiểm tra tính hợp lệ của categorySlug trong DB
      let validCategorySlug: string | null = null;
      if (args.categorySlug) {
        const catExists = await prisma.category.findUnique({
          where: { slug: args.categorySlug.trim() },
          select: { slug: true },
        });
        if (catExists) {
          validCategorySlug = catExists.slug;
        }
      }

      const patterns = cleanKeywords.map((k) => `%${k}%`);
      const minPrice = typeof args.minPrice === 'number' && args.minPrice >= 0 ? args.minPrice : null;
      const maxPrice = typeof args.maxPrice === 'number' && args.maxPrice > 0 ? args.maxPrice : null;

      // Truy vấn PostgreSQL tham số hóa với unaccent() ILIKE ANY, tính điểm trọng số
      // title: 5đ, tác giả: 4đ, danh mục: 2đ, mô tả: 1đ
      const matchedBooksRaw: any[] = await prisma.$queryRaw`
        WITH book_matches AS (
          SELECT
            b.id,
            b.title,
            b.slug,
            b.price,
            b.original_price AS "originalPrice",
            b.stock_qty AS "stockQty",
            b.sold_count AS "soldCount",
            b.cover_url AS "coverUrl",
            b.publisher,
            b.description,
            COALESCE(
              (
                SELECT string_agg(a.name, ', ')
                FROM book_authors ba
                JOIN authors a ON ba.author_id = a.id
                WHERE ba.book_id = b.id
              ),
              'Tổ Sách Tuyển Chọn'
            ) AS "authorNames",
            COALESCE(
              (
                SELECT c.name
                FROM book_categories bc
                JOIN categories c ON bc.category_id = c.id
                WHERE bc.book_id = b.id
                LIMIT 1
              ),
              'Sách Hay'
            ) AS "categoryName",
            COALESCE(
              (
                SELECT c.slug
                FROM book_categories bc
                JOIN categories c ON bc.category_id = c.id
                WHERE bc.book_id = b.id
                LIMIT 1
              ),
              'van-hoc'
            ) AS "catSlug",
            (
              SELECT count(*)::int
              FROM unnest(${patterns}::text[]) pat
              WHERE
                unaccent(b.title) ILIKE unaccent(pat)
                OR unaccent(COALESCE(b.description, '')) ILIKE unaccent(pat)
                OR EXISTS (
                  SELECT 1 FROM book_authors ba
                  JOIN authors a ON ba.author_id = a.id
                  WHERE ba.book_id = b.id AND unaccent(a.name) ILIKE unaccent(pat)
                )
                OR EXISTS (
                  SELECT 1 FROM book_categories bc
                  JOIN categories c ON bc.category_id = c.id
                  WHERE bc.book_id = b.id AND unaccent(c.name) ILIKE unaccent(pat)
                )
            ) AS matched_count,
            (
              (
                SELECT count(*)::int
                FROM unnest(${patterns}::text[]) pat
                WHERE unaccent(b.title) ILIKE unaccent(pat)
              ) * 5
              +
              (
                SELECT count(*)::int
                FROM unnest(${patterns}::text[]) pat
                WHERE EXISTS (
                  SELECT 1 FROM book_authors ba
                  JOIN authors a ON ba.author_id = a.id
                  WHERE ba.book_id = b.id AND unaccent(a.name) ILIKE unaccent(pat)
                )
              ) * 4
              +
              (
                SELECT count(*)::int
                FROM unnest(${patterns}::text[]) pat
                WHERE EXISTS (
                  SELECT 1 FROM book_categories bc
                  JOIN categories c ON bc.category_id = c.id
                  WHERE bc.book_id = b.id AND unaccent(c.name) ILIKE unaccent(pat)
                )
              ) * 2
              +
              (
                SELECT count(*)::int
                FROM unnest(${patterns}::text[]) pat
                WHERE unaccent(COALESCE(b.description, '')) ILIKE unaccent(pat)
              ) * 1
            ) AS total_score
          FROM books b
          WHERE
            b.is_active = true
            AND (${minPrice}::int IS NULL OR b.price >= ${minPrice})
            AND (${maxPrice}::int IS NULL OR b.price <= ${maxPrice})
            AND (
              ${validCategorySlug}::text IS NULL
              OR EXISTS (
                SELECT 1 FROM book_categories bc
                JOIN categories c ON bc.category_id = c.id
                WHERE bc.book_id = b.id AND c.slug = ${validCategorySlug}
              )
            )
        )
        SELECT *
        FROM book_matches
        WHERE matched_count > 0
        ORDER BY ("stockQty" > 0) DESC, matched_count DESC, total_score DESC, "soldCount" DESC
        LIMIT 5;
      `;

      let books: any[] = [];
      let isSuggestion = false;

      if (matchedBooksRaw.length > 0) {
        books = matchedBooksRaw.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          price: Number(b.price),
          originalPrice: b.originalPrice ? Number(b.originalPrice) : Number(b.price),
          stockQty: Number(b.stockQty),
          inStock: Number(b.stockQty) > 0,
          coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
          authorName: b.authorNames,
          publisher: b.publisher || 'NXB Trẻ',
          categoryName: b.categoryName,
          categorySlug: b.catSlug,
          description: b.description ? b.description.slice(0, 180) + '...' : '',
          isSuggestion: false,
        }));
      } else {
        // KHI 0 KẾT QUẢ KHỚP TRỰC TIẾP:
        // Lấy sách bán chạy CÒN HÀNG của danh mục gần nhất hoặc toàn kho, tôn trọng khoảng giá khách yêu cầu
        isSuggestion = true;
        const fallbackBooks = await prisma.book.findMany({
          where: {
            isActive: true,
            stockQty: { gt: 0 },
            ...(minPrice !== null || maxPrice !== null
              ? {
                  price: {
                    ...(minPrice !== null ? { gte: minPrice } : {}),
                    ...(maxPrice !== null ? { lte: maxPrice } : {}),
                  },
                }
              : {}),
            ...(validCategorySlug
              ? { categories: { some: { category: { slug: validCategorySlug } } } }
              : {}),
          },
          take: 3,
          orderBy: [{ isBestseller: 'desc' }, { soldCount: 'desc' }],
          include: {
            authors: { include: { author: { select: { name: true } } } },
            categories: { include: { category: { select: { name: true, slug: true } } } },
          },
        });

        books = fallbackBooks.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          price: b.price,
          originalPrice: b.originalPrice || b.price,
          stockQty: b.stockQty,
          inStock: true,
          coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
          authorName: b.authors.map((a) => a.author.name).join(', ') || 'Tổ Sách Tuyển Chọn',
          publisher: b.publisher || 'NXB Trẻ',
          categoryName: b.categories[0]?.category?.name || 'Sách Hay',
          categorySlug: b.categories[0]?.category?.slug || 'van-hoc',
          description: b.description ? b.description.slice(0, 180) + '...' : '',
          isSuggestion: true,
        }));
      }

      return {
        success: true,
        totalFound: books.length,
        isSuggestion,
        books,
      };
    } catch (error: any) {
      console.error('Lỗi searchBooksTool:', error);
      return { success: false, error: 'DATABASE_ERROR', message: 'Lỗi tra cứu CSDL.', books: [] };
    }
  },
};

// =========================================================================
// 2. TOOL: recommend_best_voucher (Tính toán Voucher tốt nhất & Up-sell)
// =========================================================================
export const recommendBestVoucherTool: ToolDefinition = {
  declaration: {
    name: 'recommend_best_voucher',
    description:
      'Tự động tìm kiếm và tính toán mã voucher mang lại số tiền giảm cao nhất cho cuốn sách hoặc đơn hàng của khách. Đồng thời phát hiện cơ hội up-sell để khách mua thêm đạt mức freeship (đơn từ 150k) hoặc mã giảm sâu hơn.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderAmount: {
          type: 'NUMBER',
          description: 'Tổng giá trị đơn hàng hoặc giá cuốn sách khách đang muốn mua (VNĐ)',
        },
      },
      required: ['orderAmount'],
    },
  },
  execute: async (args: { orderAmount: number }, ctx: ToolContext) => {
    try {
      const amount = Math.max(0, Number(args.orderAmount) || 0);

      // Lấy toàn bộ voucher active trong DB
      const now = new Date();
      const allVouchers = await prisma.voucher.findMany({
        where: {
          isActive: true,
          usedCount: { lt: prisma.voucher.fields.usageLimit },
        },
        include: {
          event: {
            select: { isActive: true, startsAt: true, endsAt: true },
          },
        },
      });

      // Lấy danh sách số lần user hiện tại đã dùng từng voucher (nếu đã đăng nhập)
      const userUsageCounts = new Map<string, number>();
      if (ctx.userId) {
        const usages = await prisma.voucherUsage.groupBy({
          by: ['voucherId'],
          where: { userId: ctx.userId },
          _count: { id: true },
        });
        for (const u of usages) {
          userUsageCounts.set(u.voucherId, u._count.id);
        }
      }

      // Lọc các voucher còn hiệu lực thời gian và chưa vượt quá giới hạn dùng của người dùng
      const validDateVouchers = allVouchers.filter((v) => {
        if (v.event && !v.event.isActive) return false;
        const { effectiveStartsAt, effectiveEndsAt } = getEffectiveVoucherDates(v);
        if (effectiveStartsAt && now < effectiveStartsAt) return false;
        if (effectiveEndsAt && now > effectiveEndsAt) return false;

        // Chặn gợi ý nếu người dùng hiện tại đã dùng hết lượt mã này (N13)
        if (ctx.userId) {
          const usedByUser = userUsageCounts.get(v.id) || 0;
          if (usedByUser >= v.perUserLimit) return false;
        }

        return true;
      });

      let bestVoucher: any = null;
      let maxDiscount = 0;
      let closestUpsellVoucher: any = null;
      let minMissingAmount = Infinity;

      for (const v of validDateVouchers) {
        if (amount >= v.minOrderValue) {
          const discount = calculateVoucherDiscount(v, amount);
          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestVoucher = {
              code: v.code,
              name: v.name,
              discountAmount: discount,
              minOrderValue: v.minOrderValue,
              maxDiscount: v.maxDiscount,
              type: v.type,
              value: v.value,
              finalPrice: Math.max(0, amount - discount),
            };
          }
        } else {
          // Tính khoảng cách cần mua thêm để đạt voucher
          const missing = v.minOrderValue - amount;
          if (missing > 0 && missing < minMissingAmount && missing <= 120000) {
            minMissingAmount = missing;
            const potentialDiscount = calculateVoucherDiscount(v, v.minOrderValue);
            closestUpsellVoucher = {
              code: v.code,
              name: v.name,
              missingAmount: missing,
              targetMinOrder: v.minOrderValue,
              potentialDiscount,
            };
          }
        }
      }

      const freeshipThreshold = 150000;
      const isFreeship = amount >= freeshipThreshold;
      const freeshipMissing = isFreeship ? 0 : freeshipThreshold - amount;

      return {
        success: true,
        orderAmount: amount,
        bestVoucher,
        upsellVoucher: closestUpsellVoucher,
        shippingPolicy: {
          isFreeship,
          freeshipMissing,
          standardShippingFee: 25000,
        },
      };
    } catch (error: any) {
      console.error('Lỗi recommendBestVoucherTool:', error);
      return { success: false, error: 'VOUCHER_CALCULATION_ERROR' };
    }
  },
};

// =========================================================================
// 3. TOOL: apply_voucher (Áp dụng mã giảm giá vào session thanh toán)
// =========================================================================
export const applyVoucherTool: ToolDefinition = {
  declaration: {
    name: 'apply_voucher',
    description:
      'Kiểm tra tính hợp lệ và áp dụng trực tiếp một mã voucher khuyến mãi vào đơn hàng/thanh toán của khách.',
    parameters: {
      type: 'OBJECT',
      properties: {
        code: {
          type: 'STRING',
          description: 'Mã voucher (Ví dụ: "KHAITRUONG10", "GIAM25K", "TESTVOUCHER")',
        },
        orderAmount: {
          type: 'NUMBER',
          description: 'Tổng số tiền sách của khách (VNĐ)',
        },
      },
      required: ['code'],
    },
  },
  execute: async (args: { code: string; orderAmount?: number }, ctx: ToolContext) => {
    try {
      const cleanCode = (args.code || '').trim().toUpperCase();
      const amount = Math.max(0, Number(args.orderAmount) || 0);

      const validation = await validateVoucher(cleanCode, ctx.userId || undefined, amount);

      if (!validation.isValid || !validation.voucher) {
        return {
          success: false,
          error: 'INVALID_VOUCHER',
          message: validation.error || `Mã voucher "${cleanCode}" không hợp lệ hoặc đã hết hạn sử dụng.`,
        };
      }

      const discount = calculateVoucherDiscount(validation.voucher, amount);

      return {
        success: true,
        action: 'APPLY_VOUCHER',
        voucher: {
          code: validation.voucher.code,
          name: validation.voucher.name,
          discountAmount: discount,
          type: validation.voucher.type,
          value: validation.voucher.value,
          minOrderValue: validation.voucher.minOrderValue,
          maxDiscount: validation.voucher.maxDiscount,
        },
        message: `Đã áp dụng mã "${validation.voucher.code}" thành công! Bạn được giảm ${discount.toLocaleString('vi-VN')} đ.`,
      };
    } catch (error: any) {
      console.error('Lỗi applyVoucherTool:', error);
      return { success: false, error: 'EXECUTION_ERROR', message: 'Lỗi kiểm tra voucher.' };
    }
  },
};

// =========================================================================
// 4. TOOL: get_book (Xem thông tin chi tiết đầy đủ của một cuốn sách)
// =========================================================================
export const getBookTool: ToolDefinition = {
  declaration: {
    name: 'get_book',
    description:
      'Lấy thông tin chi tiết đầy đủ 100% của một cuốn sách theo slug hoặc ID để giải đáp kỹ lưỡng cho khách (tác giả, NXB, năm xuất bản, số trang, kích thước, trọng lượng, mô tả, đánh giá, tồn kho).',
    parameters: {
      type: 'OBJECT',
      properties: {
        slug: {
          type: 'STRING',
          description: 'Slug của cuốn sách (Ví dụ: "an-mang-muoi-mot-chu", "hoang-tu-be")',
        },
        bookId: {
          type: 'STRING',
          description: 'ID của cuốn sách trong CSDL',
        },
      },
    },
  },
  execute: async (args: { slug?: string; bookId?: string }) => {
    try {
      if (!args.slug && !args.bookId) {
        return { success: false, error: 'MISSING_PARAM', message: 'Cần truyền slug hoặc bookId.' };
      }

      const book = await prisma.book.findFirst({
        where: {
          OR: [
            ...(args.slug ? [{ slug: args.slug.trim() }] : []),
            ...(args.bookId ? [{ id: args.bookId.trim() }] : []),
          ],
          isActive: true,
        },
        include: {
          authors: { include: { author: true } },
          categories: { include: { category: true } },
        },
      });

      if (!book) {
        return { success: false, error: 'NOT_FOUND', message: 'Không tìm thấy cuốn sách này trong kho.' };
      }

      return {
        success: true,
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          isbn: book.isbn,
          price: book.price,
          originalPrice: book.originalPrice || book.price,
          stockQty: book.stockQty,
          inStock: book.stockQty > 0,
          authorName: book.authors.map((a) => a.author.name).join(', ') || 'Tác giả tuyển chọn',
          publisher: book.publisher || 'NXB Trẻ',
          publishYear: book.publishYear,
          pageCount: book.pageCount,
          weightG: book.weightG,
          sizeCm: book.sizeCm,
          format: book.format,
          translator: book.translator,
          avgRating: book.avgRating,
          ratingCount: book.ratingCount,
          coverUrl: book.coverUrl,
          categoryName: book.categories[0]?.category?.name || 'Văn học',
          description: book.description,
        },
      };
    } catch (error: any) {
      console.error('Lỗi getBookTool:', error);
      return { success: false, error: 'DATABASE_ERROR' };
    }
  },
};

// =========================================================================
// 5. TOOL: list_active_events (Danh sách sự kiện khuyến mãi đang chạy)
// =========================================================================
export const listActiveEventsTool: ToolDefinition = {
  declaration: {
    name: 'list_active_events',
    description: 'Lấy danh sách các sự kiện khuyến mãi, ngày hội đọc sách hoặc lễ hội ưu đãi đang diễn ra tại Tổ Sách.',
  },
  execute: async () => {
    try {
      const now = new Date();
      const events = await prisma.promotionEvent.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          bannerUrl: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: { startsAt: 'desc' },
      });

      return {
        success: true,
        events: events.map((e) => ({
          name: e.name,
          slug: e.slug,
          description: e.description,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
        })),
      };
    } catch (error: any) {
      console.error('Lỗi listActiveEventsTool:', error);
      return { success: false, error: 'DATABASE_ERROR' };
    }
  },
};

// =========================================================================
// REGISTRY TOÀN BỘ CÔNG CỤ DÀNH CHO GEMINI
// =========================================================================
export const AI_TOOLS_REGISTRY: Record<string, ToolDefinition> = {
  search_books: searchBooksTool,
  recommend_best_voucher: recommendBestVoucherTool,
  apply_voucher: applyVoucherTool,
  get_book: getBookTool,
  list_active_events: listActiveEventsTool,
};

// Chuẩn hóa function declarations cho Gemini API: Loại bỏ thuộc tính parameters rỗng nếu không có đối số
export const geminiToolDeclarations = Object.values(AI_TOOLS_REGISTRY).map((t) => {
  const decl: any = {
    name: t.declaration.name,
    description: t.declaration.description,
  };
  if (t.declaration.parameters && Object.keys(t.declaration.parameters.properties || {}).length > 0) {
    decl.parameters = t.declaration.parameters;
  }
  return decl;
});
