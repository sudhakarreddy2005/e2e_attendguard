import React, { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'warning' | 'danger' | 'purple' | 'slate';
  isLoading?: boolean;
}

/** Animated counter hook: counts from 0 to target */
function useCountUp(target: number, duration: number = 800, enabled: boolean = true): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setCount(target);
      return;
    }

    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, enabled]);

  return count;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  trend = 'up',
  icon: Icon,
  color = 'blue',
  isLoading = false,
}) => {
  const numericValue = typeof value === 'number' ? value : NaN;
  const animated = useCountUp(
    isNaN(numericValue) ? 0 : numericValue,
    800,
    !isNaN(numericValue) && !isLoading
  );

  const displayValue = isLoading
    ? null
    : typeof value === 'string'
    ? value
    : animated;

  const colorMap = {
    blue: 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border-[#007AFF]/30',
    green: 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30',
    warning: 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
    danger: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30',
    purple: 'bg-[#BF5AF2]/15 text-[#BF5AF2] border-[#BF5AF2]/30',
    slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  };

  if (isLoading) {
    return <Skeleton variant="card" />;
  }

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-5 rounded-[22px] cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Header: Title + Icon Bubble */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border backdrop-blur-md transition-transform group-hover:scale-105 duration-200 ${colorMap[color]}`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {/* Metric & Trend */}
      <div className="flex items-baseline justify-between relative z-10">
        <span className="text-2xl font-bold text-slate-700 dark:text-slate-200 tracking-tight counter-animate">
          {displayValue}
        </span>

        {change && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md ${
              trend === 'up'
                ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                : trend === 'down'
                ? 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30'
                : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-white/30'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" strokeWidth={2} />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" strokeWidth={2} />}
            {change}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate relative z-10">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
