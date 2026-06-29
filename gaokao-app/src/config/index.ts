import provincesJson from './provinces.json';
import subjectsJson from './subjects.json';
import optionsJson from './options.json';
import rankLookupsJson from './rankLookups.json';
import type { RankInfo } from '../data';

export interface ProvinceConfig {
  name: string;
  mode: string;
  maxScore: number;
}

export interface SpecialIdentityItem {
  id: string;
  label: string;
  desc: string;
}

/**
 * 静态配置：省份列表
 */
export const PROVINCES: ProvinceConfig[] = provincesJson;

/**
 * 静态配置：首选科目（物理/历史）
 */
export const PRIMARY_SUBJECTS: string[] = subjectsJson.primary;

/**
 * 静态配置：再选科目（化学/生物/政治/地理）
 */
export const SECONDARY_SUBJECTS: string[] = subjectsJson.secondary;

/**
 * 静态配置：院校层次选项
 */
export const COLLEGE_LEVELS: string[] = optionsJson.collegeLevels;

/**
 * 静态配置：意向城市列表
 */
export const CITIES: string[] = optionsJson.cities;

/**
 * 静态配置：距离偏好选项
 */
export const DISTANCE_PREFS: string[] = optionsJson.distancePrefs;

/**
 * 静态配置：学科门类选项
 */
export const DISCIPLINES: string[] = optionsJson.disciplines;

/**
 * 静态配置：职业倾向选项
 */
export const CAREER_ORIENTATIONS: string[] = optionsJson.careerOrientations;

/**
 * 静态配置：热门专业列表（搜索提示用）
 */
export const POPULAR_MAJORS: string[] = optionsJson.popularMajors;

/**
 * 静态配置：特殊身份选项
 */
export const SPECIAL_IDENTITIES: SpecialIdentityItem[] = optionsJson.specialIdentities;

/**
 * 静态配置：位次查询兜底表（后端不可用时使用）
 */
export const RANK_LOOKUP_FALLBACK: Record<number, RankInfo> = Object.fromEntries(
  Object.entries(rankLookupsJson).map(([score, info]) => [
    Number(score),
    { ...info, range: [info.range[0], info.range[1]] as [number, number] },
  ])
) as Record<number, RankInfo>;
