import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '../ui/Skeleton';
import { BarChart3, TrendingUp, Filter, RotateCcw } from 'lucide-react';
import { Violation } from '../../types/violation';

export interface FilterState {
  department: string;
  location: string;
  type: string;
  status: string;
}

interface ExecutiveAnalyticsProps {
  groupBy: 'type' | 'location' | 'department';
  onGroupByChange: (mode: 'type' | 'location' | 'department') => void;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  violations: Violation[];
  allViolations: Violation[];
  monthlyChart?: { labels: string[]; data: number[] };
  isLoading: boolean;
  isDark: boolean;
}

const APPLE_PALETTE = ['#007AFF', '#30D158', '#BF5AF2', '#FF9F0A', '#FF2D55', '#546E7A', '#64D2FF'];

export const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({
  groupBy,
  onGroupByChange,
  filters,
  onFilterChange,
  onResetFilters,
  violations,
  allViolations,
  monthlyChart,
  isLoading,
  isDark,
}) => {
  const [viewMode, setViewMode] = React.useState<'breakdown' | 'monthly'>('breakdown');

  // Dynamically aggregate filtered violations by the active groupBy field ('type' | 'location' | 'department')
  const aggregatedMap: Record<string, number> = {};
  violations.forEach((v) => {
    let rawVal = '';
    if (groupBy === 'type') rawVal = v.type || 'Unspecified';
    else if (groupBy === 'location') rawVal = v.location || 'Unspecified';
    else if (groupBy === 'department') rawVal = v.department || 'Unassigned';

    aggregatedMap[rawVal] = (aggregatedMap[rawVal] || 0) + 1;
  });

  const breakdownData = Object.keys(aggregatedMap).map((cat) => ({
    category: cat,
    count: aggregatedMap[cat],
  })).sort((a, b) => b.count - a.count);

  const totalFilteredIncidents = violations.length;

  // Monthly trend chart data
  const monthlyData = monthlyChart?.labels?.map((label, idx) => ({
    category: label,
    count: monthlyChart.data[idx] || 0,
  })) || [];

  const activeData = viewMode === 'breakdown' ? breakdownData : monthlyData;
  const topItem = breakdownData.length > 0 ? breakdownData[0] : null;
  const topShare = totalFilteredIncidents > 0 && topItem ? Math.round((topItem.count / totalFilteredIncidents) * 100) : 0;

  // Extract unique filter options from FULL UNFILTERED ALLVIOLATIONS array so all choices remain available!
  const baseList = allViolations.length > 0 ? allViolations : violations;
  const uniqueDepartments = Array.from(new Set(baseList.map((v) => v.department).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(baseList.map((v) => v.location).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(baseList.map((v) => v.type).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(baseList.map((v) => v.status).filter(Boolean)));

  const isFiltered = filters.department !== 'All' || filters.location !== 'All' || filters.type !== 'All' || filters.status !== 'All';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-5 sm:p-7 rounded-[22px] shadow-lg border border-white/40 dark:border-white/10 space-y-5"
    >
      {/* Top Header & Integrated Filter Bar (Placed on the same level next to title) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white capitalize">
              {groupBy} Breakdown Analysis
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]">
              {totalFilteredIncidents} DB Records
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time filter telemetry & database aggregation
          </p>
        </div>

        {/* Inline GroupBy Selector & Filters on Same Level */}
        <div className="flex flex-wrap items-center gap-2">
          {/* GroupBy Pill Controls */}
          <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {(['type', 'location', 'department'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onGroupByChange(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  groupBy === mode
                    ? 'bg-[#007AFF] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Department Select */}
          <select
            value={filters.department}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
          >
            <option value="All">All Depts</option>
            {uniqueDepartments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Location Select */}
          <select
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Type Select */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
          >
            <option value="All">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
          >
            <option value="All">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-black/5 dark:bg-white/10"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Mode Toggle: Breakdown vs Monthly */}
          <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/10">
            <button
              onClick={() => setViewMode('breakdown')}
              className={`p-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'breakdown' ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs' : 'text-slate-500'
              }`}
              title="Category Breakdown"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`p-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'monthly' ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs' : 'text-slate-500'
              }`}
              title="Monthly Trend"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Filtered</span>
          <span className="text-base font-extrabold text-slate-800 dark:text-white">{totalFilteredIncidents}</span>
        </div>
        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Top Category</span>
          <span className="text-xs font-extrabold text-[#007AFF] truncate block">
            {topItem ? `${topItem.category} (${topItem.count})` : 'N/A'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Category Share</span>
          <span className="text-base font-extrabold text-[#30D158]">{topShare}%</span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      {isLoading ? (
        <Skeleton width="100%" height={260} className="rounded-2xl" />
      ) : activeData.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center text-slate-400">
          <Filter className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs font-semibold">No incident data matching the selected filter criteria.</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'breakdown' ? (
              <BarChart data={activeData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                <XAxis dataKey="category" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = totalFilteredIncidents > 0 ? Math.round((data.count / totalFilteredIncidents) * 100) : 0;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xl border border-white/20 text-xs space-y-0.5">
                          <p className="font-bold text-slate-300 capitalize">{data.category}</p>
                          <p className="font-extrabold text-[#0A84FF]">{data.count} Incidents ({pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {activeData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={APPLE_PALETTE[index % APPLE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={activeData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                <XAxis dataKey="category" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#007AFF" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};
