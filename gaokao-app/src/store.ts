import { create } from 'zustand';
import type { RecommendationItem, BatchLinesResult, SubjectCoverageResult } from './data';

export interface UserProfile {
  province: string;
  mode: string;
  primarySubject: string;
  secondarySubjects: string[];
  totalScore: number;
  rank: number;
  sameScoreCount: number;
  rankRange: [number, number];
  collegeLevel: string;
  preferredCities: string[];
  distancePref: string;
  disciplines: string[];
  careerOrientation: string;
  selectedMajor: string;
  specialIdentities: string[];
  weights: [number, number, number];
  currentStep: number;
  lastRecommendations: RecommendationItem[];
}

interface GaokaoStore extends UserProfile {
  // 真实数据缓存（可选，避免页面回退时重复请求）
  cachedBatchLines: BatchLinesResult | null;
  cachedSubjectCoverage: SubjectCoverageResult | null;

  setProvince: (province: string, mode: string) => void;
  setSubjects: (primary: string, secondary: string[]) => void;
  setScore: (score: number, rank: number, sameScore: number, range: [number, number]) => void;
  setPreferences: (prefs: Partial<Pick<UserProfile, 'collegeLevel' | 'preferredCities' | 'distancePref' | 'disciplines' | 'careerOrientation' | 'selectedMajor'>>) => void;
  toggleSpecialIdentity: (id: string) => void;
  setWeights: (weights: [number, number, number]) => void;
  setLastRecommendations: (items: RecommendationItem[]) => void;
  setCachedBatchLines: (data: BatchLinesResult | null) => void;
  setCachedSubjectCoverage: (data: SubjectCoverageResult | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetFromStep: (step: number) => void;
}

const defaultState: UserProfile = {
  province: '广东省',
  mode: '3+1+2',
  primarySubject: '',
  secondarySubjects: [],
  totalScore: 0,
  rank: 0,
  sameScoreCount: 0,
  rankRange: [0, 0],
  collegeLevel: '不限',
  preferredCities: [],
  distancePref: '全国',
  disciplines: [],
  careerOrientation: '不限',
  selectedMajor: '',
  specialIdentities: [],
  weights: [40, 30, 30],
  currentStep: 1,
  lastRecommendations: [],
};

export const useGaokaoStore = create<GaokaoStore>((set) => ({
  ...defaultState,
  cachedBatchLines: null,
  cachedSubjectCoverage: null,

  setProvince: (province, mode) =>
    set({ province, mode }),

  setSubjects: (primarySubject, secondarySubjects) =>
    set({ primarySubject, secondarySubjects }),

  setScore: (totalScore, rank, sameScoreCount, rankRange) =>
    set({ totalScore, rank, sameScoreCount, rankRange }),

  setPreferences: (prefs) =>
    set((state) => ({ ...state, ...prefs })),

  toggleSpecialIdentity: (id) =>
    set((state) => {
      const current = state.specialIdentities;
      if (current.includes(id)) {
        return { specialIdentities: current.filter((x) => x !== id) };
      }
      return { specialIdentities: [...current, id] };
    }),

  setWeights: (weights) =>
    set({ weights }),

  setLastRecommendations: (lastRecommendations) =>
    set({ lastRecommendations }),

  setCachedBatchLines: (cachedBatchLines) =>
    set({ cachedBatchLines }),

  setCachedSubjectCoverage: (cachedSubjectCoverage) =>
    set({ cachedSubjectCoverage }),

  nextStep: () =>
    set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),

  prevStep: () =>
    set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  goToStep: (step) =>
    set({ currentStep: step }),

  resetFromStep: (step) =>
    set((state) => {
      const resets: Partial<UserProfile> = {};
      if (step <= 1) {
        resets.primarySubject = '';
        resets.secondarySubjects = [];
      }
      if (step <= 2) {
        resets.totalScore = 0;
        resets.rank = 0;
        resets.sameScoreCount = 0;
        resets.rankRange = [0, 0];
      }
      if (step <= 4) {
        resets.collegeLevel = '不限';
        resets.preferredCities = [];
        resets.distancePref = '全国';
        resets.disciplines = [];
        resets.careerOrientation = '不限';
        resets.selectedMajor = '';
        resets.specialIdentities = [];
      }
      if (step <= 5) {
        resets.weights = [40, 30, 30];
        resets.lastRecommendations = [];
      }
      return { ...state, ...resets, currentStep: step };
    }),
}));
