/**
 * Prisma Client Singleton
 * 
 * This ensures we don't create multiple Prisma Client instances
 * in development (hot reloading) or production.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * NOTE: If you encounter "prepared statement already exists" errors on Vercel:
 * 1. Ensure DATABASE_URL uses Supabase connection pooler (port 6543)
 * 2. Add ?pgbouncer=true to DATABASE_URL
 * 3. Example: postgresql://user:pass@host:6543/db?pgbouncer=true
 */
