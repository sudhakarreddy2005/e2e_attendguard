import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Activity, Building, ArrowUpRight, Scan, UserCheck } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { analyticsService } from '../services/analyticsService';
import { DashboardKPIs } from '../types/analytics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const APPLE_HIG_PALETTE = ['#007AFF', '#30D158', '#BF5AF2', '#FF9F0A', '#FF2D55'];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    analyticsService.getDashboardKPIs()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const monthlyChartData = data?.monthly_chart?.labels?.map((label, idx) => ({
    name: label, violations: data.monthly_chart.data[idx] || 0,
  })) || [];

  const typePieData = data?.type_breakdown?.labels?.map((label, idx) => ({
    name: label, value: data.type_breakdown.data[idx] || 0,
  })) || [];

  return (
    <PageTransition className="space-y-6">
      {/* Hero Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-[24px] relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#007AFF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#BF5AF2]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]">Institutional Dashboard</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#30D158]/15 text-[#30D158]">
                {user?.role?.replace('_', ' ').toUpperCase() || 'SUPER ADMIN'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-100 tracking-tight">
              Welcome back, {user?.display_name || user?.username || 'Administrator'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
              Real-time attendance violation intelligence, face recognition matrix, and institutional security monitoring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/detect')} className="apple-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-md">
              <Scan className="w-4 h-4 text-white" strokeWidth={2} /><span>Live Scanner</span>
            </motion.button>
            {user?.role === 'super_admin' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/users')} className="apple-btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold">
                <UserCheck className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" strokeWidth={2} /><span>Manage Users</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem><StatCard title="Total Enrolled Students" value={isLoading ? 0 : data?.total_students ?? 0} subtitle="All departments synced" icon={Users} color="blue" isLoading={isLoading} /></StaggerItem>
        <StaggerItem><StatCard title="Total Incidents Logged" value={isLoading ? 0 : data?.total_violations ?? 0} subtitle="GuardDB active records" icon={AlertTriangle} color="danger" isLoading={isLoading} /></StaggerItem>
        <StaggerItem><StatCard title="Today's Camera Detections" value={isLoading ? 0 : data?.today_activity ?? 0} subtitle="Real-time scan matches" icon={Activity} color="warning" isLoading={isLoading} /></StaggerItem>
        <StaggerItem><StatCard title="Top Violation Hotspot" value={isLoading ? '...' : data?.most_active_location?.name || 'N/A'} subtitle={`${data?.most_active_location?.count || 0} total incidents`} icon={Building} color="purple" isLoading={isLoading} /></StaggerItem>
      </StaggerContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-[24px] shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Monthly Incident Analytics</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Trailing 6 months violation curve</p>
            </div>
            <button onClick={() => navigate('/reports')} className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1">
              Detailed Report <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
          {isLoading ? <Skeleton width="100%" height={240} className="rounded-xl" /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="appleStockGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#007AFF" stopOpacity={0.35} /><stop offset="95%" stopColor="#007AFF" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#FFF', fontSize: '12px', fontWeight: '600' }} itemStyle={{ color: '#0A84FF', fontWeight: '600' }} labelStyle={{ color: '#FFF', fontWeight: '600' }} />
                  <Area type="monotone" dataKey="violations" stroke="#007AFF" strokeWidth={2.5} fillOpacity={1} fill="url(#appleStockGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-[24px] shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-0.5">Violation Categories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">Distribution by type</p>
            {isLoading ? <div className="h-44 flex items-center justify-center"><Skeleton variant="circle" width={140} height={140} /></div> : (
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={typePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {typePieData.map((_, index) => <Cell key={`cell-${index}`} fill={APPLE_HIG_PALETTE[index % APPLE_HIG_PALETTE.length]} />)}
                  </Pie><Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#FFF', fontSize: '11px', fontWeight: '600' }} /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/10">
            {typePieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: APPLE_HIG_PALETTE[idx % APPLE_HIG_PALETTE.length] }} /><span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span></div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="glass-panel p-6 rounded-[24px] shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Recent Activity Stream</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Latest camera face recognition logs</p>
          </div>
          <button onClick={() => navigate('/violations')} className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline">View All Incident Logs →</button>
        </div>
        <div className="space-y-2">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-white/60 dark:border-white/10 flex items-center gap-4">
              <Skeleton variant="circle" width={36} height={36} className="rounded-xl" />
              <div className="flex-1 space-y-1.5"><Skeleton variant="text" height={10} width="60%" /><Skeleton variant="text" height={8} width="40%" /></div>
            </div>
          )) : data?.recent_activity?.slice(0, 5).map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }} whileHover={{ y: -1 }}
              className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-white/60 dark:border-white/10 flex items-center justify-between hover:bg-white/80 dark:hover:bg-white/[0.08] backdrop-blur-md transition-all shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] text-white font-bold text-xs flex items-center justify-center shadow-xs border border-white/20">{item.roll_no.slice(-3)}</div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{item.roll_no} • <span className="font-semibold text-slate-600 dark:text-slate-300">{item.type}</span></h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.location} • {item.remarks}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">{item.time}</span>
                <Badge variant={item.badge as any} dot>{item.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};
