import { apiGet, apiPost } from './client';
import type {
  RecommendationItem,
  RiskItem,
  RankInfo,
  BatchLinesResult,
  SubjectCoverageResult,
} from '../data';

/**
 * 高考志愿填报后端 API 封装
 */

export interface RecommendRequest {
  province: string;
  score: number;
  rank?: number;
  subjects?: string[];
  preferences?: Record<string, unknown>;
  weights?: number[];
}

/** 获取推荐志愿列表 */
export function getRecommendations(request: RecommendRequest): Promise<RecommendationItem[]> {
  return apiPost<RecommendationItem[]>('/recommend', request);
}

/** 获取风险诊断数据（兜底） */
export function getRiskItems(): Promise<RiskItem[]> {
  return apiGet<RiskItem[]>('/risk');
}

/** 基于考生信息和推荐方案获取 LLM 风险诊断 */
export function getRiskItemsByRecommendations(
  request: RecommendRequest,
  recommendations: RecommendationItem[]
): Promise<RiskItem[]> {
  return apiPost<RiskItem[]>('/risk', { input: request, recommendations });
}

/** 根据分数、省份与科目类查询位次 */
export function getRankLookup(
  score: number,
  province: string,
  subjectType: string
): Promise<RankInfo> {
  return apiGet<RankInfo>(
    `/rank-lookup?score=${encodeURIComponent(score)}&province=${encodeURIComponent(
      province
    )}&subjectType=${encodeURIComponent(subjectType)}`
  );
}

/** 按省份与科目类查询批次线 */
export function getBatchLines(
  province: string,
  subjectType: string
): Promise<BatchLinesResult> {
  return apiGet<BatchLinesResult>(
    `/batch-lines?province=${encodeURIComponent(province)}&subjectType=${encodeURIComponent(
      subjectType
    )}`
  );
}

/** 按省份与选科组合查询覆盖率 */
export function getSubjectCoverage(
  province: string,
  subjects: string[]
): Promise<SubjectCoverageResult> {
  return apiGet<SubjectCoverageResult>(
    `/subject-coverage?province=${encodeURIComponent(province)}&subjects=${encodeURIComponent(
      subjects.join(',')
    )}`
  );
}

/** 获取省份列表 */
export function getProvinces(): Promise<Array<{ name: string; mode: string; maxScore: number }>> {
  return apiGet<Array<{ name: string; mode: string; maxScore: number }>>('/provinces');
}
