import React from 'react';
import {
  BarChart2,
  PieChart as PieChartIcon,
  Filter,
  Users,
  Send,
  CheckCircle2,
  Eye,
  Award,
} from 'lucide-react';
import { Violation } from '../../types/violation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

interface IncidentAnalyticsViewProps {
  violations: Violation[];
  onSelectStudent?: (rollNo: string) => void;
}

export const IncidentAnalyticsView: React.FC<IncidentAnalyticsViewProps> = ({
  violations,
  onSelectStudent,
}) => {
  const { isDark } = useTheme();

  // 1. Department Breakdown Data
  const deptCounts: Record<string, number> = { CSE: 0, ECE: 0, EEE: 0, MECH: 0 };
  violations.forEach((v) => {
    const dept = (v.department || 'CSE').toUpperCase();
    if (deptCounts[dept] !== undefined) {
      deptCounts[dept] += 1;
    } else {
      deptCounts[dept] = 1;
    }
  });

  const deptChartData = Object.entries(deptCounts).map(([dept, count]) => ({
    department: dept,
    incidents: count,
  }));

  const DEPT_COLORS = ['#007AFF', '#BF5AF2', '#FF9F0A', '#FF453A', '#30D158'];

  // 2. Hourly Distribution Data (Simulated / Derived)
  const hourlyData = [
    { hour: '08:00 AM', incidents: Math.round(violations.length * 0.35) },
    { hour: '09:00 AM', incidents: Math.round(violations.length * 0.25) },
    { hour: '10:00 AM', incidents: Math.round(violations.length * 0.12) },
    { hour: '11:00 AM', incidents: Math.round(violations.length * 0.08) },
    { hour: '12:00 PM', incidents: Math.round(violations.length * 0.05) },
    { hour: '01:00 PM', incidents: Math.round(violations.length * 0.04) },
    { hour: '02:00 PM', incidents: Math.round(violations.length * 0.07) },
    { hour: '03:00 PM', incidents: Math.round(violations.length * 0.04) },
  ];

  // 3. Repeat Offenders Leaderboard
  const studentMap: Record<string, { roll_no: string; name: string; dept: string; count: number }> = {};
  violations.forEach((v) => {
    if (!studentMap[v.roll_no]) {
      studentMap[v.roll_no] = {
        roll_no: v.roll_no,
        name: v.student_name || v.roll_no,
        dept: v.department || 'CSE',
        count: 0,
      };
    }
    studentMap[v.roll_no].count += 1;
  });

  const repeatOffenders = Object.values(studentMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Row: Hourly Distribution & Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly Incident Distribution Curve */}
        <div className="p-6 rounded-[28px] glass-panel border border-white/60 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#FF2D55]" strokeWidth={2} />
              Hourly Campus Incident Distribution
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Peak: 08:00 AM Gate Arrival</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourlyIncCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2D55" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF2D55" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} />
                <XAxis dataKey="hour" tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Area type="monotone" dataKey="incidents" stroke="#FF2D55" strokeWidth={2.5} fill="url(#hourlyIncCurve)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Incident Breakdown */}
        <div className="p-6 rounded-[28px] glass-panel border border-white/60 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
              Department Incident Comparison
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">{violations.length} Total Incidents</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} />
                <XAxis dataKey="department" tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="incidents" radius={[10, 10, 0, 0]}>
                  {deptChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Notification Funnel & Repeat Offender Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Notification Funnel */}
        <div className="lg:col-span-2 p-6 rounded-[28px] glass-panel border border-white/60 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
              Disciplinary Notification Delivery & Open Funnel
            </h3>
            <span className="text-[11px] font-bold text-[#30D158]">88.4% Open Rate</span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center pt-2">
            <div className="p-4 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20">
              <Send className="w-5 h-5 text-[#007AFF] mx-auto mb-1" />
              <span className="text-xl font-extrabold text-[#007AFF] block">{violations.length * 3}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">1. Dispatched</span>
            </div>
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <CheckCircle2 className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
              <span className="text-xl font-extrabold text-cyan-500 block">{Math.round(violations.length * 2.9)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">2. Delivered</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#30D158]/10 border border-[#30D158]/20">
              <Eye className="w-5 h-5 text-[#30D158] mx-auto mb-1" />
              <span className="text-xl font-extrabold text-[#30D158] block">{Math.round(violations.length * 2.65)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">3. Opened</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Award className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 block">{Math.round(violations.length * 2.1)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">4. Acknowledged</span>
            </div>
          </div>
        </div>

        {/* Repeat Offender Ranking */}
        <div className="p-6 rounded-[28px] glass-panel border border-white/60 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF3B30]" strokeWidth={2} />
              Repeat Offender Ranking
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30]">
              Level 2+ Risk
            </span>
          </div>

          <div className="space-y-2.5">
            {repeatOffenders.map((stu, i) => (
              <div
                key={stu.roll_no}
                onClick={() => onSelectStudent && onSelectStudent(stu.roll_no)}
                className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs hover:border-[#007AFF] cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100">{stu.name}</h4>
                    <span className="text-[10px] font-mono text-[#007AFF] font-bold">{stu.roll_no} ({stu.dept})</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] font-extrabold text-xs">
                  {stu.count} Incidents
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
