import React, { useState, useEffect } from 'react';
import { Printer, AlertTriangle, MapPin, Building } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { PinLockOverlay } from '../components/ui/PinLockOverlay';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [groupBy, setGroupBy] = useState<'type' | 'location' | 'department'>('type');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isUnlocked) {
      setIsLoading(true);
      analyticsService.getReportData(groupBy).then((data) => setReportData(data)).catch((err) => console.error(err)).finally(() => setIsLoading(false));
    }
  }, [isUnlocked, groupBy]);

  if (!isUnlocked) {
    return <PinLockOverlay onUnlock={() => setIsUnlocked(true)} targetName="Executive Reports & Analytics" correctPin="7781" />;
  }

  const chartData = reportData?.breakdown?.map((item: any) => ({ category: item.category || 'Unknown', count: item.count || 0 })) || [];
  const totalIncidents = reportData?.total || 0;
  const topCategory = chartData.length > 0 ? chartData.reduce((a: any, b: any) => a.count > b.count ? a : b) : null;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-white flex items-center gap-2">
            Institutional Audit Reports
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] font-bold border border-[#007AFF]/30">PIN 7781 Verified</span>
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 font-semibold mt-0.5">Comprehensive analytics and disciplinary breakdown</p>
        </div>
        <button onClick={() => window.print()} className="apple-btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold">
          <Printer className="w-4 h-4 text-[#BF5AF2]" strokeWidth={2} /> Print Report
        </button>
      </div>

      {/* Summary Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <div className="glass-card p-5 rounded-[22px]">
            <div className="flex items-center gap-3 mb-2"><div className="p-2.5 rounded-xl bg-[#007AFF]/15 text-[#007AFF]"><AlertTriangle className="w-4 h-4" strokeWidth={2} /></div><span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">Total Incidents</span></div>
            <span className="text-3xl font-extrabold text-[#1E293B] dark:text-white">{isLoading ? '—' : totalIncidents}</span>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5 rounded-[22px]">
            <div className="flex items-center gap-3 mb-2"><div className="p-2.5 rounded-xl bg-[#FF9F0A]/15 text-[#FF9F0A]"><MapPin className="w-4 h-4" strokeWidth={2} /></div><span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">Most Common</span></div>
            <span className="text-lg font-extrabold text-[#1E293B] dark:text-white">{isLoading ? '—' : topCategory?.category || 'N/A'}</span>
            <span className="text-xs text-[#64748B] ml-2 font-bold">{topCategory ? `${topCategory.count} incidents` : ''}</span>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5 rounded-[22px]">
            <div className="flex items-center gap-3 mb-2"><div className="p-2.5 rounded-xl bg-[#30D158]/15 text-[#30D158]"><Building className="w-4 h-4" strokeWidth={2} /></div><span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">Categories</span></div>
            <span className="text-3xl font-extrabold text-[#1E293B] dark:text-white">{isLoading ? '—' : chartData.length}</span>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Group By Selector */}
      <div className="glass-panel p-4.5 rounded-[26px] flex items-center justify-between shadow-md">
        <span className="text-xs font-bold text-[#1F2937] dark:text-slate-300 uppercase tracking-wider">Group Analytics By:</span>
        <div className="flex items-center gap-2">
          {(['type', 'location', 'department'] as const).map((mode) => (
            <button key={mode} onClick={() => setGroupBy(mode)} className={`px-3.5 py-2 rounded-2xl text-xs font-bold capitalize transition-all ${groupBy === mode ? 'apple-active-pill' : 'bg-black/5 dark:bg-white/10 text-[#1F2937] dark:text-slate-300 hover:bg-black/10'}`}>{mode}</button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-panel p-6 rounded-[26px] shadow-lg">
        <h3 className="text-base font-extrabold text-[#111827] dark:text-white mb-1 capitalize">{groupBy} Breakdown Analysis</h3>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 font-semibold mb-6">Total incidents aggregated: {totalIncidents}</p>
        {isLoading ? <Skeleton width="100%" height={280} className="rounded-xl" /> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)', color: '#FFF', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#0A84FF', fontWeight: 'bold' }} labelStyle={{ color: '#FFF', fontWeight: 'bold' }} />
                <Bar dataKey="count" fill="#007AFF" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
