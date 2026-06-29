import { prisma } from '../lib/prisma';
import type { IAuthRepository } from './interfaces';
import type { UserRecord, CreateUserParams, VerificationCodeRecord } from '../types';

/**
 * Prisma 认证数据仓库实现
 *
 * 基于 PostgreSQL + Prisma ORM，操作 app schema 下的 User / VerificationCode 表。
 */
export class PrismaAuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as UserRecord | null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as UserRecord | null;
  }

  async createUser(params: CreateUserParams): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        nickname: params.nickname ?? null,
      },
    });
    return user as UserRecord;
  }

  async updateVerificationStatus(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
    });
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: until },
    });
  }

  async createVerificationCode(params: {
    email: string;
    codeHash: string;
    type: string;
    expiresAt: Date;
    userId?: string;
  }): Promise<VerificationCodeRecord> {
    const record = await prisma.verificationCode.create({
      data: {
        email: params.email,
        codeHash: params.codeHash,
        type: params.type,
        expiresAt: params.expiresAt,
        userId: params.userId ?? null,
      },
    });
    return record as VerificationCodeRecord;
  }

  async findLatestCode(
    email: string,
    type: string
  ): Promise<VerificationCodeRecord | null> {
    const record = await prisma.verificationCode.findFirst({
      where: { email, type },
      orderBy: { createdAt: 'desc' },
    });
    return record as VerificationCodeRecord | null;
  }

  async markCodeUsed(id: string): Promise<void> {
    await prisma.verificationCode.update({
      where: { id },
      data: { used: true },
    });
  }
}
