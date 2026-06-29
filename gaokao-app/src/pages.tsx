import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  ChevronRight, ChevronLeft, BarChart3,
  Shield, AlertTriangle, FileCheck, TrendingUp, TrendingDown, Minus,
  Download, Sparkles, Target, Compass, FileText,
} from 'lucide-react';
import { useGaokaoStore } from './store';
import { Card, Button, Pill, ProgressBar, SectionTitle, RadarChart, SelectField, ScoreRing, StatusBadge, C, AnimatedNumber } from './design-system';
import { PROVINCES, PRIMARY_SUBJECTS, SECONDARY_SUBJECTS, COLLEGE_LEVELS, CITIES, DISTANCE_PREFS, DISCIPLINES, CAREER_ORIENTATIONS, POPULAR_MAJORS, SPECIAL_IDENTITIES } from './config';
import type { RecommendationItem, RiskItem, RankInfo } from './data';
import { getRecommendations, getRiskItems, getRiskItemsByRecommendations, getRankLookup, getBatchLines, getSubjectCoverage } from './api/gaokaoApi';
import { useProvinceConfig, useRankLookup } from './hooks';

// ========================
// Custom Easing
// ========================
const customEase = [0.32, 0.72, 0, 1] as const;

// ========================
// Animation Variants
// ========================
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

function useSlideDirection() {
  const location = useLocation();
  const stepOrder = ['/welcome', '/step1', '/step2', '/step3', '/step4', '/step5', '/results', '/risk'];
  const prevPath = useRef(location.pathname);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const prevIndex = stepOrder.indexOf(prevPath.current);
    const currIndex = stepOrder.indexOf(location.pathname);
    setDirection(currIndex > prevIndex ? 1 : -1);
    prevPath.current = location.pathname;
  }, [location.pathname]);

  return direction;
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  const direction = useSlideDirection();
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: customEase }}
      className="min-h-screen pb-24"
    >
      {children}
    </motion.div>
  );
}

/**
 * 根据省份高考模式将前端首选科目映射为后端识别的 subjectType
 * @param province 省份中文名
 * @param mode 高考模式
 * @param primarySubject 前端首选科目
 * @returns 后端 subjectType
 */
function getSubjectTypeForApi(
  province: string,
  mode: string,
  primarySubject: string
): string {
  // 3+3 综合改革省份统一按综合改革查询
  if (mode === '3+3') {
    return '综合改革';
  }

  // 新疆文理分科：将前端的物理/历史映射为理科/文科
  if (province === '新疆维吾尔自治区') {
    return primarySubject === '物理' ? '理科' : '文科';
  }

  // 西藏 A/B 类：当前 UI 未提供 A/B 选项，直接透传（可由后端兜底）
  if (province === '西藏自治区') {
    return primarySubject;
  }

  // 默认 3+1+2：透传物理/历史
  return primarySubject;
}

// ========================
// Motion Slider Component
// ========================
function MotionSlider({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (val: number) => void;
  color: string;
}) {
  const motionValue = useMotionValue(value);
  useEffect(() => { motionValue.set(value); }, [value, motionValue]);
  const width = useTransform(motionValue, [0, 100], ['0%', '100%']);

  return (
    <div className="relative w-full">
      <div className="h-1 rounded-full bg-[#E8E0D6] absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none" />
      <motion.div
        className="h-1 rounded-full absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none"
        style={{ width, backgroundColor: color }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full relative z-10"
      />
    </div>
  );
}

// ========================
// 1. Welcome Page
// ========================
export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: customEase },
    },
  };

  const features = [
    { icon: BarChart3, label: '位次精准匹配' },
    { icon: Target, label: '梯度科学推荐' },
    { icon: Shield, label: '风险智能诊断' },
  ];

  const stats = [
    { label: '覆盖 31 省' },
    { label: '数据实时更新' },
    { label: 'AI 辅助决策' },
  ];

  return (
    <AnimatedPage>
      <div className="relative min-h-[100dvh] overflow-hidden" style={{ backgroundColor: C.bg }}>
        {/* 背景氛围光 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(192,74,26,0.15) 0%, rgba(192,74,26,0) 70%)',
            transform: 'translateX(-50%) translateY(-30%)',
          }}
        />

        <motion.div
          className="relative flex flex-col items-center px-6 pt-16 pb-8 max-w-md mx-auto min-h-[100dvh]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo 区域 */}
          <motion.div variants={itemVariants} className="relative mb-8">
            <motion.div
              className="w-24 h-24 rounded-[28px] flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #D4764A 0%, #C04A1A 100%)',
                boxShadow: '0 8px 32px rgba(192,74,26,0.25)',
              }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" strokeOpacity="0.9" />
                <circle cx="24" cy="24" r="6" fill="white" fillOpacity="0.9" />
                <line x1="24" y1="6" x2="24" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9" />
                <line x1="24" y1="34" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9" />
                <line x1="6" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9" />
                <line x1="34" y1="24" x2="42" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M32 16L36 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
                <path d="M16 32L12 36" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
                <path d="M32 32L36 36" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
                <path d="M16 16L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
              </svg>
            </motion.div>
          </motion.div>

          {/* 品牌名称 */}
          <motion.h1
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight leading-tight mb-2"
            style={{ color: C.text }}
          >
            志在必得
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm leading-relaxed tracking-normal mb-10"
            style={{ color: C.textMuted }}
          >
            智能志愿推荐，让每一分都有方向
          </motion.p>

          {/* 价值主张卡片 */}
          <motion.div variants={itemVariants} className="w-full mb-8">
            <Card className="p-5">
              <h2
                className="text-lg font-semibold tracking-tight leading-tight mb-4"
                style={{ color: C.text }}
              >
                让每一分都有方向
              </h2>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.4, ease: customEase }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: C.primaryBg }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: C.primary }} />
                    </div>
                    <span
                      className="text-sm font-medium leading-relaxed"
                      style={{ color: C.textSecondary }}
                    >
                      {feature.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* 信任数据 */}
          <motion.div variants={itemVariants} className="w-full mb-10">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="font-mono text-3xl font-bold tracking-tight leading-tight" style={{ color: C.primary }}>
                <AnimatedNumber value={128000} duration={1500} format={(n) => `${n.toLocaleString()}+`} />
              </div>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                考生已使用智能填报
              </p>
            </div>
            <div className="flex justify-center gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: C.primaryBg,
                    color: C.primary,
                  }}
                >
                  {stat.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA 按钮 */}
          <motion.div variants={itemVariants} className="w-full max-w-sm mb-3">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(192,74,26,0)',
                  '0 0 0 10px rgba(192,74,26,0.12)',
                  '0 0 0 0px rgba(192,74,26,0)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-2xl"
            >
              <motion.button
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold text-white cursor-pointer"
                style={{
                  background: 'linear-gradient(180deg, #D4764A 0%, #C04A1A 100%)',
                  boxShadow: '0 4px 16px rgba(192,74,26,0.3)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/step1')}
              >
                开始填报
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* 安全提示 */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: C.textMuted }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>数据仅本地存储，不上传服务器</span>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 2. Step1: Province + Subjects
// ========================
export const Step1Province: React.FC = () => {
  const navigate = useNavigate();
  const {
    province,
    primarySubject,
    secondarySubjects,
    cachedSubjectCoverage,
    setProvince,
    setSubjects,
    setCachedSubjectCoverage,
  } = useGaokaoStore();

  const provinceConfig = useProvinceConfig(province);
  const provinceOptions = PROVINCES.map((p) => ({ value: p.name, label: p.name }));

  const [coverageLoading, setCoverageLoading] = useState(false);
  const coverageFetchKeyRef = useRef<string>(cachedSubjectCoverage ? `${province}|${primarySubject}|${secondarySubjects.join(',')}` : '');

  const canProceed = primarySubject && secondarySubjects.length === 2;

  const coverageKey = useMemo(() => {
    if (!canProceed) return '';
    return `${province}|${primarySubject}|${secondarySubjects.join(',')}`;
  }, [canProceed, province, primarySubject, secondarySubjects]);

  const handleProvinceChange = (val: string) => {
    const p = PROVINCES.find((x) => x.name === val);
    setProvince(val, p?.mode || '3+1+2');
    // 省份变化时清空覆盖率缓存，便于重新获取
    setCachedSubjectCoverage(null);
    coverageFetchKeyRef.current = '';
  };

  useEffect(() => {
    if (!coverageKey) {
      return;
    }

    // 使用 ref 避免缓存状态变化导致 effect 重跑，同时保证同一组合只请求一次
    if (coverageFetchKeyRef.current === coverageKey) {
      return;
    }

    coverageFetchKeyRef.current = coverageKey;
    setCoverageLoading(true);

    getSubjectCoverage(province, [primarySubject, ...secondarySubjects])
      .then((data) => {
        setCachedSubjectCoverage(data);
      })
      .catch(() => {
        setCachedSubjectCoverage(null);
      })
      .finally(() => {
        setCoverageLoading(false);
      });
  }, [coverageKey, province, primarySubject, secondarySubjects, setCachedSubjectCoverage]);

  const toggleSecondary = (subject: string) => {
    const current = secondarySubjects;
    if (current.includes(subject)) {
      setSubjects(primarySubject, current.filter((s) => s !== subject));
    } else if (current.length < 2) {
      setSubjects(primarySubject, [...current, subject]);
    }
  };

  const coveragePercent = cachedSubjectCoverage
    ? Math.round(cachedSubjectCoverage.coveragePct * 100)
    : 0;

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <ProgressBar current={1} />
        <SectionTitle title="基本信息" subtitle="Step 1 / 5 — 选择省份与选科" />

        <Card className="mb-4" index={0}>
          <SelectField
            label="省份"
            value={province}
            options={provinceOptions}
            onChange={handleProvinceChange}
          />
          <div className="text-xs leading-relaxed mb-4" style={{ color: C.textMuted }}>
            高考模式：{provinceConfig.mode}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
              首选科目
            </label>
            <div className="flex gap-3">
              {PRIMARY_SUBJECTS.map((sub) => (
                <Pill
                  key={sub}
                  label={sub}
                  active={primarySubject === sub}
                  onClick={() => setSubjects(sub, secondarySubjects)}
                  className="flex-1"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
              再选科目（选2门）
            </label>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_SUBJECTS.map((sub) => (
                <Pill
                  key={sub}
                  label={sub}
                  active={secondarySubjects.includes(sub)}
                  onClick={() => toggleSecondary(sub)}
                />
              ))}
            </div>
            <div className="text-xs leading-relaxed mt-2" style={{ color: C.textMuted }}>
              已选择 {secondarySubjects.length}/2 门
            </div>
          </div>
        </Card>

        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-4 p-5 rounded-2xl text-center"
            style={{ backgroundColor: C.primaryBg }}
          >
            {coverageLoading ? (
              <span className="text-sm leading-relaxed" style={{ color: C.primary }}>
                正在计算覆盖率...
              </span>
            ) : cachedSubjectCoverage ? (
              <div className="space-y-1">
                <span className="text-sm leading-relaxed" style={{ color: C.primary }}>
                  约 <strong className="text-lg">{coveragePercent}%</strong> 的专业可报考
                </span>
                <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                  （基于 985/重点专业样本）
                </div>
              </div>
            ) : (
              <span className="text-sm leading-relaxed" style={{ color: C.primary }}>
                覆盖率计算暂不可用
              </span>
            )}
          </motion.div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto">
            <Button
              className="max-w-sm mx-auto"
              disabled={!canProceed}
              onClick={() => navigate('/step2')}
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 3. Step2: Score Input
// ========================
export const Step2Score: React.FC = () => {
  const navigate = useNavigate();
  const {
    totalScore, setScore, province, mode, primarySubject,
    cachedBatchLines, setCachedBatchLines,
  } = useGaokaoStore();
  const provinceConfig = useProvinceConfig(province);
  const [score, setScoreInput] = useState(totalScore > 0 ? String(totalScore) : '585');
  const fallbackRankData = useRankLookup(Number(score) || 0);
  const [serverRankData, setServerRankData] = useState<RankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState(false);

  const subjectType = useMemo(
    () => getSubjectTypeForApi(province, mode, primarySubject),
    [province, mode, primarySubject]
  );

  useEffect(() => {
    let cancelled = false;
    const s = Number(score);
    if (!s || !subjectType) {
      setServerRankData(null);
      return;
    }

    setRankLoading(true);
    getRankLookup(s, province, subjectType)
      .then((data) => {
        if (!cancelled) setServerRankData(data);
      })
      .catch(() => {
        if (!cancelled) setServerRankData(null);
      })
      .finally(() => {
        setRankLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [score, province, subjectType]);

  // Step2 提前获取批次线，用于显示真实分差
  const batchLineKey = useMemo(() => {
    if (!subjectType) return '';
    return `${province}|${subjectType}`;
  }, [province, subjectType]);
  const batchLineFetchKeyRef = useRef<string>(
    cachedBatchLines && cachedBatchLines.province === province && cachedBatchLines.subjectType === subjectType
      ? batchLineKey
      : ''
  );

  useEffect(() => {
    if (!batchLineKey) {
      return;
    }
    if (batchLineFetchKeyRef.current === batchLineKey) {
      return;
    }

    batchLineFetchKeyRef.current = batchLineKey;

    getBatchLines(province, subjectType)
      .then((data) => {
        setCachedBatchLines(data);
      })
      .catch(() => {
        setCachedBatchLines(null);
      });
  }, [batchLineKey, province, subjectType, setCachedBatchLines]);

  const rankData = serverRankData ?? fallbackRankData;

  const specialControlLine = useMemo(() => {
    if (!cachedBatchLines || cachedBatchLines.lines.length === 0) return null;
    return cachedBatchLines.lines.find((line) => line.batch === '特控')?.score ?? null;
  }, [cachedBatchLines]);

  const handleNext = () => {
    const s = Number(score);
    if (s > 0 && rankData) {
      setScore(s, rankData.rank, rankData.sameScore, rankData.range);
      navigate('/step3');
    }
  };

  const overLineInfo = useMemo(() => {
    const s = Number(score);
    if (!s) return { value: 0, text: '' };
    if (specialControlLine == null) {
      return { value: 0, text: '暂无比次线数据' };
    }
    const diff = Math.max(0, s - specialControlLine);
    return { value: diff, text: `超过特控线 ${diff}分` };
  }, [score, specialControlLine]);

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <ProgressBar current={2} />
        <SectionTitle title="高考分数" subtitle="Step 2 / 5 — 输入总分，自动查询位次" />

        <Card className="mb-4" index={0}>
          <div className="text-center mb-6">
            <label className="block text-sm font-medium leading-relaxed mb-3" style={{ color: C.textSecondary }}>
              总分
            </label>
            <div className="relative">
              <input
                type="number"
                value={score}
                onChange={(e) => setScoreInput(e.target.value)}
                className="w-full text-center text-5xl font-bold tracking-tight py-4 bg-transparent border-b-2 border-[#C04A1A] focus:outline-none focus:border-[#C04A1A] transition-all duration-200"
                style={{ color: C.primary, borderColor: C.primary }}
                max={provinceConfig.maxScore}
                min={0}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm leading-relaxed" style={{ color: C.textMuted }}>
                / {provinceConfig.maxScore}
              </span>
            </div>
          </div>

          {rankData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="p-5 rounded-2xl mb-4"
              style={{ backgroundColor: C.sageBg }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: C.sage }} />
                  <span className="font-medium text-sm leading-relaxed" style={{ color: C.sage }}>
                    位次查询成功
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: rankData.confidence === 'exact' ? C.sageBg : C.warnBg,
                    color: rankData.confidence === 'exact' ? C.sage : C.warn,
                  }}
                >
                  {rankData.confidence === 'exact' ? '精确' : '估算'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: C.sage }}>
                    <AnimatedNumber value={rankData.rank} duration={800} />
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>名</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: C.sage }}>
                    <AnimatedNumber value={rankData.sameScore} duration={800} />
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>同分</div>
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight" style={{ color: C.sage }}>
                    {rankData.range[0].toLocaleString()}-{rankData.range[1].toLocaleString()}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>位次区间</div>
                </div>
              </div>
            </motion.div>
          )}

          {rankLoading && (
            <div className="text-center text-xs leading-relaxed mb-3" style={{ color: C.textMuted }}>
              正在查询服务端位次...
            </div>
          )}

          {(overLineInfo.value > 0 || overLineInfo.text) && (
            <div className="text-center text-sm leading-relaxed" style={{ color: C.sage }}>
              {overLineInfo.value > 0 ? (
                <>超过特控线 <strong>{overLineInfo.value}分</strong></>
              ) : (
                <>{overLineInfo.text}</>
              )}
            </div>
          )}
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/step1')}>
              <ChevronLeft className="w-5 h-5" />
              上一步
            </Button>
            <Button
              className="flex-1"
              disabled={!rankData}
              onClick={handleNext}
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 4. Step3: Data Confirmation
// ========================
export const Step3Confirm: React.FC = () => {
  const navigate = useNavigate();
  const {
    province, mode, primarySubject, secondarySubjects, totalScore, rank,
    sameScoreCount, rankRange, cachedBatchLines, setCachedBatchLines,
  } = useGaokaoStore();

  const [batchLinesLoading, setBatchLinesLoading] = useState(false);

  const subjectType = useMemo(
    () => getSubjectTypeForApi(province, mode, primarySubject),
    [province, mode, primarySubject]
  );

  const batchLineKey = useMemo(() => {
    if (!subjectType) return '';
    return `${province}|${subjectType}`;
  }, [province, subjectType]);
  const batchLineFetchKeyRef = useRef<string>(
    cachedBatchLines && cachedBatchLines.province === province && cachedBatchLines.subjectType === subjectType
      ? batchLineKey
      : ''
  );

  useEffect(() => {
    if (!batchLineKey) {
      return;
    }

    // 使用 ref 避免缓存状态变化导致 effect 重跑，同时保证同一组合只请求一次
    if (batchLineFetchKeyRef.current === batchLineKey) {
      return;
    }

    batchLineFetchKeyRef.current = batchLineKey;
    setBatchLinesLoading(true);

    getBatchLines(province, subjectType)
      .then((data) => {
        setCachedBatchLines(data);
      })
      .catch(() => {
        setCachedBatchLines(null);
      })
      .finally(() => {
        setBatchLinesLoading(false);
      });
  }, [batchLineKey, province, subjectType, setCachedBatchLines]);

  const batchLineText = useMemo(() => {
    if (batchLinesLoading) {
      return '正在查询批次线...';
    }
    if (!cachedBatchLines || cachedBatchLines.lines.length === 0) {
      return '暂无批次线数据';
    }
    return cachedBatchLines.lines
      .map((line) => `${line.label} ${line.score}分`)
      .join(' / ');
  }, [cachedBatchLines, batchLinesLoading]);

  const infoItems = [
    { label: '省份', value: province },
    { label: '高考模式', value: mode },
    { label: '选科组合', value: `${primarySubject} + ${secondarySubjects.join('/')}` },
    { label: '总分', value: `${totalScore}分`, highlight: true },
    { label: '位次', value: `${rank.toLocaleString()}名`, highlight: true },
    { label: '同分人数', value: `${sameScoreCount}人` },
    { label: '位次区间', value: `${rankRange[0].toLocaleString()}-${rankRange[1].toLocaleString()}` },
    { label: '批次线', value: batchLineText },
  ];

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <ProgressBar current={3} />
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-6 h-6" style={{ color: C.primary }} />
          <h2 className="text-xl font-semibold tracking-tight leading-tight" style={{ color: C.text }}>请确认您的信息</h2>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: C.textMuted }}>
          确认无误后，我们将为您生成推荐方案
        </p>

        <Card className="mb-6" index={0}>
          <div className="space-y-4">
            {infoItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
                className="flex justify-between items-center py-2 border-b border-dashed last:border-0"
                style={{ borderColor: C.border }}
              >
                <span className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{item.label}</span>
                <span className={`text-sm font-medium leading-relaxed ${item.highlight ? 'text-xl' : ''}`} style={{ color: item.highlight ? C.primary : C.text }}>
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/step1')}>
              <ChevronLeft className="w-5 h-5" />
              返回修改
            </Button>
            <Button className="flex-1" onClick={() => navigate('/step4')}>
              信息无误，继续
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 5. Step4: Preferences
// ========================
export const Step4Preference: React.FC = () => {
  const navigate = useNavigate();
  const {
    collegeLevel, preferredCities, distancePref, disciplines, careerOrientation, selectedMajor, specialIdentities,
    setPreferences, toggleSpecialIdentity,
  } = useGaokaoStore();

  const [tabIndex, setTabIndex] = useState(0);
  const [majorSearch, setMajorSearch] = useState(selectedMajor);
  const tabs = ['院校&地域', '专业&方向', '特殊身份'];

  const toggleCity = (city: string) => {
    const current = preferredCities;
    if (current.includes(city)) {
      setPreferences({ preferredCities: current.filter((c) => c !== city) });
    } else {
      setPreferences({ preferredCities: [...current, city] });
    }
  };

  const toggleDiscipline = (d: string) => {
    const current = disciplines;
    if (current.includes(d)) {
      setPreferences({ disciplines: current.filter((x) => x !== d) });
    } else {
      setPreferences({ disciplines: [...current, d] });
    }
  };

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <ProgressBar current={4} />
        <SectionTitle title="意向偏好" subtitle="Step 4 / 5 — 可选，可跳过" />

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-2xl bg-white border" style={{ borderColor: C.border }}>
          {tabs.map((tab, i) => (
            <motion.button
              key={tab}
              onClick={() => setTabIndex(i)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                i === tabIndex ? 'text-white' : 'text-[#4A4A4A] hover:text-[#2A2A2A]'
              }`}
              style={i === tabIndex ? { backgroundColor: C.primary, color: '#fff' } : {}}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <Card index={0}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tabIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tabIndex === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      院校层次
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLLEGE_LEVELS.map((level) => (
                        <Pill
                          key={level}
                          label={level}
                          active={collegeLevel === level}
                          onClick={() => setPreferences({ collegeLevel: level })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      期望城市
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map((city) => (
                        <Pill
                          key={city}
                          label={city}
                          active={preferredCities.includes(city)}
                          onClick={() => toggleCity(city)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      距离偏好
                    </label>
                    <div className="flex gap-2">
                      {DISTANCE_PREFS.map((pref) => (
                        <Pill
                          key={pref}
                          label={pref}
                          active={distancePref === pref}
                          onClick={() => setPreferences({ distancePref: pref })}
                          className="flex-1"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tabIndex === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      学科大类
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DISCIPLINES.map((d) => (
                        <Pill
                          key={d}
                          label={d}
                          active={disciplines.includes(d)}
                          onClick={() => toggleDiscipline(d)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      具体专业
                    </label>
                    <input
                      type="text"
                      value={majorSearch}
                      onChange={(e) => {
                        setMajorSearch(e.target.value);
                        setPreferences({ selectedMajor: e.target.value });
                      }}
                      placeholder="搜索专业名称..."
                      className="w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      style={{ borderColor: C.border }}
                    />
                    <div className="mt-3">
                      <span className="text-xs font-medium mb-2 block leading-relaxed" style={{ color: C.textMuted }}>热门专业</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {POPULAR_MAJORS.map((major) => (
                          <Pill
                            key={major}
                            label={major}
                            active={selectedMajor === major}
                            onClick={() => {
                              setMajorSearch(major);
                              setPreferences({ selectedMajor: major });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-relaxed mb-2" style={{ color: C.textSecondary }}>
                      职业导向
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CAREER_ORIENTATIONS.map((o) => (
                        <Pill
                          key={o}
                          label={o}
                          active={careerOrientation === o}
                          onClick={() => setPreferences({ careerOrientation: o })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tabIndex === 2 && (
                <div className="space-y-3">
                  {SPECIAL_IDENTITIES.map((identity) => {
                    const isSelected = specialIdentities.includes(identity.id);
                    return (
                      <Card
                        key={identity.id}
                        noPadding
                        className="p-4 flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleSpecialIdentity(identity.id)}
                        style={{ borderColor: isSelected ? C.primary : C.border }}
                        animated={false}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isSelected ? C.primaryBg : C.bg }}>
                          <Shield className="w-5 h-5" style={{ color: isSelected ? C.primary : C.textMuted }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-relaxed" style={{ color: C.text }}>{identity.label}</div>
                          <div className="text-xs truncate leading-relaxed" style={{ color: C.textMuted }}>{identity.desc}</div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: isSelected ? C.primary : C.border }}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.primary }} />}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/step3')}>
              <ChevronLeft className="w-5 h-5" />
              上一步
            </Button>
            <Button variant="ghost" className="shrink-0 px-3" onClick={() => navigate('/step5')}>
              跳过
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/step5')}
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 6. Step5: Weight Adjustment
// ========================
export const Step5Weight: React.FC = () => {
  const navigate = useNavigate();
  const { weights, totalScore, setWeights } = useGaokaoStore();
  const [localWeights, setLocalWeights] = useState<number[]>([...weights]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const LOADING_TEXTS = [
    '正在分析您的位次数据...',
    '正在匹配院校库...',
    '正在计算录取概率...',
    '正在优化梯度分布...',
  ];

  useEffect(() => {
    setLocalWeights([...weights]);
  }, [weights]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...localWeights];
    const oldValue = newWeights[index];
    const delta = value - oldValue;

    const otherIndices = [0, 1, 2].filter((i) => i !== index);
    const otherSum = otherIndices.reduce((sum, i) => sum + newWeights[i], 0);

    if (otherSum > 0) {
      otherIndices.forEach((i) => {
        const ratio = newWeights[i] / otherSum;
        newWeights[i] = Math.max(0, Math.min(100, newWeights[i] - delta * ratio));
      });
    }

    newWeights[index] = value;

    const sum = newWeights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      const normalized = newWeights.map((w) => Math.round((w / sum) * 100));
      const normSum = normalized.reduce((a, b) => a + b, 0);
      if (normSum !== 100) {
        const maxIndex = normalized.indexOf(Math.max(...normalized));
        normalized[maxIndex] += 100 - normSum;
      }
      setLocalWeights(normalized);
    }
  };

  const handleAutoSelect = () => {
    let newWeights: [number, number, number];
    if (totalScore >= 600) {
      newWeights = [40, 30, 30];
    } else if (totalScore >= 530) {
      newWeights = [30, 40, 30];
    } else {
      newWeights = [30, 30, 40];
    }
    setLocalWeights([...newWeights]);
    setWeights(newWeights);
  };

  const handleConfirm = () => {
    setWeights([localWeights[0], localWeights[1], localWeights[2]]);
    setIsGenerating(true);
    setTimeout(() => {
      navigate('/results');
    }, 2500);
  };

  const weightLabels = ['院校', '地域', '专业'];
  const weightColors = [C.primary, C.navy, C.sage];

  const previewCards = [
    { college: '华南理工大学', prob: '15-25%', level: '985' },
    { college: '暨南大学', prob: '45-55%', level: '211' },
    { college: '深圳大学', prob: '55-65%', level: '公办一本' },
  ];

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <ProgressBar current={5} />
        <SectionTitle title="权重调节" subtitle="Step 5 / 5 — 拖动调节优先级" />

        <div className="flex justify-end mb-4">
          <motion.button
            onClick={handleAutoSelect}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl transition-colors duration-200"
            style={{ color: C.primary, backgroundColor: C.primaryBg }}
          >
            <Sparkles className="w-4 h-4" />
            我不确定，帮我选
          </motion.button>
        </div>

        <Card className="mb-4" index={0}>
          <RadarChart values={[localWeights[0], localWeights[1], localWeights[2]]} size={220} />
        </Card>

        <Card className="mb-4" index={1}>
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium leading-relaxed" style={{ color: C.textSecondary }}>
                    {weightLabels[i]}
                  </span>
                  <motion.span
                    key={localWeights[i]}
                    className="text-sm font-bold tracking-tight inline-block"
                    style={{ color: weightColors[i] }}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {localWeights[i]}%
                  </motion.span>
                </div>
                <MotionSlider
                  value={localWeights[i]}
                  onChange={(val) => handleWeightChange(i, val)}
                  color={weightColors[i]}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="mb-4">
          <h3 className="text-sm font-medium leading-relaxed mb-3" style={{ color: C.textSecondary }}>
            推荐预览
          </h3>
          <div className="space-y-3">
            {previewCards.map((card, index) => (
              <Card key={card.college} noPadding className="p-4" index={index}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm leading-relaxed" style={{ color: C.text }}>{card.college}</div>
                    <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                      录取概率 {card.prob}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: C.primaryBg, color: C.primary }}
                  >
                    {card.level}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/step4')}>
              <ChevronLeft className="w-5 h-5" />
              上一步
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              生成推荐方案
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        >
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16" style={{ color: C.primary }} />
          </motion.div>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2" style={{ color: C.text }}>AI正在生成推荐方案...</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingTextIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-sm leading-relaxed mb-6"
              style={{ color: C.textSecondary }}
            >
              {LOADING_TEXTS[loadingTextIndex]}
            </motion.p>
          </AnimatePresence>
          <div className="w-48 h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: C.primary }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatedPage>
  );
};

// ========================
// 7. Results Page
// ========================
export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    province,
    totalScore,
    rank,
    weights,
    primarySubject,
    secondarySubjects,
    collegeLevel,
    preferredCities,
    disciplines,
    selectedMajor,
    setLastRecommendations,
  } = useGaokaoStore();
  const [filter, setFilter] = useState('全部');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filters = ['全部', '冲', '稳', '保', '垫'];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getRecommendations({
      province,
      score: totalScore,
      rank,
      weights,
      subjects: primarySubject ? [primarySubject, ...secondarySubjects] : undefined,
      preferences: {
        collegeLevel,
        preferredCities,
        disciplines,
        selectedMajor,
      },
    })
      .then((data) => {
        if (!cancelled) {
          setRecommendations(data);
          setLastRecommendations(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '获取推荐方案失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [province, totalScore, rank, weights, primarySubject, secondarySubjects, collegeLevel, preferredCities, disciplines, selectedMajor, setLastRecommendations]);

  const filtered = useMemo(() => {
    if (filter === '全部') return recommendations;
    return recommendations.filter((r) => r.tier === filter);
  }, [filter, recommendations]);

  const tierCounts = useMemo(() => ({
    冲: recommendations.filter((r) => r.tier === '冲').length,
    稳: recommendations.filter((r) => r.tier === '稳').length,
    保: recommendations.filter((r) => r.tier === '保').length,
    垫: recommendations.filter((r) => r.tier === '垫').length,
  }), [recommendations]);

  const tierConfig: Record<string, { color: string; bg: string; range: string }> = {
    冲: { color: C.danger, bg: C.dangerBg, range: '15-35%' },
    稳: { color: C.warn, bg: C.warnBg, range: '35-65%' },
    保: { color: C.sage, bg: C.sageBg, range: '65-85%' },
    垫: { color: C.info, bg: C.infoBg, range: '85%+' },
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" style={{ color: C.danger }} />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" style={{ color: C.sage }} />;
    return <Minus className="w-4 h-4" style={{ color: C.textMuted }} />;
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-[#E8E0D6] mx-auto mb-4"
            style={{ borderTopColor: C.primary }}
          />
          <h3 className="text-lg font-bold tracking-tight leading-tight mb-1" style={{ color: C.text }}>正在加载推荐方案...</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>请稍候，数据正在从服务端赶来</p>
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: C.dangerBg }}>
            <AlertTriangle className="w-6 h-6" style={{ color: C.danger }} />
          </div>
          <h3 className="text-lg font-bold tracking-tight leading-tight mb-1" style={{ color: C.text }}>加载失败</h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: C.textMuted }}>{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold tracking-tight leading-tight" style={{ color: C.text }}>推荐方案</h2>
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: C.primaryBg, color: C.primary }}
          >
            均衡型
          </span>
        </div>

        <Card className="mb-4" index={0}>
          <div className="flex gap-4 text-center">
            <div className="flex-1">
              <div className="text-2xl font-bold tracking-tight" style={{ color: C.primary }}>
                <AnimatedNumber value={totalScore} duration={800} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>总分</div>
            </div>
            <div className="w-px bg-[#D8D0C6]" />
            <div className="flex-1">
              <div className="text-2xl font-bold tracking-tight" style={{ color: C.primary }}>
                <AnimatedNumber value={rank} duration={800} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>位次</div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filters.map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                f === filter ? 'text-white' : 'bg-white border text-[#4A4A4A]'
              }`}
              style={f === filter ? { backgroundColor: C.primary, color: '#fff' } : { borderColor: C.border }}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Tier Overview */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(tierCounts).map(([tier, count]) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: ['冲', '稳', '保', '垫'].indexOf(tier) * 0.05 }}
              className="p-3 rounded-2xl text-center"
              style={{ backgroundColor: tierConfig[tier].bg }}
            >
              <div className="text-xs font-medium leading-relaxed" style={{ color: tierConfig[tier].color }}>{tier}</div>
              <div className="text-xs leading-relaxed" style={{ color: tierConfig[tier].color }}>{tierConfig[tier].range}</div>
              <div className="text-lg font-bold tracking-tight" style={{ color: tierConfig[tier].color }}>{count}</div>
            </motion.div>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-3 mb-4">
          {filtered.map((item, index) => {
            const tierLabelMap: Record<string, string> = {
              冲: '🔴 冲刺',
              稳: '🟠 稳',
              保: '🟢 保',
              垫: '垫',
            };
            const tierLabel = tierLabelMap[item.tier] ?? item.tier;
            const minScore = item.scores.length > 0
              ? Math.min(...item.scores.map((s) => s.score))
              : null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                className="rounded-2xl"
              >
                <Card noPadding className="p-5" animated={false}>
                  {/* Tier label */}
                  <div className="mb-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: tierConfig[item.tier]?.bg ?? C.primaryBg, color: tierConfig[item.tier]?.color ?? C.primary }}
                    >
                      {tierLabel}
                    </span>
                  </div>

                  {/* College + City */}
                  <div className="font-bold text-base leading-tight mb-1" style={{ color: C.text }}>
                    {item.college}
                    {item.city ? <span style={{ color: C.textSecondary, fontWeight: 400 }}> · {item.city}</span> : null}
                  </div>

                  {/* Major + MajorGroup */}
                  {(item.major || item.majorGroup) && (
                    <div className="text-sm leading-relaxed mb-3" style={{ color: C.textSecondary }}>
                      {item.major}
                      {item.majorGroup ? `（${item.majorGroup}）` : ''}
                    </div>
                  )}

                  {/* Separator */}
                  <div className="border-t mb-3" style={{ borderColor: C.border }} />

                  {/* Historical min score */}
                  {minScore != null && (
                    <div className="flex items-center gap-2 text-xs leading-relaxed mb-2" style={{ color: C.textMuted }}>
                      <span>往年最低: {minScore}分</span>
                      {getTrendIcon(item.trend)}
                    </div>
                  )}

                  {/* Plan count + Tuition */}
                  {(item.planCount != null || item.tuition != null) && (
                    <div className="flex gap-2 text-xs leading-relaxed mb-2" style={{ color: C.textMuted }}>
                      {item.planCount != null && <span>招生: {item.planCount}人</span>}
                      {item.planCount != null && item.tuition != null && <span>·</span>}
                      {item.tuition != null && <span>学费: ¥{item.tuition.toLocaleString()}/年</span>}
                    </div>
                  )}

                  {/* Reason */}
                  {item.reason && (
                    <div className="text-xs italic leading-relaxed mb-3" style={{ color: C.textMuted }}>
                      📝 {item.reason}
                    </div>
                  )}

                  {/* Probability + Purity (kept from original) */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1 leading-relaxed">
                        <span style={{ color: C.textMuted }}>录取概率</span>
                        <span className="font-medium" style={{ color: C.primary }}>{item.probability}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E8E0D6] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: C.primary }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.probability}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>纯净度</div>
                      <div className="text-sm font-medium leading-relaxed" style={{ color: C.sage }}>{item.purity}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl text-center text-sm leading-relaxed mb-4" style={{ backgroundColor: C.warnBg, color: C.warn }}>
          已为您注入2个冷门优质替代方案
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/step5')}>
              <ChevronLeft className="w-5 h-5" />
              返回
            </Button>
            <Button className="flex-1" onClick={() => navigate('/risk')}>
              风险诊断
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

// ========================
// 8. Risk Report Page
// ========================
export const RiskReportPage: React.FC = () => {
  const navigate = useNavigate();
  const healthScore = 82;
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    province,
    totalScore,
    rank,
    weights,
    primarySubject,
    secondarySubjects,
    collegeLevel,
    preferredCities,
    disciplines,
    selectedMajor,
    lastRecommendations,
  } = useGaokaoStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const request = {
      province,
      score: totalScore,
      rank,
      weights,
      subjects: primarySubject ? [primarySubject, ...secondarySubjects] : undefined,
      preferences: {
        collegeLevel,
        preferredCities,
        disciplines,
        selectedMajor,
      },
    };

    const riskPromise =
      lastRecommendations.length > 0
        ? getRiskItemsByRecommendations(request, lastRecommendations)
        : getRiskItems();

    riskPromise
      .then((data) => {
        if (!cancelled) setRiskItems(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '获取风险诊断失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [province, totalScore, rank, weights, primarySubject, secondarySubjects, collegeLevel, preferredCities, disciplines, selectedMajor, lastRecommendations]);

  const statusConfig = {
    pass: { icon: FileCheck, color: C.sage },
    warn: { icon: AlertTriangle, color: C.warn },
    danger: { icon: AlertTriangle, color: C.danger },
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-[#E8E0D6] mx-auto mb-4"
            style={{ borderTopColor: C.primary }}
          />
          <h3 className="text-lg font-bold tracking-tight leading-tight mb-1" style={{ color: C.text }}>正在分析风险...</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>请稍候，数据正在从服务端赶来</p>
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: C.dangerBg }}>
            <AlertTriangle className="w-6 h-6" style={{ color: C.danger }} />
          </div>
          <h3 className="text-lg font-bold tracking-tight leading-tight mb-1" style={{ color: C.text }}>加载失败</h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: C.textMuted }}>{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <h2 className="text-xl font-semibold tracking-tight leading-tight mb-1" style={{ color: C.text }}>风险诊断</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: C.textMuted }}>
          全面检查您的志愿方案，规避潜在风险
        </p>

        <Card className="mb-6 text-center py-8" style={{ backgroundColor: C.navy }} index={0}>
          <div className="text-sm text-white/70 mb-2 leading-relaxed">健康度评分</div>
          <div className="flex justify-center mb-2">
            <ScoreRing score={healthScore} size={140} />
          </div>
          <div className="text-white/70 text-sm leading-relaxed">
            {healthScore >= 80 ? '方案健康，放心填报' : healthScore >= 60 ? '方案基本合理，建议优化' : '存在风险，建议调整'}
          </div>
        </Card>

        <div className="space-y-3 mb-4">
          {riskItems.map((item, index) => {
            const StatusIcon = statusConfig[item.status].icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
              >
                <Card noPadding className="p-5" animated={false}>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: item.status === 'pass' ? C.sageBg : item.status === 'warn' ? C.warnBg : C.dangerBg }}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                    >
                      <StatusIcon className="w-5 h-5" style={{ color: statusConfig[item.status].color }} />
                    </motion.div>
                    <div className="flex-1">
                      <div className="font-medium text-sm leading-relaxed" style={{ color: C.text }}>{item.name}</div>
                      <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{item.detail}</div>
                    </div>
                    <StatusBadge status={item.status} label={item.status === 'pass' ? '通过' : item.status === 'warn' ? '警告' : '风险'} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        >
          <Card className="mb-4" style={{ backgroundColor: C.warnBg }} index={0}>
            <div className="flex items-start gap-3">
              <Compass className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: C.warn }} />
              <div>
                <div className="font-medium text-sm mb-1 leading-relaxed" style={{ color: C.warn }}>优化建议</div>
                <ul className="text-sm space-y-1 leading-relaxed" style={{ color: C.textSecondary }}>
                  <li>华南理工大学计算机专业竞争激烈，建议增加备选</li>
                  <li>2个志愿纯净度低于75%，建议关注专业调剂风险</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F0E8] via-[#F7F0E8] to-transparent safe-bottom">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" className="shrink-0 px-3" onClick={() => navigate('/results')}>
              <ChevronLeft className="w-5 h-5" />
              返回
            </Button>
            <Button className="flex-1" onClick={() => alert('导出功能开发中')}>
              <Download className="w-5 h-5" />
              导出志愿表
            </Button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};
