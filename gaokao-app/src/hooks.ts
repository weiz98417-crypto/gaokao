import { useMemo } from 'react';
import { PROVINCES, RANK_LOOKUP_FALLBACK } from './config';

export function useProvinceConfig(provinceName: string) {
  return useMemo(() => {
    const province = PROVINCES.find((p) => p.name === provinceName);
    return province || { name: '广东省', mode: '3+1+2', maxScore: 750 };
  }, [provinceName]);
}

export function useRankLookup(score: number) {
  return useMemo(() => {
    if (score <= 0) return null;
    const scores = Object.keys(RANK_LOOKUP_FALLBACK).map(Number).sort((a, b) => b - a);
    let closest = scores[0];
    let minDiff = Math.abs(score - closest);
    for (const s of scores) {
      const diff = Math.abs(score - s);
      if (diff < minDiff) {
        minDiff = diff;
        closest = s;
      }
    }
    const fallback = RANK_LOOKUP_FALLBACK[closest];
    if (!fallback) return null;
    return {
      ...fallback,
      confidence: 'exact' as const,
    };
  }, [score]);
}
