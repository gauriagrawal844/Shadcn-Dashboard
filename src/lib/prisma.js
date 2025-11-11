import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from '@next/env';

// Load environment variables
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;