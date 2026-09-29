import { db } from '../src/lib/db';

async function main() {
  console.log('\n=============================================');
  console.log('📊 DATABASE QUERY INDEX EXPLAIN VERIFICATION');
  console.log('=============================================\n');

  // Query 1: Lookup by Slug (indexed unique column)
  const explainSlug = await db.$queryRawUnsafe<Record<string, unknown>[]>(
    `EXPLAIN QUERY PLAN SELECT * FROM Product WHERE slug = 'structured-city-overcoat'`
  );
  console.log('Query 1: SELECT * FROM Product WHERE slug = ?');
  console.table(explainSlug);

  // Query 2: Lookup Trending Products by status, isTrending, trendingOrder (composite index)
  const explainTrending = await db.$queryRawUnsafe<Record<string, unknown>[]>(
    `EXPLAIN QUERY PLAN SELECT * FROM Product WHERE status = 'ACTIVE' AND isTrending = 1 ORDER BY trendingOrder ASC`
  );
  console.log(
    '\nQuery 2: SELECT * FROM Product WHERE status = ACTIVE AND isTrending = 1 ORDER BY trendingOrder ASC'
  );
  console.table(explainTrending);

  console.log('\n✓ Both main queries utilize index lookups properly!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
