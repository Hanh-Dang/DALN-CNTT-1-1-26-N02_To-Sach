import { PrismaClient, UserRole, UserStatus, OrderStatus, PaymentMethod, PaymentStatus, ReviewStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Simple CSV parser supporting quoted strings
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  };

  const headers = parseLine(lines[0]);
  const records: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length === headers.length) {
      const rec: any = {};
      for (let j = 0; j < headers.length; j++) {
        rec[headers[j]] = cols[j];
      }
      records.push(rec);
    }
  }
  return records;
}

function parseAuthorNames(raw: string): string[] {
  const s = (raw || '').trim();
  if (!s) return [];
  let names: string[] = [s];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) names = arr.map((n) => String(n));
    } catch {
      // Không phải JSON hợp lệ thì giữ nguyên chuỗi
    }
  } else {
    names = s.split(/\s*[,;]\s*/);
  }
  // normalize NFC để "Brontë" viết kiểu tổ hợp vẫn khớp; Set để bỏ tên lặp
  return Array.from(new Set(names.map((n) => n.normalize('NFC').trim()).filter(Boolean)));
}

function toAuthorSlug(name: string): string {
  const base = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return `${base || 'tac-gia'}-${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  console.log('🚀 Starting Large Dataset Seed (Proposal Compliant: 5000+ Books, 2000+ Authors)...');

  const booksFile = path.join(process.cwd(), 'data', 'books_5000.csv');
  const authorsFile = path.join(process.cwd(), 'data', 'authors_2000.csv');
  const reviewsFile = path.join(process.cwd(), 'data', 'reviews_50k.csv');
  const ordersFile = path.join(process.cwd(), 'data', 'orders_10k.csv');
  const orderItemsFile = path.join(process.cwd(), 'data', 'order_items.csv');
  const eventsFile = path.join(process.cwd(), 'data', 'behavior_events_200k.csv');

  if (!fs.existsSync(booksFile) || !fs.existsSync(authorsFile)) {
    console.error('❌ Data files not found. Please wait for crawler to complete.');
    return;
  }

  // 1. Load data from CSV
  console.log('📂 Parsing CSV files...');
  const booksData = parseCSV(booksFile);
  const authorsData = parseCSV(authorsFile);
  console.log(`✅ Loaded ${booksData.length} books and ${authorsData.length} authors from CSV.`);

  // 2. Fetch existing categories mapping
  const existingCategories = await prisma.category.findMany();
  const catMap = new Map<string, string>();
  for (const cat of existingCategories) {
    catMap.set(cat.slug, cat.id);
  }

  // If root categories don't exist, use default fallback
  const defaultCatId = existingCategories[0]?.id || (await prisma.category.create({
    data: { name: 'Văn Học Tuyển Chọn', slug: 'van-hoc-tuyen-chon', level: 1 }
  })).id;

  // 3. Batch insert Authors in chunks of 500
  console.log('👥 Inserting authors in chunks...');
  const authorMap = new Map<string, string>();
  const CHUNK_SIZE = 500;

  for (let i = 0; i < authorsData.length; i += CHUNK_SIZE) {
    const chunk = authorsData.slice(i, i + CHUNK_SIZE);
    const authorCreateData = chunk.map(a => ({
      name: a.name.trim(),
      slug: (a.slug || a.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100) + `-${Math.random().toString(36).substring(2, 6)}`,
      bio: a.bio || null,
      avatarUrl: a.photoUrl || null
    }));

    await prisma.author.createMany({
      data: authorCreateData,
      skipDuplicates: true
    });
  }

  const allAuthors = await prisma.author.findMany({ select: { id: true, name: true } });
  for (const a of allAuthors) {
    authorMap.set(a.name.toLowerCase(), a.id);
  }
  console.log(`✅ Database now has ${allAuthors.length} authors.`);

  // 4. Batch insert Books in chunks of 500
  console.log('📚 Inserting books in chunks...');
  for (let i = 0; i < booksData.length; i += CHUNK_SIZE) {
    const chunk = booksData.slice(i, i + CHUNK_SIZE);
    const booksCreateData = chunk.map(b => {
      const price = parseInt(b.price) || 85000;
      const originalPrice = parseInt(b.originalPrice) || Math.round(price * 1.2);
      const stockQty = parseInt(b.stockQty) || 50;
      const soldCount = parseInt(b.soldCount) || Math.floor(Math.random() * 2000);
      const pageCount = parseInt(b.pageCount) || 280;
      const publishYear = parseInt(b.publishYear) || 2023;

      return {
        isbn: b.isbn || null,
        title: b.title.trim(),
        slug: (b.slug || b.title.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 120),
        description: b.description || 'Tác phẩm đặc sắc thuộc kho sách Tổ Sách.',
        price,
        originalPrice,
        stockQty,
        soldCount,
        pageCount,
        language: b.language || 'Tiếng Việt',
        publishYear,
        publisher: b.publisher || 'NXB Văn Học',
        coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        extraImages: [],
        avgRating: 4.8,
        ratingCount: Math.floor(Math.random() * 20) + 1,
        weightG: parseInt(b.weightG) || 350,
        sizeCm: b.sizeCm || '13 x 20.5 cm',
        format: b.format || 'Bìa mềm',
        translator: b.translator || null,
        tags: (b.tags || 'sach-hay,bestseller').split(',').map((t: string) => t.trim()),
        isActive: true,
        isBestseller: b.isBestseller === 'true',
        isNew: b.isNew === 'true',
        isFeatured: b.isFeatured === 'true'
      };
    });

    await prisma.book.createMany({
      data: booksCreateData,
      skipDuplicates: true
    });
    console.log(`  • Inserted books ${i + 1} to ${Math.min(i + CHUNK_SIZE, booksData.length)}...`);
  }

  const allBooksCount = await prisma.book.count();
  console.log(`✅ Database now has ${allBooksCount} books.`);

  // 5. Connect BookAuthors and BookCategories
  console.log('🔗 Connecting books with authors and categories...');
  const allDbBooks = await prisma.book.findMany({ select: { id: true, title: true, isbn: true } });
  const bookByTitle = new Map<string, string>();
  for (const b of allDbBooks) {
    bookByTitle.set(b.title.toLowerCase(), b.id);
  }

  const bookAuthorsToCreate: { bookId: string; authorId: string }[] = [];
  const bookCategoriesToCreate: { bookId: string; categoryId: string }[] = [];

  for (const b of booksData) {
    const bookId = bookByTitle.get(b.title.trim().toLowerCase());
    if (!bookId) continue;

    const parsedAuthors = parseAuthorNames(b.authors);
    for (const name of parsedAuthors) {
      let authorId = authorMap.get(name.toLowerCase());
      if (!authorId) {
        const created = await prisma.author.create({
          data: { name, slug: toAuthorSlug(name) },
        });
        authorId = created.id;
        authorMap.set(name.toLowerCase(), authorId);
      }
      bookAuthorsToCreate.push({ bookId, authorId });
    }

    const catSlug = b.categorySlug || 'van-hoc';
    const categoryId = catMap.get(catSlug) || defaultCatId;
    bookCategoriesToCreate.push({ bookId, categoryId });
  }

  // Deduplicate pairs
  const uniqueBookAuthors = Array.from(new Set(bookAuthorsToCreate.map(ba => `${ba.bookId}:::${ba.authorId}`)))
    .map(key => {
      const [bookId, authorId] = key.split(':::');
      return { bookId, authorId };
    });

  const uniqueBookCategories = Array.from(new Set(bookCategoriesToCreate.map(bc => `${bc.bookId}:::${bc.categoryId}`)))
    .map(key => {
      const [bookId, categoryId] = key.split(':::');
      return { bookId, categoryId };
    });

  for (let i = 0; i < uniqueBookAuthors.length; i += CHUNK_SIZE) {
    await prisma.bookAuthor.createMany({
      data: uniqueBookAuthors.slice(i, i + CHUNK_SIZE),
      skipDuplicates: true
    });
  }

  for (let i = 0; i < uniqueBookCategories.length; i += CHUNK_SIZE) {
    await prisma.bookCategory.createMany({
      data: uniqueBookCategories.slice(i, i + CHUNK_SIZE),
      skipDuplicates: true
    });
  }
  console.log(`✅ Connected ${uniqueBookAuthors.length} book-author links and ${uniqueBookCategories.length} category links.`);

  console.log('🎉 SEED LARGE DATASET HOÀN TẤT THÀNH CÔNG 100%!');
}

main()
  .catch(e => {
    console.error('Lỗi khi seed dataset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
