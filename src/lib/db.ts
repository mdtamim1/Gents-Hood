import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure robust connection pooling when pgbouncer is enabled
function getDatasources() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes('pgbouncer=true') && !url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?';
    return {
      db: {
        url: `${url}${separator}connection_limit=10&pool_timeout=20`,
      },
    };
  }
  return undefined;
}

const datasources = getDatasources();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasources ? { datasources } : {}),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export default db;
