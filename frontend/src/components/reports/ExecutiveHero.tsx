import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ExecutiveHeroProps {
  totalViolations: number;
  totalStudents: number;
  healthScore: number;
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  resolvedRate: number;
  isLoading?: boolean;
}

export const ExecutiveHero: React.FC<ExecutiveHeroProps> = ({
  totalViolations,
  totalStudents,
  healthScore,
  riskLevel,
  resolvedRate,
  isLoading = false,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getRiskBadgeColor = (risk: string) => {
    if (risk === 'Low Risk') return 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30';
    if (risk === 'Moderate Risk') return 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30';
    return 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-5 sm:p-7 rounded-[22px] relative overflow-hidden border border-white/40 dark:border-white/10 shadow-lg"
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border border-[#007AFF]/30 font-bold">
              Institutional Intelligence Audit
            </span>
            <span>• {currentDate}</span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Executive Compliance & Safety Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-1 max-w-xl leading-relaxed">
              Real-time attendance analytics, biometric audit records, and automated administrative intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-[#30D158] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{resolvedRate}% Audit Resolution</span>
            </span>
            <span>•</span>
            <span>{totalViolations} Total Violations Logged</span>
          </div>
        </div>

        {/* Right Column: Campus Health Ring */}
        <div className="flex items-center gap-4 bg-white/40 dark:bg-white/[0.04] p-4 rounded-2xl border border-white/40 dark:border-white/10 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#007AFF"
                strokeWidth="8"
                strokeDasharray="251.3"
                initial={{ strokeDashoffset: 251.3 }}
                animate={{ strokeDashoffset: 251.3 * (1 - healthScore / 100) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-slate-800 dark:text-white">
                {isLoading ? '—' : `${healthScore}%`}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Campus Health</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRiskBadgeColor(riskLevel)}`}>
              {riskLevel}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">{totalStudents} Active Students</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
