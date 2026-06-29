import express from 'express';
import cors from 'cors';
import { createRouter } from './routes';
import { RecommendationService } from './services/recommendationService';
import { AdmissionScoreService } from './services/admissionScoreService';
import { UniversityPlanService } from './services/universityPlanService';
import { CityUniversityService } from './services/cityUniversityService';
import { ProvinceService } from './services/provinceService';
import { RankService } from './services/rankService';
import { RiskService } from './services/riskService';
import { BatchLineService } from './services/batchLineService';
import { SubjectCoverageService } from './services/subjectCoverageService';
import { LlmService } from './services/llmService';
import { AppError } from './lib/errors';
import {
  InMemoryProvinceRepository,
  InMemoryBatchLineRepository,
  InMemoryRankSegmentRepository,
  InMemorySubjectCoverageRepository,
  InMemoryRiskRepository,
  InMemoryAdmissionScoreRepository,
  InMemoryUniversityPlanRepository,
  InMemoryCityUniversityRepository,
} from './repositories/inMemoryRepository';
import {
  PrismaProvinceRepository,
  PrismaBatchLineRepository,
  PrismaRankSegmentRepository,
  PrismaSubjectCoverageRepository,
  PrismaRiskRepository,
  PrismaAdmissionScoreRepository,
  PrismaUniversityPlanRepository,
  PrismaCityUniversityRepository,
} from './repositories/prismaRepository';

/**
 * Express 应用工厂
 *
 * 将仓库、服务、路由组装在一起，便于测试与后续替换实现。
 */
export function createApp(): express.Express {
  const app = express();

  // 全局中间件
  app.use(express.json());
  app.use(requestLogger);
  app.use(
    cors({
      origin: parseCorsOrigins(process.env.CORS_ORIGINS),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // 依赖注入：根据 USE_DATABASE 选择内存仓库或 Prisma 仓库
  const useDatabase = process.env.USE_DATABASE === 'true';

  const provinceRepository = useDatabase
    ? new PrismaProvinceRepository()
    : new InMemoryProvinceRepository();
  const batchLineRepository = useDatabase
    ? new PrismaBatchLineRepository()
    : new InMemoryBatchLineRepository();
  const rankSegmentRepository = useDatabase
    ? new PrismaRankSegmentRepository()
    : new InMemoryRankSegmentRepository();
  const subjectCoverageRepository = useDatabase
    ? new PrismaSubjectCoverageRepository()
    : new InMemorySubjectCoverageRepository();
  const riskRepository = useDatabase
    ? new PrismaRiskRepository()
    : new InMemoryRiskRepository();

  // T02 新增仓库
  const admissionScoreRepository = useDatabase
    ? new PrismaAdmissionScoreRepository()
    : new InMemoryAdmissionScoreRepository();
  const universityPlanRepository = useDatabase
    ? new PrismaUniversityPlanRepository()
    : new InMemoryUniversityPlanRepository();
  const cityUniversityRepository = useDatabase
    ? new PrismaCityUniversityRepository()
    : new InMemoryCityUniversityRepository();

  // Services
  const provinceService = new ProvinceService(provinceRepository);
  const rankService = new RankService(rankSegmentRepository, provinceRepository);
  const batchLineService = new BatchLineService(
    batchLineRepository,
    provinceRepository
  );
  const subjectCoverageService = new SubjectCoverageService(
    subjectCoverageRepository
  );
  const riskService = new RiskService(riskRepository);

  // T03 新增 Service
  const admissionScoreService = new AdmissionScoreService(
    admissionScoreRepository
  );
  const universityPlanService = new UniversityPlanService(
    universityPlanRepository
  );
  const cityUniversityService = new CityUniversityService(
    cityUniversityRepository
  );

  // LLM Service（可选）
  let llmService: LlmService | undefined;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey && apiKey !== 'YOUR_DEEPSEEK_API_KEY') {
    llmService = new LlmService({
      apiKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
      timeoutMs: 60000,
    });
  }

  // 推荐服务（重写版：两步法引擎）
  const recommendationService = new RecommendationService(
    admissionScoreService,
    universityPlanService,
    cityUniversityService,
    rankService,
    llmService
  );

  // 注册 API 路由（同时挂在 /api 和根路径，兼容 Vite 代理行为差异）
  const apiRouter = createRouter({
    provinceService,
    rankService,
    recommendationService,
    riskService,
    batchLineService,
    subjectCoverageService,
  });
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // 404 处理
  app.use((_req, res) => {
    res.status(404).json({
      code: 404,
      data: null,
      message: '接口不存在',
    });
  });

  // 全局错误处理
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      // AuthError / AppError：使用其携带的 statusCode
      if (err instanceof AppError) {
        // eslint-disable-next-line no-console
        console.error(`[${err.code}] ${err.message}`);
        res.status(err.statusCode).json({
          code: -1,
          data: null,
          message: err.message,
        });
        return;
      }

      // eslint-disable-next-line no-console
      console.error('Unhandled error:', err);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器内部错误',
      });
    }
  );

  return app;
}

/**
 * 请求日志中间件
 * 在开发环境打印每个请求的 method、path、statusCode 和耗时。
 */
function requestLogger(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const start = Date.now();
  const originalEnd = res.end.bind(res);

  res.end = function (
    this: express.Response,
    chunk?: Buffer | string | (() => void),
    encoding?: BufferEncoding | (() => void),
    cb?: (() => void)
  ): express.Response {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
    return originalEnd.call(this, chunk as any, encoding as any, cb as any);
  } as typeof res.end;

  next();
}

/**
 * 解析 CORS 允许来源
 * @param raw 环境变量值，多个来源使用逗号分隔
 * @returns 单一字符串或字符串数组
 */
function parseCorsOrigins(raw: string | undefined): string | string[] {
  if (!raw) {
    return 'http://localhost:5173';
  }

  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}
