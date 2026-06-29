/**
 * 认证系统综合测试
 *
 * 测试策略：
 * - 使用 InMemoryAuthRepository + MockEmailService 进行纯单元测试
 * - bcrypt 使用纯 JS mock（无原生依赖）
 * - 不依赖 PostgreSQL / SMTP 等外部服务
 * - 覆盖注册、登录、邮箱验证、Token 验证、认证中间件所有关键路径
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import type { IEmailService } from '../services/emailService';
import type { AuthConfig, VerificationCodeRecord } from '../types';

// ==========================================
// Mock bcrypt（纯 JS 实现，避免原生编译）
// 格式: $mock$<salt>$<plaintext>
// ==========================================
vi.mock('bcrypt', () => {
  return {
    default: {
      hash: async (data: string, _rounds: number): Promise<string> => {
        const salt = crypto.randomBytes(8).toString('hex');
        return `$mock$${salt}$${data}`;
      },
      compare: async (data: string, encrypted: string): Promise<boolean> => {
        if (!encrypted || !encrypted.startsWith('$mock$')) {
          return false;
        }
        const parts = encrypted.split('$');
        // parts: ['', 'mock', '<salt>', '<data>']
        return parts.length >= 4 && parts[3] === data;
      },
    },
  };
});

// 延迟导入依赖 bcrypt 的模块（必须在 vi.mock 之后）
import { AuthService } from '../services/authService';
import { InMemoryAuthRepository } from '../repositories/authRepository.inMemory';
import { createAuthRoutes } from '../routes/authRoutes';

// ==========================================
// Mock 邮件服务：捕获验证码明文
// ==========================================
class MockEmailService implements IEmailService {
  codes: Map<string, string[]> = new Map();

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (!this.codes.has(email)) {
      this.codes.set(email, []);
    }
    this.codes.get(email)!.push(code);
  }

  getLatestCode(email: string): string | undefined {
    const codes = this.codes.get(email);
    return codes?.[codes.length - 1];
  }

  clear(): void {
    this.codes.clear();
  }
}

// ==========================================
// 默认认证配置
// ==========================================
const defaultConfig: AuthConfig = {
  jwtSecret: 'test-secret-key-2024',
  jwtExpiresIn: '15m',
  loginMaxAttempts: 5,
  loginLockMinutes: 15,
  codeTTLMinutes: 5,
  codeCooldownSeconds: 60,
};

// ==========================================
// 测试辅助函数
// ==========================================
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_NICKNAME = '测试用户';

function createAuthService(
  config: Partial<AuthConfig> = {}
): {
  authService: AuthService;
  repo: InMemoryAuthRepository;
  emailService: MockEmailService;
} {
  const repo = new InMemoryAuthRepository();
  const emailService = new MockEmailService();
  const authService = new AuthService(repo, emailService, {
    ...defaultConfig,
    ...config,
  });
  return { authService, repo, emailService };
}

function createApp(authService: AuthService): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRoutes(authService));
  return app;
}

/** 注册一个用户并返回 authService 三元组 + 验证码 */
async function registerTestUser(config: Partial<AuthConfig> = {}) {
  const { authService, repo, emailService } = createAuthService(config);
  const result = await authService.register({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    nickname: TEST_NICKNAME,
  });
  const code = emailService.getLatestCode(TEST_EMAIL);
  return { authService, repo, emailService, result, code };
}

// ==========================================
// 测试套件
// ==========================================

// ---------- 环境初始化 ----------
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-2024';
  process.env.JWT_EXPIRES_IN = '15m';
});

// ==========================================
// 第一部分：AuthService 单元测试
// ==========================================

describe('AuthService — 注册', () => {
  let authService: AuthService;
  let repo: InMemoryAuthRepository;
  let emailService: MockEmailService;

  beforeEach(() => {
    const created = createAuthService();
    authService = created.authService;
    repo = created.repo;
    emailService = created.emailService;
  });

  it('1. 正常注册：返回 token + user 对象，isVerified=false', async () => {
    const result = await authService.register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      nickname: TEST_NICKNAME,
    });

    expect(result).toBeDefined();
    expect(result.token).toBeTruthy();
    expect(typeof result.token).toBe('string');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(TEST_EMAIL);
    expect(result.user.nickname).toBe(TEST_NICKNAME);
    expect(result.user.isVerified).toBe(false);
    expect(result.user.id).toBeTruthy();
    expect(result.user.createdAt).toBeTruthy();

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user).not.toBeNull();
    expect(user!.isVerified).toBe(false);
  });

  it('2. 重复邮箱注册：返回 AUTH_EMAIL_EXISTS (409)', async () => {
    await authService.register({ email: TEST_EMAIL, password: TEST_PASSWORD });

    try {
      await authService.register({ email: TEST_EMAIL, password: 'another123' });
      expect.unreachable('应该抛出 AuthError');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_EMAIL_EXISTS');
      expect(err.statusCode).toBe(409);
      expect(err.message).toContain('已注册');
    }
  });

  it('3. 无效邮箱格式：返回 AUTH_VALIDATION_ERROR (422)', async () => {
    const invalidEmails = ['notanemail', 'missing@', '@missing.com', 'spaces in@email.com', ''];

    for (const email of invalidEmails) {
      try {
        await authService.register({ email, password: TEST_PASSWORD });
        expect.unreachable(`邮箱 "${email}" 应该被拒绝`);
      } catch (err: any) {
        expect(err.code).toBe('AUTH_VALIDATION_ERROR');
        expect(err.statusCode).toBe(422);
      }
    }
  });

  it('4. 密码过短（<8位）：返回 AUTH_VALIDATION_ERROR (422)', async () => {
    const shortPasswords = ['1234567', 'abc', '1234', ''];

    for (const pw of shortPasswords) {
      try {
        await authService.register({ email: TEST_EMAIL, password: pw });
        expect.unreachable(`密码 "${pw}" 应该被拒绝`);
      } catch (err: any) {
        expect(err.code).toBe('AUTH_VALIDATION_ERROR');
        expect(err.statusCode).toBe(422);
      }
    }
  });

  it('5. 注册后验证码被创建（通过 findLatestCode 验证）', async () => {
    await authService.register({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const codeRecord = await repo.findLatestCode(TEST_EMAIL, 'register');
    expect(codeRecord).not.toBeNull();
    expect(codeRecord!.email).toBe(TEST_EMAIL);
    expect(codeRecord!.type).toBe('register');
    expect(codeRecord!.used).toBe(false);
    expect(codeRecord!.expiresAt).toBeInstanceOf(Date);
    expect(codeRecord!.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const capturedCode = emailService.getLatestCode(TEST_EMAIL);
    expect(capturedCode).toBeTruthy();
    expect(capturedCode!.length).toBe(6);
    expect(/^\d{6}$/.test(capturedCode!)).toBe(true);
  });
});

// ==========================================
describe('AuthService — 登录', () => {
  let authService: AuthService;
  let repo: InMemoryAuthRepository;

  beforeEach(async () => {
    const created = createAuthService();
    authService = created.authService;
    repo = created.repo;

    await authService.register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
  });

  it('6. 正常登录：返回 token + user 对象', async () => {
    const result = await authService.login({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(result.token).toBeTruthy();
    expect(typeof result.token).toBe('string');
    expect(result.user.email).toBe(TEST_EMAIL);
    expect(result.user.id).toBeTruthy();

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user!.failedAttempts).toBe(0);
    expect(user!.lockedUntil).toBeNull();
  });

  it('7. 邮箱不存在：返回 AUTH_USER_NOT_FOUND (401)', async () => {
    try {
      await authService.login({
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD,
      });
      expect.unreachable('应该抛出 AuthError');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_USER_NOT_FOUND');
      expect(err.statusCode).toBe(401);
    }
  });

  it('8. 密码错误：返回 AUTH_INVALID_CREDENTIALS (401)', async () => {
    try {
      await authService.login({ email: TEST_EMAIL, password: 'WrongPass123' });
      expect.unreachable('应该抛出 AuthError');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(err.statusCode).toBe(401);
    }

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user!.failedAttempts).toBe(1);
  });

  it('9. 连续5次密码错误后账户锁定', async () => {
    const wrongPassword = 'WrongPassword123';

    // 前 4 次错误密码 → AUTH_INVALID_CREDENTIALS（未锁定）
    for (let i = 0; i < 4; i++) {
      try {
        await authService.login({ email: TEST_EMAIL, password: wrongPassword });
        expect.unreachable(`第 ${i + 1} 次应抛出异常`);
      } catch (err: any) {
        expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
        expect(err.statusCode).toBe(401);
      }
    }

    // 第 5 次错误密码 → 触发锁定
    try {
      await authService.login({ email: TEST_EMAIL, password: wrongPassword });
      expect.unreachable('第 5 次应触发锁定');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_ACCOUNT_LOCKED');
      expect(err.statusCode).toBe(423);
    }

    // 第 6 次 → 仍被锁定（验证锁定持久化）
    try {
      await authService.login({ email: TEST_EMAIL, password: wrongPassword });
      expect.unreachable('已锁定账户应拒绝');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_ACCOUNT_LOCKED');
      expect(err.statusCode).toBe(423);
    }

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user!.lockedUntil).not.toBeNull();
    expect(user!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('10. 锁定过期后可正常登录', async () => {
    const user = await repo.findByEmail(TEST_EMAIL);
    // 设置已过期的锁定时间
    await repo.lockUntil(user!.id, new Date(Date.now() - 60000));

    const result = await authService.login({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(TEST_EMAIL);

    const updatedUser = await repo.findByEmail(TEST_EMAIL);
    expect(updatedUser!.lockedUntil).toBeNull();
    expect(updatedUser!.failedAttempts).toBe(0);
  });
});

// ==========================================
describe('AuthService — 邮箱验证', () => {
  let authService: AuthService;
  let repo: InMemoryAuthRepository;
  let emailService: MockEmailService;

  beforeEach(async () => {
    const created = createAuthService();
    authService = created.authService;
    repo = created.repo;
    emailService = created.emailService;

    await authService.register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
  });

  it('11. 正确验证码：返回成功，用户 isVerified 变为 true', async () => {
    const code = emailService.getLatestCode(TEST_EMAIL);
    expect(code).toBeTruthy();

    await authService.verifyEmail({ email: TEST_EMAIL, code: code! });

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user!.isVerified).toBe(true);

    const codeRecord = await repo.findLatestCode(TEST_EMAIL, 'register');
    expect(codeRecord!.used).toBe(true);
  });

  it('12. 错误验证码：返回 AUTH_INVALID_CODE (400)', async () => {
    try {
      await authService.verifyEmail({ email: TEST_EMAIL, code: '000000' });
      expect.unreachable('错误验证码应抛出异常');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_INVALID_CODE');
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('错误');
    }

    const user = await repo.findByEmail(TEST_EMAIL);
    expect(user!.isVerified).toBe(false);
  });

  it('13. 过期验证码：返回 AUTH_INVALID_CODE (400)', async () => {
    // 注入一条已过期但 createdAt 更新（确保 findLatestCode 找到它）
    const expiredRecord: VerificationCodeRecord = {
      id: 'expired-code-id',
      email: TEST_EMAIL,
      codeHash: '$mock$somesalt$000000', // mock hash for code "000000"
      type: 'register',
      expiresAt: new Date(Date.now() - 60000), // 1 分钟前过期
      used: false,
      createdAt: new Date(Date.now() + 10000), // 未来时间 → 成为 latest
    };

    const codesMap = (repo as any).verificationCodes as Map<string, VerificationCodeRecord>;
    codesMap.set(expiredRecord.id, expiredRecord);

    try {
      await authService.verifyEmail({ email: TEST_EMAIL, code: '000000' });
      expect.unreachable('过期验证码应抛出异常');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_INVALID_CODE');
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('过期');
    }
  });

  it('19. 验证码 marked used 后不可重复使用', async () => {
    const code = emailService.getLatestCode(TEST_EMAIL);
    expect(code).toBeTruthy();

    // 第一次验证成功
    await authService.verifyEmail({ email: TEST_EMAIL, code: code! });

    // 验证码已标记为 used
    const codeRecord = await repo.findLatestCode(TEST_EMAIL, 'register');
    expect(codeRecord!.used).toBe(true);

    // 第二次使用同一验证码应失败
    try {
      await authService.verifyEmail({ email: TEST_EMAIL, code: code! });
      expect.unreachable('已使用的验证码应拒绝');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_INVALID_CODE');
      expect(err.message).toContain('已使用');
      expect(err.statusCode).toBe(400);
    }
  });
});

// ==========================================
describe('AuthService — 发送验证码', () => {
  it('14. 正常发送验证码：返回成功', async () => {
    // 使用 cooldown=0 避免注册验证码干扰
    const { authService, emailService } = createAuthService({ codeCooldownSeconds: 0 });

    await authService.register({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const beforeCount = emailService.codes.get(TEST_EMAIL)?.length ?? 1;

    await authService.sendVerification({ email: TEST_EMAIL, type: 'register' });

    const afterCount = emailService.codes.get(TEST_EMAIL)?.length ?? 0;
    expect(afterCount).toBe(beforeCount + 1);

    const newCode = emailService.getLatestCode(TEST_EMAIL);
    expect(newCode).toBeTruthy();
    expect(newCode!.length).toBe(6);
  });

  it('15. 60秒内重复请求：返回 AUTH_CODE_COOLDOWN (429)', async () => {
    const { authService } = createAuthService();

    await authService.register({ email: TEST_EMAIL, password: TEST_PASSWORD });

    // 注册已发送一次验证码，立即再发 → 触发冷却
    try {
      await authService.sendVerification({ email: TEST_EMAIL, type: 'register' });
      expect.unreachable('冷却期内应拒绝发送');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_CODE_COOLDOWN');
      expect(err.statusCode).toBe(429);
      expect(err.message).toContain('秒后重试');
    }
  });
});

// ==========================================
describe('AuthService — Token 验证', () => {
  it('16. 有效 Token：返回用户信息 (getMe)', async () => {
    const { authService, result } = await registerTestUser();

    const user = await authService.getMe(result.user.id);

    expect(user.email).toBe(TEST_EMAIL);
    expect(user.id).toBe(result.user.id);
  });

  it('16b. validateToken 有效 Token：返回载荷', async () => {
    const { authService, result } = await registerTestUser();

    const payload = await authService.validateToken(result.token);

    expect(payload.userId).toBe(result.user.id);
    expect(payload.email).toBe(TEST_EMAIL);
  });
});

// ==========================================
// 第二部分：Express 路由集成测试
// ==========================================

describe('Auth Routes — 集成测试', () => {
  let app: express.Express;
  let emailService: MockEmailService;

  beforeEach(() => {
    // 集成测试也需要 cooldown=0 避免注册干扰后续测试
    const created = createAuthService({ codeCooldownSeconds: 0 });
    emailService = created.emailService;
    app = createApp(created.authService);
  });

  // ---------- 注册路由 ----------
  describe('POST /api/auth/register', () => {
    it('正常注册返回 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, nickname: TEST_NICKNAME })
        .expect(201);

      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.user.isVerified).toBe(false);
      expect(res.body.message).toContain('注册成功');
    });

    it('重复注册返回 409', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(409);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('已注册');
    });

    it('无效邮箱格式返回 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad-email', password: TEST_PASSWORD })
        .expect(422);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('邮箱格式');
    });

    it('密码过短返回 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: '12345' })
        .expect(422);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('密码长度');
    });
  });

  // ---------- 登录路由 ----------
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    });

    it('正常登录返回 200', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
    });

    it('邮箱不存在返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_PASSWORD })
        .expect(401);

      expect(res.body.code).toBe(-1);
    });

    it('密码错误返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: 'WrongPassword123' })
        .expect(401);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('还剩');
    });
  });

  // ---------- 发送验证码路由 ----------
  describe('POST /api/auth/send-verification', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    });

    it('发送验证码返回 200（cooldown=0 模式）', async () => {
      const res = await request(app)
        .post('/api/auth/send-verification')
        .send({ email: TEST_EMAIL, type: 'register' })
        .expect(200);

      expect(res.body.code).toBe(0);
      expect(res.body.message).toContain('验证码已发送');
    });
  });

  describe('POST /api/auth/send-verification (cooldown)', () => {
    it('60秒内重复发送返回 429', async () => {
      // 专用实例，带冷却
      const { authService: svc } = createAuthService({ codeCooldownSeconds: 60 });
      const app2 = createApp(svc);

      await request(app2)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      // 注册已发验证码，立即再发 → 429
      const res = await request(app2)
        .post('/api/auth/send-verification')
        .send({ email: TEST_EMAIL, type: 'register' })
        .expect(429);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('频繁');
    });
  });

  // ---------- 验证邮箱路由 ----------
  describe('POST /api/auth/verify-email', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    });

    it('正确验证码返回 200', async () => {
      const code = emailService.getLatestCode(TEST_EMAIL);
      expect(code).toBeTruthy();

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: TEST_EMAIL, code })
        .expect(200);

      expect(res.body.code).toBe(0);
      expect(res.body.message).toContain('验证成功');
    });

    it('错误验证码返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: TEST_EMAIL, code: '000000' })
        .expect(400);

      expect(res.body.code).toBe(-1);
    });
  });

  // ---------- /me 路由 ----------
  describe('GET /api/auth/me', () => {
    it('17. 无 Token：返回 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.code).toBe(-1);
      expect(res.body.message).toContain('未登录');
    });

    it('18. 无效 Token：返回 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body.code).toBe(-1);
    });

    it('18b. 过期 Token：返回 401', async () => {
      const originalExpiresIn = process.env.JWT_EXPIRES_IN;
      process.env.JWT_EXPIRES_IN = '0s';

      const { authService: svc } = createAuthService();
      const tempApp = createApp(svc);

      const regRes = await request(tempApp)
        .post('/api/auth/register')
        .send({ email: 'expired@example.com', password: TEST_PASSWORD })
        .expect(201);

      const token = regRes.body.data.token;

      const res = await request(tempApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.code).toBe(-1);

      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    });

    it('16c. 有效 Token：返回用户信息', async () => {
      const { authService: svc } = createAuthService();
      const app2 = createApp(svc);

      const regRes = await request(app2)
        .post('/api/auth/register')
        .send({ email: 'me-test@example.com', password: TEST_PASSWORD })
        .expect(201);

      const token = regRes.body.data.token;

      const res = await request(app2)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(0);
      expect(res.body.data.email).toBe('me-test@example.com');
    });
  });

  // ---------- /logout 路由 ----------
  describe('POST /api/auth/logout', () => {
    it('无 Token 返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(res.body.message).toContain('未登录');
    });

    it('有效 Token 返回 200', async () => {
      const { authService: svc } = createAuthService();
      const app2 = createApp(svc);

      const regRes = await request(app2)
        .post('/api/auth/register')
        .send({ email: 'logout-test@example.com', password: TEST_PASSWORD })
        .expect(201);

      const token = regRes.body.data.token;

      const res = await request(app2)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(0);
      expect(res.body.message).toContain('已退出');
    });
  });
});
