import bcrypt from 'bcrypt';
import type { IAuthRepository } from '../repositories/interfaces';
import type { IEmailService } from './emailService';
import { AuthError, AuthErrorCode } from '../lib/errors';
import { signToken, verifyToken } from '../lib/jwt';
import type {
  RegisterRequest,
  LoginRequest,
  SendVerificationRequest,
  VerifyEmailRequest,
  UserResponse,
  AuthResult,
  JwtPayload,
  AuthConfig,
} from '../types';

/** bcrypt salt rounds */
const BCRYPT_ROUNDS = 12;

/** 邮箱格式正则 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 认证业务服务
 *
 * 封装注册、登录、邮箱验证、Token 管理等核心认证逻辑。
 * 通过依赖注入接收 IAuthRepository 与 IEmailService，
 * 便于测试时替换实现。
 */
export class AuthService {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly emailService: IEmailService,
    private readonly config: AuthConfig
  ) {}

  // ==========================================
  // 公共方法
  // ==========================================

  /**
   * 用户注册
   *
   * 流程：
   * ① 校验邮箱格式和密码长度
   * ② 查重（邮箱是否已注册）
   * ③ bcrypt.hash 密码
   * ④ 创建用户
   * ⑤ 生成 6 位验证码并 bcrypt.hash 存入数据库
   * ⑥ 发送明文验证码到用户邮箱
   * ⑦ 返回 JWT token
   */
  async register(dto: RegisterRequest): Promise<AuthResult> {
    // ① 校验
    this.validateEmail(dto.email);
    this.validatePassword(dto.password);

    // ② 查重
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new AuthError(
        AuthErrorCode.EMAIL_EXISTS,
        '该邮箱已注册',
        409
      );
    }

    // ③ 加密密码
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // ④ 创建用户
    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
    });

    // ⑤ 生成验证码
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + this.config.codeTTLMinutes * 60 * 1000
    );
    await this.authRepo.createVerificationCode({
      email: dto.email,
      codeHash,
      type: 'register',
      expiresAt,
      userId: user.id,
    });

    // ⑥ 发送邮件（明文验证码，仅在内存中存在）
    await this.emailService.sendVerificationCode(dto.email, code);

    // ⑦ 返回 JWT
    const token = this.generateToken({ userId: user.id, email: user.email });
    return {
      token,
      user: this.toUserResponse(user),
    };
  }

  /**
   * 用户登录
   *
   * 流程：
   * ① 查找用户
   * ② 检查账户是否被锁定（过期则自动解锁）
   * ③ bcrypt.compare 密码
   * ④ 失败：incrementFailedAttempts → ≥最大次数则 lockUntil
   * ⑤ 成功：resetFailedAttempts → 签发 JWT
   */
  async login(dto: LoginRequest): Promise<AuthResult> {
    // ① 查找用户
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        '邮箱或密码错误',
        401
      );
    }

    // ② 检查锁定状态
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        const minutes = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 60000
        );
        throw new AuthError(
          AuthErrorCode.ACCOUNT_LOCKED,
          `账户已被锁定，请 ${minutes} 分钟后重试`,
          423
        );
      }
      // 锁定期已过，自动解锁
      await this.authRepo.resetFailedAttempts(user.id);
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }

    // ③ 验证密码
    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      // ④ 失败处理
      await this.authRepo.incrementFailedAttempts(user.id);
      const newCount = user.failedAttempts;

      if (newCount >= this.config.loginMaxAttempts) {
        const lockUntil = new Date(
          Date.now() + this.config.loginLockMinutes * 60 * 1000
        );
        await this.authRepo.lockUntil(user.id, lockUntil);
        throw new AuthError(
          AuthErrorCode.ACCOUNT_LOCKED,
          `密码错误次数过多，账户已被锁定 ${this.config.loginLockMinutes} 分钟`,
          423
        );
      }

      const remaining = this.config.loginMaxAttempts - newCount;
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        `邮箱或密码错误，还剩 ${remaining} 次尝试机会`,
        401
      );
    }

    // ⑤ 成功
    await this.authRepo.resetFailedAttempts(user.id);
    const token = this.generateToken({ userId: user.id, email: user.email });
    return {
      token,
      user: this.toUserResponse(user),
    };
  }

  /**
   * 发送/重发验证码
   *
   * 冷却检查：同一邮箱同一类型 60 秒内不可重复发送。
   */
  async sendVerification(dto: SendVerificationRequest): Promise<void> {
    this.validateEmail(dto.email);

    // 冷却检查
    const latest = await this.authRepo.findLatestCode(dto.email, dto.type);
    if (latest) {
      const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (elapsed < this.config.codeCooldownSeconds) {
        const remaining = Math.ceil(
          this.config.codeCooldownSeconds - elapsed
        );
        throw new AuthError(
          AuthErrorCode.CODE_COOLDOWN,
          `验证码发送过于频繁，请 ${remaining} 秒后重试`,
          429
        );
      }
    }

    // 生成验证码
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + this.config.codeTTLMinutes * 60 * 1000
    );

    // 查找用户 ID（如果用户已存在）
    const user = await this.authRepo.findByEmail(dto.email);

    await this.authRepo.createVerificationCode({
      email: dto.email,
      codeHash,
      type: dto.type,
      expiresAt,
      userId: user?.id,
    });

    // 发送邮件
    await this.emailService.sendVerificationCode(dto.email, code);
  }

  /**
   * 验证邮箱
   *
   * 流程：
   * ① 查找最新一条验证码
   * ② 检查是否已使用
   * ③ 检查是否过期
   * ④ bcrypt.compare 验证码
   * ⑤ 标记已使用
   * ⑥ 更新用户 isVerified 状态
   */
  async verifyEmail(dto: VerifyEmailRequest): Promise<void> {
    this.validateEmail(dto.email);

    // ① 查找最新验证码
    const record = await this.authRepo.findLatestCode(dto.email, 'register');
    if (!record) {
      throw new AuthError(
        AuthErrorCode.INVALID_CODE,
        '未找到验证码，请先发送验证码',
        404
      );
    }

    // ② 检查是否已使用
    if (record.used) {
      throw new AuthError(
        AuthErrorCode.INVALID_CODE,
        '验证码已使用',
        400
      );
    }

    // ③ 检查是否过期
    if (record.expiresAt < new Date()) {
      throw new AuthError(
        AuthErrorCode.INVALID_CODE,
        '验证码已过期，请重新发送',
        400
      );
    }

    // ④ 比对验证码
    const valid = await bcrypt.compare(dto.code, record.codeHash);
    if (!valid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CODE,
        '验证码错误',
        400
      );
    }

    // ⑤ 标记已使用
    await this.authRepo.markCodeUsed(record.id);

    // ⑥ 更新用户验证状态（如果关联了用户）
    if (record.userId) {
      await this.authRepo.updateVerificationStatus(record.userId);
    }
  }

  /**
   * 获取当前用户信息
   * @param userId 用户 ID
   * @returns 用户响应（脱敏）
   */
  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        '用户不存在',
        404
      );
    }
    return this.toUserResponse(user);
  }

  /**
   * 验证 Token 并返回载荷
   *
   * 用于认证中间件：先验证 JWT 签名，再确认用户存在且未被锁定。
   * @param token JWT 字符串
   * @returns 解码后的载荷
   */
  async validateToken(token: string): Promise<JwtPayload> {
    // ① 验证 JWT 签名
    const payload = verifyToken(token);

    // ② 确认用户存在
    const user = await this.authRepo.findById(payload.userId);
    if (!user) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        '用户不存在或已被删除',
        401
      );
    }

    // ③ 检查锁定状态
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthError(
        AuthErrorCode.ACCOUNT_LOCKED,
        '账户已被锁定',
        423
      );
    }

    return payload;
  }

  // ==========================================
  // 私有方法
  // ==========================================

  /**
   * 签发 JWT Token
   */
  private generateToken(payload: JwtPayload): string {
    // 覆盖 jwtExpiresIn 需要在 signToken 层面处理，这里暂且透传
    return signToken(payload);
  }

  /**
   * 生成 6 位随机数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 用户记录 → 前端响应（脱敏）
   */
  private toUserResponse(user: {
    id: string;
    email: string;
    nickname: string | null;
    isVerified: boolean;
    createdAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * 邮箱格式校验
   */
  private validateEmail(email: string): void {
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        '邮箱格式不正确',
        422
      );
    }
  }

  /**
   * 密码强度校验（≥8 位）
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        '密码长度不能少于 8 位',
        422
      );
    }
  }
}
