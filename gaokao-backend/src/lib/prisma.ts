import { PrismaClient } from '@prisma/client';

/**
 * 全局 PrismaClient 单例
 *
 * 开发环境下挂接到 globalThis，避免热重载时创建多个连接池。
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from '@prisma/client';
