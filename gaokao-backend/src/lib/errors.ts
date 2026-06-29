/**
 * 统一错误类
 *
 * 提供 AppError / AuthError 以及认证错误码常量，
 * 便于路由层统一 try/catch 后返回结构化 JSON 响应。
 */

/** 通用应用错误 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** 认证模块专用错误 */
export class AuthError extends AppError {
  constructor(code: string, message: string, statusCode: number = 400) {
    super(code, message, statusCode);
    this.name = 'AuthError';
  }
}

/** 认证错误码常量 */
export const AuthErrorCode = {
  EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  INVALID_CODE: 'AUTH_INVALID_CODE',
  CODE_COOLDOWN: 'AUTH_CODE_COOLDOWN',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
} as const;
