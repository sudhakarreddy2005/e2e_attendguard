import React from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Violation } from '../../types/violation';

interface IncidentKpiHeaderProps {
  violations: Violation[];
}

export const IncidentKpiHeader: React.FC<IncidentKpiHeaderProps> = ({ violations }) => {
  const pendingCount = violations.filter((v) =>
    ['Pending', 'Detected', 'Under Review'].includes(v.status)
  ).length;

  const verifiedCount = violations.filter((v) =>
    ['Verified', 'Action Taken', 'Resolved', 'Reviewed', 'Escalated'].includes(v.status)
  ).length;

  const dismissedCount = violations.filter((v) => v.status === 'Dismissed').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Total Incidents in Active Queue */}
      <div className="glass-panel p-4 rounded-[22px] border border-white/60 dark:border-white/10 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Total Incident Queue
          </span>
          <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-1 block">
            {violations.length}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-[#007AFF]/15 text-[#007AFF]">
          <ShieldAlert className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>

      {/* 2. Pending Verification */}
      <div className="glass-panel p-4 rounded-[22px] border border-white/60 dark:border-white/10 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF9F0A] block">
            Pending Review
          </span>
          <span className="text-xl font-extrabold text-[#FF9F0A] mt-1 block">
            {pendingCount}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-[#FF9F0A]/15 text-[#FF9F0A]">
          <Clock className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>

      {/* 3. Verified & Actioned */}
      <div className="glass-panel p-4 rounded-[22px] border border-white/60 dark:border-white/10 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#30D158] block">
            Verified Cases
          </span>
          <span className="text-xl font-extrabold text-[#30D158] mt-1 block">
            {verifiedCount}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-[#30D158]/15 text-[#30D158]">
          <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>

      {/* 4. Dismissed */}
      <div className="glass-panel p-4 rounded-[22px] border border-white/60 dark:border-white/10 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Dismissed (False Positives)
          </span>
          <span className="text-xl font-extrabold text-slate-600 dark:text-slate-300 mt-1 block">
            {dismissedCount}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-500/15 text-slate-400">
          <XCircle className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};
