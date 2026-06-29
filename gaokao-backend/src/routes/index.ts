import { Router, type Request, type Response, type NextFunction } from 'express';
import type { CandidateInput, CandidatePreferences, RecommendationItem } from '../types';
import type { RecommendationService } from '../services/recommendationService';
import type { ProvinceService } from '../services/provinceService';
import type { RankService } from '../services/rankService';
import type { RiskService } from '../services/riskService';
import type { BatchLineService } from '../services/batchLineService';
import type { SubjectCoverageService } from '../services/subjectCoverageService';
import { createAuthRoutes } from './authRoutes';
import { AuthService } from '../services/authService';
import { PrismaAuthRepository } from '../repositories/authRepository';
import { InMemoryAuthRepository } from '../repositories/authRepository.inMemory';
import { createEmailService } from '../services/emailService';

/**
 * API 路由聚合
 *
 * 所有路由统一返回 `{ code: number, data: T, message: string }` 结构，
 * 便于前端统一处理。
 */
interface RouteServices {
  recommendationService: RecommendationService;
  provinceService: ProvinceService;
  rankService: RankService;
  riskService: RiskService;
  batchLineService: BatchLineService;
  subjectCoverageService: SubjectCoverageService;
}

const success = <T>(data: T) => ({
  code: 0,
  data,
  message: 'ok',
});

const fail = (message: string, code = 400) => ({
  code,
  data: null,
  message,
});

/**
 * 异步路由包装器：自动将 async handler 中的异常交给 Express 错误中间件
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 科目类参数校验
 * @param subjectType 原始科目类参数
 * @returns 是否合法
 */
/**
 * 规范化科目类参数
 * 兼容前端可能传 "物理类""历史类"等带"类"后缀的值
 */
function normalizeSubjectType(raw: string): string {
  return raw.replace(/类$/, '');
}

function isValidSubjectType(raw: string): boolean {
  const subjectType = normalizeSubjectType(raw);
  const validTypes = [
    '物理',
    '历史',
    '综合改革',
    '文科',
    '理科',
    'A类',
    'B类',
  ];
  return validTypes.includes(subjectType);
}

export function createRouter(services: RouteServices): Router {
  const router = Router();

  /**
   * GET /api/health
   * 健康检查
   */
  router.get('/health', (_req: Request, res: Response) => {
    res.json(
      success({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'gaokao-backend',
      })
    );
  });

  /**
   * GET /api/provinces
   * 省份列表
   */
  router.get(
    '/provinces',
    asyncHandler(async (_req: Request, res: Response) => {
      const provinces = await services.provinceService.getAll();
      res.json(success(provinces));
    })
  );

  /**
   * GET /api/rank-lookup
   * 位次查询
   * Query: score, province, subjectType
   */
  router.get(
    '/rank-lookup',
    asyncHandler(async (req: Request, res: Response) => {
      const rawScore = req.query.score;
      const province = String(req.query.province || '广东省');
      const subjectType = normalizeSubjectType(String(req.query.subjectType || ''));

      if (rawScore === undefined || rawScore === '') {
        res.status(400).json(fail('缺少必要参数：score'));
        return;
      }
      if (!subjectType || !isValidSubjectType(subjectType)) {
        res.status(400).json(fail('缺少或非法参数：subjectType'));
        return;
      }

      const score = Number(rawScore);
      if (Number.isNaN(score) || score < 0 || score > 900) {
        res.status(400).json(fail('参数 score 不合法'));
        return;
      }

      const rankInfo = await services.rankService.lookup(score, province, subjectType);
      if (!rankInfo) {
        res.status(404).json(fail('未找到该分数对应的位次信息'));
        return;
      }

      res.json(success(rankInfo));
    })
  );

  /**
   * GET /api/batch-lines
   * 批次线查询
   * Query: province, subjectType
   */
  router.get(
    '/batch-lines',
    asyncHandler(async (req: Request, res: Response) => {
      const province = String(req.query.province || '');
      const subjectType = normalizeSubjectType(String(req.query.subjectType || ''));

      if (!province) {
        res.status(400).json(fail('缺少必要参数：province'));
        return;
      }
      if (!subjectType || !isValidSubjectType(subjectType)) {
        res.status(400).json(fail('缺少或非法参数：subjectType'));
        return;
      }

      const result = await services.batchLineService.getLines(province, subjectType);
      res.json(success(result));
    })
  );

  /**
   * GET /api/subject-coverage
   * 选科覆盖率查询
   * Query: province, subjects（逗号分隔，如 物理,化学,生物）
   */
  router.get(
    '/subject-coverage',
    asyncHandler(async (req: Request, res: Response) => {
      const province = String(req.query.province || '');
      const subjectsRaw = String(req.query.subjects || '');

      if (!province) {
        res.status(400).json(fail('缺少必要参数：province'));
        return;
      }
      if (!subjectsRaw) {
        res.status(400).json(fail('缺少必要参数：subjects'));
        return;
      }

      const subjects = subjectsRaw
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (subjects.length === 0) {
        res.status(400).json(fail('参数 subjects 不合法'));
        return;
      }

      const result = await services.subjectCoverageService.getCoverage(province, subjects);
      res.json(success(result));
    })
  );

  /**
   * GET /api/recommend
   * 获取 Mock 推荐列表（与前端 MOCK_RECOMMENDATIONS 格式一致）
   */
  router.get(
    '/recommend',
    asyncHandler(async (_req: Request, res: Response) => {
      const input: CandidateInput = {
        province: '广东省',
        score: 585,
      };
      const recommendations = await services.recommendationService.recommend(input);
      res.json(success(recommendations));
    })
  );

  /**
   * POST /api/recommend
   * 推荐接口：接收考生信息并返回推荐志愿列表
   */
  router.post(
    '/recommend',
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as Partial<CandidateInput> & {
        preferences?: Record<string, unknown>;
      };

      if (!body.province || body.score === undefined) {
        res.status(400).json(fail('缺少必要参数：province, score'));
        return;
      }

      const input: CandidateInput = {
        province: String(body.province),
        score: Number(body.score),
        rank: body.rank !== undefined ? Number(body.rank) : undefined,
        subjects: Array.isArray(body.subjects) ? body.subjects.map(String) : undefined,
        preferences: body.preferences
          ? ({
              collegeLevel: typeof body.preferences.collegeLevel === 'string' ? body.preferences.collegeLevel : undefined,
              preferredCities: Array.isArray(body.preferences.preferredCities) ? body.preferences.preferredCities.map(String) : undefined,
              disciplines: Array.isArray(body.preferences.disciplines) ? body.preferences.disciplines.map(String) : undefined,
              selectedMajor: typeof body.preferences.selectedMajor === 'string' ? body.preferences.selectedMajor : undefined,
              careerOrientation: typeof body.preferences.careerOrientation === 'string' ? body.preferences.careerOrientation : undefined,
              subjectType: typeof body.preferences.subjectType === 'string' ? body.preferences.subjectType : undefined,
            } as CandidatePreferences)
          : undefined,
        weights: Array.isArray(body.weights) ? body.weights.map(Number) : undefined,
      };

      const recommendations = await services.recommendationService.recommend(input);
      res.json(success(recommendations));
    })
  );

  /**
   * POST /api/recommend/mock
   * 显式 Mock 推荐接口，返回与前端一致的 Mock 数据
   */
  router.post(
    '/recommend/mock',
    asyncHandler(async (_req: Request, res: Response) => {
      const input: CandidateInput = {
        province: '广东省',
        score: 585,
      };
      const recommendations = await services.recommendationService.recommend(input);
      res.json(success(recommendations));
    })
  );

  /**
   * GET /api/risk
   * 风险诊断 Mock 数据（兜底，不带考生上下文）
   */
  router.get(
    '/risk',
    asyncHandler(async (_req: Request, res: Response) => {
      const riskItems = await services.riskService.getRiskItems();
      res.json(success(riskItems));
    })
  );

  /**
   * POST /api/risk
   * 基于考生信息与推荐方案进行 LLM 风险诊断
   */
  router.post(
    '/risk',
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as { input?: Partial<CandidateInput>; recommendations?: RecommendationItem[] };

      const input: CandidateInput = {
        province: String(body.input?.province ?? '广东省'),
        score: Number(body.input?.score ?? 585),
        rank: body.input?.rank !== undefined ? Number(body.input.rank) : undefined,
        subjects: Array.isArray(body.input?.subjects) ? body.input.subjects : undefined,
        preferences: body.input?.preferences && typeof body.input.preferences === 'object'
          ? (body.input.preferences as Record<string, unknown>)
          : undefined,
        weights: Array.isArray(body.input?.weights) ? body.input.weights : undefined,
      };

      const recommendations = Array.isArray(body.recommendations) ? body.recommendations : [];
      const riskItems = await services.riskService.getRiskItems(input, recommendations);
      res.json(success(riskItems));
    })
  );

  // ==========================================
  // 认证路由
  // ==========================================
  const useDatabase = process.env.USE_DATABASE !== 'false';
  const authRepository = useDatabase
    ? new PrismaAuthRepository()
    : new InMemoryAuthRepository();

  const emailService = createEmailService();
  const authService = new AuthService(authRepository, emailService, {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
    loginLockMinutes: Number(process.env.LOGIN_LOCK_MINUTES) || 15,
    codeTTLMinutes: 5,
    codeCooldownSeconds: 60,
  });

  router.use('/auth', createAuthRoutes(authService));

  return router;
}
