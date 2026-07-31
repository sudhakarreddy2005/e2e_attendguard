import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, AlertTriangle, Cpu, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Violation } from '../../types/violation';

interface IncidentTimelineProps {
  violations: Violation[];
  isLoading?: boolean;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  violations,
  isLoading = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(5);

  // Sort real violations in strict chronological order (latest first)
  const sortedViolations = [...violations].sort((a, b) => {
    const timeA = new Date(a.created_at || a.iso_date || a.date || 0).getTime();
    const timeB = new Date(b.created_at || b.iso_date || b.date || 0).getTime();
    return timeB - timeA;
  });

  const visibleViolations = sortedViolations.slice(0, visibleCount);
  const hasMore = sortedViolations.length > visibleCount;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved') {
      return 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30';
    }
    if (s === 'escalated') {
      return 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30';
    }
    return 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30';
  };

  const formatTimestamp = (item: Violation) => {
    if (item.created_at || item.iso_date) {
      const d = new Date(item.created_at || item.iso_date || '');
      if (!isNaN(d.getTime())) {
        return (
          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) +
          ' • ' +
          d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
      }
    }
    return item.date || 'Recent';
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-[22px] shadow-lg border border-white/40 dark:border-white/10 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Incident Audit Timeline
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BF5AF2]/15 text-[#BF5AF2]">
              {sortedViolations.length} Chronological Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Biometric audit trail sorted in chronological sequence (latest first)
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-xl border border-[#007AFF]/20 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>MongoDB Live Ledger</span>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && sortedViolations.length === 0 && (
        <div className="p-6 text-center glass-card rounded-2xl border border-white/20">
          <CheckCircle2 className="w-8 h-8 text-[#30D158] mx-auto mb-2 opacity-80" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Violations Found</h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Database records indicate zero compliance violations matching current filter criteria.
          </p>
        </div>
      )}

      {/* Alternating Vertical Timeline Track */}
      {sortedViolations.length > 0 && (
        <div className="relative pt-2 pb-2">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#007AFF] via-[#BF5AF2] to-[#30D158] -translate-x-1/2 opacity-30" />

          <div className="space-y-6">
            {visibleViolations.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const formattedTime = formatTimestamp(item);

              return (
                <motion.div
                  key={item._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex flex-col md:flex-row items-start md:items-center"
                >
                  {/* Node Pulse Indicator */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-3 md:top-1/2 md:-translate-y-1/2 z-20">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-[#0F172A] border-2 border-[#007AFF] shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                    </div>
                  </div>

                  {/* Incident Card */}
                  <div className={`w-full md:w-1/2 pl-10 md:pl-0 ${isEven ? 'md:pr-8 md:text-right' : 'md:order-2 md:pl-8'}`}>
                    <div className="glass-card p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm bg-white/60 dark:bg-white/[0.04]">
                      <div className={`flex items-center justify-between gap-2 mb-1.5 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                        <span className="text-[11px] font-bold text-[#007AFF] dark:text-[#0A84FF] bg-[#007AFF]/15 px-2 py-0.5 rounded-full border border-[#007AFF]/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formattedTime}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                          {item.status || 'Pending'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.student_name ? `${item.student_name} • ` : ''}
                        <span className="text-slate-700 dark:text-slate-200">{item.roll_no}</span>
                      </h4>

                      <p className="text-xs font-semibold text-[#FF453A] mt-0.5 flex items-center gap-1 justify-start md:justify-start">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{item.type}</span>
                      </p>

                      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className={`flex items-center gap-1 ${isEven ? 'md:justify-end' : ''}`}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.location || 'Campus Gate'} • Dept: {item.department || 'N/A'}</span>
                        </div>
                        {item.remarks && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            "{item.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`hidden md:block w-1/2 ${isEven ? 'order-2' : 'order-1'}`} />
                </motion.div>
              );
            })}
          </div>

          {/* Show More / Show Less Button */}
          {sortedViolations.length > 5 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount(hasMore ? visibleCount + 5 : 5)}
                className="apple-btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                {hasMore ? (
                  <>
                    <span>Show More Incidents (+{sortedViolations.length - visibleCount} remaining)</span>
                    <ChevronDown className="w-4 h-4 text-[#007AFF]" />
                  </>
                ) : (
                  <>
                    <span>Show Less</span>
                    <ChevronUp className="w-4 h-4 text-[#007AFF]" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
