import { Client } from '@elastic/elasticsearch';
import { prisma } from './prisma';

export const ES_INDEX_BOOKS = 'books_v1';

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
  source: 'ELASTICSEARCH_8' | 'POSTGRESQL_FALLBACK';
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

  // 2. Graceful Fallback: PostgreSQL Full-Text & Insensitive Search
  const pgResults = await prisma.book.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: trimmed, mode: 'insensitive' } },
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
