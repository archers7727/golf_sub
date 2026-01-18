/**
 * Prisma Client Singleton
 *
 * This ensures we don't create multiple Prisma Client instances
 * in development (hot reloading) or production.
 */

import { PrismaClient } from '@prisma/client'

// Append pgbouncer=true to DATABASE_URL if not already present
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || ''
  if (url && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}pgbouncer=true`
  }
  return url
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
