import jwt from 'jsonwebtoken';
import { AuthError, AuthErrorCode } from './errors';
import type { JwtPayload } from '../types';

/**
 * JWT 工具模块
 *
 * 封装 jsonwebtoken 的签发与验证逻辑，密钥和过期时间从环境变量读取。
 */

/** 获取 JWT 密钥（带默认值） */
function getSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret';
}

/** 解析过期时间字符串（如 "15m" → 900 seconds） */
function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '15m';
}

/**
 * 签发 JWT Token
 * @param payload 载荷（userId + email）
 * @returns 签发的 JWT 字符串
 */
export function signToken(payload: { userId: string; email: string }): string {
  const secret = getSecret();
  const expiresIn = getExpiresIn();
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证 JWT Token
 * @param token JWT 字符串
 * @returns 解码后的载荷
 * @throws AuthError 当 token 无效或过期时
 */
export function verifyToken(token: string): JwtPayload {
  const secret = getSecret();
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded.userId || !decoded.email) {
      throw new AuthError(
        AuthErrorCode.TOKEN_INVALID,
        'Token 格式无效',
        401
      );
    }
    return decoded;
  } catch (err) {
    if (err instanceof AuthError) {
      throw err;
    }
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError(
        AuthErrorCode.TOKEN_INVALID,
        'Token 已过期，请重新登录',
        401
      );
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AuthError(
        AuthErrorCode.TOKEN_INVALID,
        'Token 无效',
        401
      );
    }
    throw new AuthError(
      AuthErrorCode.TOKEN_INVALID,
      'Token 验证失败',
      401
    );
  }
}
