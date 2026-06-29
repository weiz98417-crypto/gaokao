import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/authService';
import { AuthError } from '../lib/errors';

/**
 * 认证中间件工厂函数
 *
 * 从 Authorization 头提取 Bearer Token，调用 AuthService.validateToken 验证。
 * 验证通过后将 { userId, email } 注入 req.user。
 *
 * @param authService 认证服务实例
 * @returns Express 中间件
 */
export const createAuthMiddleware = (authService: AuthService) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({
        code: -1,
        data: null,
        message: '未登录',
      });
      return;
    }

    try {
      const payload = await authService.validateToken(header.slice(7));
      (req as any).user = { userId: payload.userId, email: payload.email };
      next();
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          code: -1,
          data: null,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  };
};
