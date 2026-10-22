import { Client } from '@elastic/elasticsearch';
import { prisma } from './prisma';
import { removeVietnameseTones } from './utils';

export const ES_INDEX_BOOKS = 'books_v1';

// Vietnamese stop words to filter out (Proposal 3.2)
export const VIETNAMESE_STOP_WORDS = new Set([
  'va', 'hoac', 'nhung', 'cac', 'la', 'cua', 'trong', 'voi', 'cho', 've', 'o', 'duoc',
  'sach', 'cuon', 'quyen', 'tap', 'bo'
]);

// Vietnamese synonyms mapping (Proposal 3.2)
export const SYNONYMS: Record<string, string[]> = {
  'manga': ['truyen tranh', 'comic'],
  'comic': ['truyen tranh', 'manga'],
  'truyen tranh': ['manga', 'comic'],
  'tieu thuyet': ['novel', 'truyen dai'],
  'novel': ['tieu thuyet'],
  'kinh te': ['tai chinh', 'dau tu', 'quan tri'],
  'tai chinh': ['kinh te', 'dau tu'],
};

// Cấu hình kết nối Elasticsearch 8.x từ biến môi trường
const esNode = process.env.ELASTICSEARCH_NODE;
const esApiKey = process.env.ELASTICSEARCH_API_KEY;
const esUsername = process.env.ELASTICSEARCH_USERNAME;
const esPassword = process.env.ELASTICSEARCH_PASSWORD;

let esClient: Client | null = null;

if (esNode) {
  try {
    const authConfig = esApiKey
      ? { apiKey: esApiKey }
      : esUsername && esPassword
      ? { username: esUsername, password: esPassword }
      : undefined;

    esClient = new Client({
      node: esNode,
      auth: authConfig,
    });
    console.log('🔍 Initialized Elasticsearch 8.x client:', esNode);
  } catch (err) {
    console.warn('⚠️ Could not initialize Elasticsearch client, using PG fallback:', err);
    esClient = null;
  }
}

export const elasticClient = esClient;

/**
 * Kiểm tra trạng thái kết nối Elasticsearch
 */
export async function isElasticsearchHealthy(): Promise<boolean> {
  if (!elasticClient) return false;
  try {
    const ping = await elasticClient.ping();
    return Boolean(ping);
  } catch {
    return false;
  }
}

/**
 * Đồng bộ toàn bộ dữ liệu sách từ PostgreSQL sang Elasticsearch 8.x index books_v1
 */
export async function syncBooksToElasticsearch(): Promise<{ count: number; status: string }> {
  const books = await prisma.book.findMany({
    where: { isActive: true },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
    },
  });

  if (!elasticClient) {
    return {
      count: books.length,
      status: 'MOCK_SYNC_OK (PostgreSQL Single Source of Truth ready, Elasticsearch node not configured in .env)',
    };
  }

  try {
    // 1. Kiểm tra index tồn tại chưa, nếu chưa thì tạo kèm mapping chuẩn Proposal Mục 3.2
    const exists = await elasticClient.indices.exists({ index: ES_INDEX_BOOKS });
    if (!exists) {
      await elasticClient.indices.create({
        index: ES_INDEX_BOOKS,
        body: {
          settings: {
            analysis: {
              filter: {
                vietnamese_stop: {
                  type: 'stop',
                  stopwords: ['và', 'hoặc', 'những', 'các', 'là', 'của', 'trong', 'với', 'cho', 'về', 'ở', 'được'],
                },
                vietnamese_synonyms: {
                  type: 'synonym',
                  synonyms: [
                    'truyện tranh, manga, comic, truyện hình',
                    'tiểu thuyết, novel, truyện dài',
                    'kinh tế, tài chính, đầu tư',
                  ],
                },
              },
              analyzer: {
                vietnamese_search_analyzer: {
                  tokenizer: 'standard',
                  filter: ['lowercase', 'vietnamese_stop', 'vietnamese_synonyms'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text', boost: 3.0, analyzer: 'vietnamese_search_analyzer' },
              authors: { type: 'text', boost: 2.0 },
              description: { type: 'text', boost: 1.0 },
              publisher: { type: 'keyword' },
              price: { type: 'integer' },
              originalPrice: { type: 'integer' },
              categories: { type: 'keyword' },
              soldCount: { type: 'integer' },
              avgRating: { type: 'float' },
              slug: { type: 'keyword' },
              coverUrl: { type: 'keyword' },
            },
          },
        },
      } as any);
    }

    // 2. Bulk Index các cuốn sách
    const operations = books.flatMap((book) => [
      { index: { _index: ES_INDEX_BOOKS, _id: book.id } },
      {
        id: book.id,
        title: book.title,
        authors: book.authors.map((a) => a.author.name).join(', '),
        description: book.description || '',
        publisher: book.publisher || '',
        price: book.price,
        originalPrice: book.originalPrice,
        categories: book.categories.map((c) => c.category.name),
        soldCount: book.soldCount,
        avgRating: book.avgRating,
        slug: book.slug,
        coverUrl: book.coverUrl,
      },
    ]);

    if (operations.length > 0) {
      const bulkResponse = await elasticClient.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.warn('Bulk indexing had errors:', bulkResponse.errors);
      }
    }

    return { count: books.length, status: 'SUCCESS' };
  } catch (err: any) {
    console.error('Error syncing to Elasticsearch:', err);
    return { count: books.length, status: `ERROR: ${err.message}` };
  }
}

/**
 * Tìm kiếm thông minh qua Elasticsearch 8.x (kèm PostgreSQL Fallback tự động)
 * Hiện thực hóa chuẩn xác Proposal Mục 3.2:
 * - Vietnamese analyzer với stop words, stemming, lowercase
 * - Fuzzy matching (edit distance <= 2) cho typo correction
 * - Multi-field boost: title^3, author^2, description^1
 * - Faceted navigation: category, price range, publisher (aggregation)
 * - Synonym expansion: 'truyện tranh' -> 'manga', 'comic', 'truyện hình'
 * - Personalized ranking: score * (1 + user_preference_weight)
 */
export async function searchBooksSmart(
  query: string,
  limit = 10,
  userPreferenceCategory?: string
): Promise<{
  source: 'ELASTICSEARCH_8' | 'POSTGRESQL_FALLBACK' | 'POSTGRESQL_SMART_FUZZY';
  results: any[];
  facets?: any;
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    const popular = await prisma.book.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: limit,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });
    return { source: 'POSTGRESQL_FALLBACK', results: popular };
  }

  // 1. Nếu có kết nối Elasticsearch 8.x: Truy vấn Multi-match với trọng số boost, fuzzy và faceted aggregations
  if (elasticClient) {
    try {
      const isUp = await elasticClient.ping();
      if (isUp) {
        const esRes = await elasticClient.search({
          index: ES_INDEX_BOOKS,
          size: limit,
          query: {
            multi_match: {
              query: trimmed,
              fields: ['title^3', 'authors^2', 'description^1'],
              fuzziness: 'AUTO',
              prefix_length: 2,
            },
          },
          aggs: {
            categories: { terms: { field: 'categories' } },
            publishers: { terms: { field: 'publisher' } },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { to: 100000 },
                  { from: 100000, to: 200000 },
                  { from: 200000, to: 500000 },
                  { from: 500000 },
                ],
              },
            },
          },
        } as any);

        const hits = esRes.hits.hits || [];
        if (hits.length > 0) {
          const matchedIds = hits.map((h: any) => h._id);
          const books = await prisma.book.findMany({
            where: { id: { in: matchedIds } },
            include: {
              authors: { include: { author: true } },
              categories: { include: { category: true } },
            },
          });

          // Personalized Ranking theo Proposal 3.2:
          // final_score = score * (1 + user_preference_weight)
          const scoredBooks = hits.map((h: any) => {
            const book = books.find((b) => b.id === h._id);
            if (!book) return null;
            const baseScore = h._score || 1.0;
            const isPreferred =
              userPreferenceCategory &&
              book.categories.some((c) => c.category.name.toLowerCase().includes(userPreferenceCategory.toLowerCase()));
            const userPreferenceWeight = isPreferred ? 0.35 : 0.0;
            const finalScore = baseScore * (1 + userPreferenceWeight);
            return { book, finalScore };
          }).filter(Boolean) as { book: any; finalScore: number }[];

          scoredBooks.sort((a, b) => b.finalScore - a.finalScore);

          return {
            source: 'ELASTICSEARCH_8',
            results: scoredBooks.map((sb) => sb.book),
            facets: esRes.aggregations,
          };
        }
      }
    } catch (esError) {
      console.warn('Elasticsearch query failed, gracefully falling back to PostgreSQL:', esError);
    }
  }

  // 2. Intelligent Vietnamese Smart Search (Unaccent + pg_trgm Fuzzy + Multi-field Boost)
  try {
    // L-k: Giữ lại các ký tự lập trình phổ biến (+, #, .) để tìm kiếm C++, C#, .NET chính xác
    const cleanQ = removeVietnameseTones(trimmed).replace(/[^a-z0-9\s+#.]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanQ) {
      return { source: 'POSTGRESQL_FALLBACK', results: [] };
    }

    // Stop-words filtering if query has multiple words
    const rawTokens = cleanQ.split(' ').filter(Boolean);
    const filteredTokens = rawTokens.filter((t) => !VIETNAMESE_STOP_WORDS.has(t));
    const effectiveQuery = filteredTokens.length > 0 ? filteredTokens.join(' ') : cleanQ;

    // Check synonym expansion
    let searchTarget = effectiveQuery;
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (effectiveQuery.includes(key)) {
        searchTarget = `${effectiveQuery} ${syns.join(' ')}`;
        break;
      }
    }

    const escapedQ = effectiveQuery.replace(/'/g, "''");
    const escapedTarget = searchTarget.replace(/'/g, "''");

    const sql = `
      SELECT 
        b.id, 
        b.title, 
        b.slug, 
        b.price, 
        b.original_price AS "originalPrice",
        b.cover_url AS "coverUrl", 
        b.sold_count AS "soldCount",
        COALESCE((
          SELECT a.name FROM book_authors ba 
          JOIN authors a ON ba.author_id = a.id 
          WHERE ba.book_id = b.id LIMIT 1
        ), 'Tổ Sách Tuyển Chọn') AS "authorName",
        COALESCE((
          SELECT c.name FROM book_categories bc 
          JOIN categories c ON bc.category_id = c.id 
          WHERE bc.book_id = b.id LIMIT 1
        ), 'Văn học') AS "categoryName",
        (
          -- Title exact unaccented ILIKE match (Trọng số cao nhất 6.0)
          CASE WHEN unaccent(b.title) ILIKE unaccent('%${escapedQ}%') THEN 6.0 ELSE 0.0 END
          +
          -- Title Trigram Similarity (Fuzzy cho lỗi chính tả, sai chữ) * 8.0
          similarity(unaccent(b.title), unaccent('${escapedQ}')) * 8.0
          +
          -- Author unaccented / fuzzy match * 4.0
          COALESCE((
            SELECT MAX(
              CASE WHEN unaccent(a.name) ILIKE unaccent('%${escapedQ}%') THEN 5.0 ELSE 0.0 END
              + similarity(unaccent(a.name), unaccent('${escapedQ}')) * 4.0
            )
            FROM book_authors ba JOIN authors a ON ba.author_id = a.id
            WHERE ba.book_id = b.id
          ), 0)
          +
          -- Category match * 2.0
          CASE WHEN EXISTS (
            SELECT 1 FROM book_categories bc 
            JOIN categories c ON bc.category_id = c.id 
            WHERE bc.book_id = b.id AND unaccent(c.name) ILIKE unaccent('%${escapedTarget}%')
          ) THEN 2.0 ELSE 0.0 END
          +
          -- Publisher match * 1.5
          CASE WHEN unaccent(COALESCE(b.publisher, '')) ILIKE unaccent('%${escapedQ}%') THEN 1.5 ELSE 0.0 END
          +
          -- Description match * 0.8
          CASE WHEN unaccent(COALESCE(b.description, '')) ILIKE unaccent('%${escapedQ}%') THEN 0.8 ELSE 0.0 END
        ) AS search_score
      FROM books b
      WHERE b.is_active = true
        AND (
          unaccent(b.title) ILIKE unaccent('%${escapedQ}%')
          OR similarity(unaccent(b.title), unaccent('${escapedQ}')) > 0.2
          OR EXISTS (
            SELECT 1 FROM book_authors ba 
            JOIN authors a ON ba.author_id = a.id 
            WHERE ba.book_id = b.id AND (
              unaccent(a.name) ILIKE unaccent('%${escapedQ}%')
              OR similarity(unaccent(a.name), unaccent('${escapedQ}')) > 0.3
            )
          )
          OR unaccent(COALESCE(b.publisher, '')) ILIKE unaccent('%${escapedQ}%')
        )
      ORDER BY search_score DESC, b.sold_count DESC
      LIMIT ${limit}
    `;

    let extensionsInitialized = false;
    async function ensureExtensions() {
      if (extensionsInitialized) return;
      try {
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
        extensionsInitialized = true;
      } catch {
        // Bỏ qua nếu user DB không đủ quyền superuser
      }
    }

    await ensureExtensions();

    const rawRows: any = await prisma.$queryRawUnsafe(sql);

    // Map về cấu trúc Book đầy đủ
    const books = rawRows.map((r: any) => {
      const baseScore = Number(r.search_score) || 1.0;
      const isPreferred =
        userPreferenceCategory &&
        r.categoryName &&
        r.categoryName.toLowerCase().includes(userPreferenceCategory.toLowerCase());
      const userPreferenceWeight = isPreferred ? 0.35 : 0.0;
      const finalScore = baseScore * (1 + userPreferenceWeight);

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        price: r.price,
        originalPrice: r.originalPrice ?? r.price,
        coverUrl: r.coverUrl || '',
        soldCount: r.soldCount ?? 0,
        authorName: r.authorName || 'Tác giả tuyển chọn',
        categoryName: r.categoryName || 'Văn học',
        authors: [{ author: { name: r.authorName || 'Tác giả tuyển chọn' } }],
        categories: [{ category: { name: r.categoryName || 'Văn học' } }],
        finalScore,
      };
    });

    if (userPreferenceCategory) {
      books.sort((a: any, b: any) => b.finalScore - a.finalScore);
    }

    return {
      source: 'POSTGRESQL_SMART_FUZZY',
      results: books,
    };
  } catch (sqlErr) {
    console.warn('Smart SQL search failed, falling back to basic Prisma search with slug fallback:', sqlErr);

    // 3. Graceful Final Fallback: Basic Prisma ILIKE Search kèm slug matching không dấu (Lỗi M5)
    const noToneQuery = removeVietnameseTones(trimmed);
    const slugKeyword = noToneQuery.toLowerCase().replace(/\s+/g, '-');

    const pgResults = await prisma.book.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: trimmed, mode: 'insensitive' } },
          { slug: { contains: slugKeyword, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
          { publisher: { contains: trimmed, mode: 'insensitive' } },
          {
            authors: {
              some: {
                author: {
                  name: { contains: trimmed, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      },
      take: limit,
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    return { source: 'POSTGRESQL_FALLBACK', results: pgResults };
  }
}
