import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

// ========================
// Color Constants
// ========================
export const C = {
  bg: '#F7F0E8',
  primary: '#C04A1A',
  primaryLight: '#D4764A',
  primaryBg: '#F5E6DD',
  navy: '#1A2B4A',
  navyLight: '#2E4568',
  sage: '#5A7D5A',
  sageBg: '#E8F0E8',
  text: '#2A2A2A',
  textSecondary: '#4A4A4A',
  textMuted: '#7A7A7A',
  border: '#D8D0C6',
  card: '#FFFFFF',
  danger: '#B84040',
  dangerBg: '#F8E8E8',
  warn: '#C08020',
  warnBg: '#F8F0E0',
  info: '#2E6B9A',
  infoBg: '#E8F0F8',
};

// ========================
// Card Component
// ========================
interface CardProps {
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  index?: number;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, noPadding = false, className = '', onClick, style, index = 0, animated = true }) => {
  const cardContent = (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-[${C.border}]
        shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]
        hover:-translate-y-[1px]
        transition-all duration-300 ease-out
        ${noPadding ? '' : 'p-5'}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      style={{ borderColor: C.border, ...style }}
    >
      {children}
    </div>
  );

  if (!animated) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
      className="contents"
    >
      {cardContent}
    </motion.div>
  );
};

// ========================
// Button Component
// ========================
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
}) => {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const colorMap: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(180deg, ${C.primaryLight} 0%, ${C.primary} 100%)`,
      color: '#fff',
    },
    secondary: { backgroundColor: '#fff', color: C.text, borderColor: C.border },
    danger: { backgroundColor: C.danger, color: '#fff' },
    ghost: { backgroundColor: 'transparent', color: C.textMuted },
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`
        rounded-xl font-medium flex items-center justify-center gap-2
        transition-all duration-200 ease-out
        ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        ...colorMap[variant],
        border: variant === 'secondary' ? `1px solid ${C.border}` : undefined,
      }}
    >
      {children}
    </motion.button>
  );
};

// ========================
// Pill Component
// ========================
interface PillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Pill: React.FC<PillProps> = ({ label, active = false, onClick, className = '' }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.15 }}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
        ${active
          ? 'text-white'
          : 'bg-white text-[#4A4A4A] border border-[#D8D0C6] hover:bg-gray-50 hover:border-[#C04A1A]'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={active ? { backgroundColor: C.primary, color: '#fff', borderColor: C.primary } : { borderColor: C.border }}
    >
      {label}
    </motion.button>
  );
};

// ========================
// ProgressBar Component
// ========================
interface ProgressBarProps {
  current: number;
  total?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total = 5 }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-2 px-1">
      {steps.map((step) => {
        const isCurrent = step === current;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className="h-2 w-full rounded-full overflow-hidden bg-[#E8E0D6]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: C.primary }}
                initial={false}
                animate={{ width: step <= current ? '100%' : '0%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </div>
            <motion.span
              className="text-xs"
              style={step <= current ? { color: C.primary } : { color: C.textMuted }}
              animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
            >
              {step}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
};

// ========================
// SectionTitle Component
// ========================
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      <motion.h2
        className="text-xl font-semibold tracking-tight leading-tight"
        style={{ color: C.text }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="text-sm text-muted font-normal leading-relaxed mt-1"
          style={{ color: C.textMuted }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

// ========================
// RadarChart Component (SVG with Motion)
// ========================
interface RadarChartProps {
  values: [number, number, number];
  labels?: [string, string, string];
  size?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  values,
  labels = ['院校', '地域', '专业'],
  size = 200,
  className = '',
}) => {
  const center = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / 3;
  const startAngle = -Math.PI / 2;

  const normalizedValues = values.map((v) => Math.max(0, Math.min(100, v)));

  const getPoint = (value: number, i: number) => {
    const angle = startAngle + i * angleStep;
    const r = (radius * value) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = normalizedValues.map((v, i) => getPoint(v, i));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Generate grid paths
  const gridPaths = [];
  for (let level = 1; level <= 5; level++) {
    const gridR = (radius * level) / 5;
    const gridPoints = [];
    for (let i = 0; i < 3; i++) {
      const angle = startAngle + i * angleStep;
      gridPoints.push({
        x: center + gridR * Math.cos(angle),
        y: center + gridR * Math.sin(angle),
      });
    }
    const d = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    gridPaths.push(d);
  }

  // Axis lines
  const axisLines = [];
  for (let i = 0; i < 3; i++) {
    const angle = startAngle + i * angleStep;
    axisLines.push({
      x1: center,
      y1: center,
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    });
  }

  // Label positions
  const labelPositions: { x: number; y: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = startAngle + i * angleStep;
    const labelR = radius + 20;
    labelPositions.push({
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
    });
  }

  return (
    <motion.svg
      width={size}
      height={size}
      className={`mx-auto ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#E8E0D6" strokeWidth={1} />
      ))}

      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#D8D0C6" strokeWidth={1} />
      ))}

      {/* Data polygon with animation */}
      <motion.path
        d={pathD}
        fill="rgba(192, 74, 26, 0.2)"
        stroke={C.primary}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={C.primary}
          whileHover={{ scale: 1.2 }}
          transition={{ duration: 0.2 }}
        />
      ))}

      {/* Labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={C.textSecondary}
          fontSize={12}
          fontFamily="'Geist', system-ui, sans-serif"
        >
          {label}
        </text>
      ))}
    </motion.svg>
  );
};

// ========================
// Input Field Component
// ========================
interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-[#4A4A4A] mb-2 transition-colors duration-200" style={{ color: C.textSecondary }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-[#D8D0C6] bg-white text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
          style={{ borderColor: C.border, color: C.text }}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#7A7A7A]" style={{ color: C.textMuted }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

// ========================
// Select Field Component
// ========================
interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-[#4A4A4A] mb-2 transition-colors duration-200 hover:text-[#C04A1A]" style={{ color: C.textSecondary }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[#D8D0C6] bg-white text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none cursor-pointer"
        style={{ borderColor: C.border, color: C.text }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ========================
// Score Ring Component (Canvas)
// ========================
interface ScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 120, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1000;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    const lineWidth = 8;

    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E8E0D6';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score arc
    const angle = (Math.PI * 2 * displayScore) / 100 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
    ctx.strokeStyle = displayScore >= 80 ? C.sage : displayScore >= 60 ? C.warn : C.danger;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score text
    ctx.font = `bold ${size * 0.28}px "Geist", system-ui, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${displayScore}`, centerX, centerY - 5);

    // Label
    ctx.font = `${size * 0.12}px "Geist", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('分', centerX, centerY + size * 0.18);
  }, [displayScore, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

// ========================
// Status Badge Component
// ========================
interface StatusBadgeProps {
  status: 'pass' | 'warn' | 'danger';
  label: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const config = {
    pass: { bg: C.sageBg, color: C.sage, dot: C.sage },
    warn: { bg: C.warnBg, color: C.warn, dot: C.warn },
    danger: { bg: C.dangerBg, color: C.danger, dot: C.danger },
  };
  const c = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {label}
    </span>
  );
};

// ========================
// AnimatedNumber Component
// ========================
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (n: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1200,
  className = '',
  style,
  format,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = format ? format(displayValue) : displayValue.toLocaleString();

  return (
    <motion.span
      className={className}
      style={style}
      key={value}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {formatted}
    </motion.span>
  );
};
