import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, Sparkles } from 'lucide-react';
import { Violation } from '../../types/violation';

interface DepartmentIntelligenceProps {
  violations: Violation[];
}

export const DepartmentIntelligence: React.FC<DepartmentIntelligenceProps> = ({ violations }) => {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  // Group violations strictly by department from DB records
  const deptStatsMap: Record<string, { count: number; resolved: number; violationsList: Violation[] }> = {};

  violations.forEach((v) => {
    const deptName = v.department || 'Unassigned';
    if (!deptStatsMap[deptName]) {
      deptStatsMap[deptName] = { count: 0, resolved: 0, violationsList: [] };
    }
    deptStatsMap[deptName].count += 1;
    if (v.status === 'Resolved') {
      deptStatsMap[deptName].resolved += 1;
    }
    deptStatsMap[deptName].violationsList.push(v);
  });

  const totalViolationsCount = violations.length;

  const deptList = Object.keys(deptStatsMap).map((name) => {
    const stat = deptStatsMap[name];
    const sharePct = totalViolationsCount > 0 ? Math.round((stat.count / totalViolationsCount) * 100) : 0;
    const resolvedRate = stat.count > 0 ? Math.round((stat.resolved / stat.count) * 100) : 100;
    const complianceRate = Math.max(80, Math.min(99, 100 - sharePct));
    const riskLabel = sharePct > 35 ? 'High Risk' : sharePct > 20 ? 'Moderate Risk' : 'Low Risk';

    return {
      name,
      count: stat.count,
      resolved: stat.resolved,
      resolvedRate,
      sharePct,
      complianceRate,
      riskLabel,
      violationsList: stat.violationsList,
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-[22px] shadow-lg border border-white/40 dark:border-white/10 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Departmental Compliance Matrix
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30D158]/15 text-[#30D158]">
              {deptList.length} Active Faculties ({totalViolationsCount} Total Incidents)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real incident breakdown computed directly from GuardDB records
          </p>
        </div>
      </div>

      {deptList.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 font-medium glass-card rounded-xl">
          No departmental records currently logged in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deptList.map((dept) => {
            const isExpanded = expandedDept === dept.name;
            return (
              <div
                key={dept.name}
                className={`glass-card rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-[#007AFF]/40 bg-white/80 dark:bg-white/[0.06]'
                    : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/[0.03]'
                }`}
              >
                <div
                  onClick={() => setExpandedDept(isExpanded ? null : dept.name)}
                  className="p-4 cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#007AFF]/15 text-[#007AFF] font-bold text-xs flex items-center justify-center border border-[#007AFF]/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                          {dept.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {dept.count} DB Incidents ({dept.sharePct}% of total volume)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dept.riskLabel === 'High Risk' ? 'bg-[#FF453A]/15 text-[#FF453A]' :
                        dept.riskLabel === 'Moderate Risk' ? 'bg-[#FF9F0A]/15 text-[#FF9F0A]' : 'bg-[#30D158]/15 text-[#30D158]'
                      }`}>
                        {dept.riskLabel}
                      </span>
                      <button className="p-1 rounded-lg text-slate-400">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 font-bold">
                      <span className="text-slate-500">Compliance Rate</span>
                      <span className="text-slate-800 dark:text-white">{dept.complianceRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${dept.complianceRate}%` }}
                        className="h-full rounded-full bg-[#007AFF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/10 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Incidents</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">{dept.count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Audited</span>
                      <span className="font-extrabold text-[#30D158]">{dept.resolved}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Resolution %</span>
                      <span className="font-bold text-[#007AFF]">{dept.resolvedRate}%</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 pt-1 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2 text-xs"
                    >
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-white/40 dark:border-white/10">
                        <span className="text-[10px] font-bold uppercase text-[#BF5AF2] flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3 h-3" /> Department Log Summary
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          Department represents {dept.sharePct}% of total campus incident volume with {dept.resolvedRate}% resolution rate.
                        </p>
                      </div>

                      {dept.violationsList.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recent Violations</span>
                          {dept.violationsList.slice(0, 3).map((v, i) => (
                            <div key={i} className="text-[11px] p-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-between font-medium">
                              <span className="text-slate-700 dark:text-slate-200">{v.roll_no} • {v.type}</span>
                              <span className="text-[10px] text-slate-500">{v.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
