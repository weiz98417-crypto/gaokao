import type { IAuthRepository } from './interfaces';
import type { UserRecord, CreateUserParams, VerificationCodeRecord } from '../types';

/**
 * 内存认证数据仓库实现
 *
 * 使用 Map 存储所有数据，支持 USE_DATABASE=false 场景下的无数据库运行。
 * 进程重启后数据丢失——仅用于开发和测试。
 */

/** 简易 UUID 生成器（避免额外依赖） */
function generateId(): string {
  // crypto.randomUUID() 在 Node.js 19+ 中可用
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // fallback: 36 位随机 hex
  const chars = '0123456789abcdef';
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

export class InMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, UserRecord> = new Map();
  private verificationCodes: Map<string, VerificationCodeRecord> = new Map();
  /** email → userId 索引 */
  private emailIndex: Map<string, string> = new Map();

  async findByEmail(email: string): Promise<UserRecord | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async createUser(params: CreateUserParams): Promise<UserRecord> {
    const now = new Date();
    const user: UserRecord = {
      id: generateId(),
      email: params.email,
      passwordHash: params.passwordHash,
      nickname: params.nickname ?? null,
      isVerified: false,
      wechatOpenId: null,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async updateVerificationStatus(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.isVerified = true;
    user.updatedAt = new Date();
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.passwordHash = newHash;
    user.updatedAt = new Date();
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.failedAttempts += 1;
    user.updatedAt = new Date();
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date();
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.lockedUntil = until;
    user.updatedAt = new Date();
  }

  async createVerificationCode(params: {
    email: string;
    codeHash: string;
    type: string;
    expiresAt: Date;
    userId?: string;
  }): Promise<VerificationCodeRecord> {
    const now = new Date();
    const record: VerificationCodeRecord = {
      id: generateId(),
      email: params.email,
      codeHash: params.codeHash,
      type: params.type,
      expiresAt: params.expiresAt,
      used: false,
      createdAt: now,
      userId: params.userId ?? null,
    };
    this.verificationCodes.set(record.id, record);
    return record;
  }

  async findLatestCode(
    email: string,
    type: string
  ): Promise<VerificationCodeRecord | null> {
    let latest: VerificationCodeRecord | null = null;
    for (const record of this.verificationCodes.values()) {
      if (record.email === email && record.type === type) {
        if (!latest || record.createdAt > latest.createdAt) {
          latest = record;
        }
      }
    }
    return latest;
  }

  async markCodeUsed(id: string): Promise<void> {
    const record = this.verificationCodes.get(id);
    if (!record) return;
    record.used = true;
  }
}
