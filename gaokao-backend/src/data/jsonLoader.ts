import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Province, RecommendationItem, RiskItem, RankInfo } from '../types';

const JSON_DIR = resolve(__dirname, 'json');

function loadJson<T>(filename: string): T {
  const filePath = resolve(JSON_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function loadProvinces(): Province[] {
  return loadJson<Province[]>('provinces.json');
}

export function loadRecommendations(): RecommendationItem[] {
  return loadJson<RecommendationItem[]>('recommendations.json');
}

export function loadRiskChecks(): RiskItem[] {
  return loadJson<RiskItem[]>('riskChecks.json');
}

export function loadRankLookups(): Record<number, RankInfo> {
  return loadJson<Record<string, RankInfo>>('rankLookups.json') as Record<number, RankInfo>;
}
