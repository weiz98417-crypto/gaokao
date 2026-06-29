import { Router, type Request, type Response, type NextFunction } from 'express';
import type { AuthService } from '../services/authService';
import { AuthError } from '../lib/errors';
import { createAuthMiddleware } from '../middleware/auth';

/**
 * 认证路由工厂函数
 *
 * 创建包含 6 个端点的 Express Router：
 * - POST /register         注册
 * - POST /login            登录
 * - POST /send-verification 重发验证码
 * - POST /verify-email      验证邮箱
 * - GET  /me               获取当前用户（需认证）
 * - POST /logout            退出（需认证）
 *
 * @param authService 认证服务实例
 * @returns Express Router
 */
export const createAuthRoutes = (authService: AuthService): Router => {
  const router = Router();
  const auth = createAuthMiddleware(authService);

  // ==========================================
  // POST /register
  // ==========================================
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, nickname } = req.body;
      const result = await authService.register({ email, password, nickname });
      res.status(201).json({
        code: 0,
        data: result,
        message: '注册成功，验证码已发送至您的邮箱',
      });
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
  });

  // ==========================================
  // POST /login
  // ==========================================
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({
        code: 0,
        data: result,
        message: '登录成功',
      });
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
  });

  // ==========================================
  // POST /send-verification
  // ==========================================
  router.post('/send-verification', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, type } = req.body;
      await authService.sendVerification({ email, type });
      res.json({
        code: 0,
        data: null,
        message: '验证码已发送',
      });
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
  });

  // ==========================================
  // POST /verify-email
  // ==========================================
  router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code } = req.body;
      await authService.verifyEmail({ email, code });
      res.json({
        code: 0,
        data: null,
        message: '邮箱验证成功',
      });
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
  });

  // ==========================================
  // GET /me
  // ==========================================
  router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user as { userId: string; email: string };
      const user = await authService.getMe(userId);
      res.json({
        code: 0,
        data: user,
        message: 'ok',
      });
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
  });

  // ==========================================
  // POST /logout
  // ==========================================
  router.post('/logout', auth, async (_req: Request, res: Response) => {
    // JWT 无状态，客户端丢弃 token 即可
    // 后续可扩展黑名单机制
    res.json({
      code: 0,
      data: null,
      message: '已退出登录',
    });
  });

  return router;
};
