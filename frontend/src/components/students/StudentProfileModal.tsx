import React, { useEffect, useState } from 'react';
import { Pencil, X, Clock, BarChart2, PieChart as PieChartIcon, ShieldAlert } from 'lucide-react';
import { Student, StudentAnalytics } from '../../types/student';
import { studentService } from '../../services/studentService';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

const CATEGORY_COLORS = ['#FF9F0A', '#FF453A', '#BF5AF2', '#007AFF'];

const ALL_SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const getYearFromSemester = (sem: string): string => {
  if (sem.startsWith('1')) return '1st Year';
  if (sem.startsWith('2')) return '2nd Year';
  if (sem.startsWith('3')) return '3rd Year';
  if (sem.startsWith('4')) return '4th Year';
  return '3rd Year';
};

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose, onEdit, canEdit }) => {
  const activeSem = student?.current_semester || '4-1';
  const [selectedSem, setSelectedSem] = useState<string>(activeSem);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [semTotals, setSemTotals] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (student) {
      setIsLoading(true);
      studentService
        .getStudentAnalytics(student.roll_no, selectedSem)
        .then((data) => {
          setAnalytics(data);
          if (data && typeof data.total === 'number') {
            setSemTotals((prev) => ({ ...prev, [selectedSem]: data.total }));
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [student, selectedSem]);

  if (!student) return null;

  const imageSrc = studentService.getStudentImage(student.roll_no);
  const displayYear = getYearFromSemester(selectedSem);

  // Exact 6-Month Violation Curve Data
  const rawChartLabels = analytics?.monthly_counts?.labels || ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const rawChartData = analytics?.monthly_counts?.data || [0, 0, 0, 0, 0, 0];

  const sixMonthLabels = rawChartLabels.slice(-6);
  const sixMonthValues = rawChartData.slice(-6);

  const monthlyChartData = sixMonthLabels.map((label, idx) => ({
    name: label,
    violations: sixMonthValues[idx] || 0,
  }));

  // Dynamic Violation Type Breakdown Pie Data for selected semester
  const breakdown = analytics?.breakdown || {};
  const lateVal = (breakdown['Campus Late'] || 0) + (breakdown['Late Arrival'] || 0) + (breakdown['Late'] || 0);
  const bunkVal = (breakdown['Campus Bunk'] || 0) + (breakdown['Bunk'] || 0);
  const dressVal = (breakdown['Dress Code'] || 0) + (breakdown['Uniform'] || 0);
  const otherVal = Object.entries(breakdown).reduce((acc, [k, v]) => {
    const lk = String(k).toLowerCase();
    if (!lk.includes('late') && !lk.includes('bunk') && !lk.includes('dress') && !lk.includes('uniform')) {
      return acc + v;
    }
    return acc;
  }, 0);

  const typePieData = [
    { name: 'Late Arrival', value: lateVal },
    { name: 'Bunk', value: bunkVal },
    { name: 'Dress Code', value: dressVal },
    { name: 'Other', value: otherVal },
  ].filter((item) => item.value > 0);

  const displayPieData = typePieData.length > 0 ? typePieData : [
    { name: 'No Violations in ' + selectedSem, value: 1 }
  ];

  const currentSemViolationsCount = analytics?.total ?? (
    student.semester_violations?.[selectedSem] ?? (
      selectedSem === (student.current_semester || '3-2') ? student.violations_count : 0
    )
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] glass-panel rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/70 dark:border-white/10">
        {/* Soft Liquid Pinkish & Whitish Header */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-rose-300/80 via-pink-200/90 to-rose-200/80 dark:from-rose-950/80 dark:via-pink-950/60 dark:to-purple-950/80 backdrop-blur-2xl text-slate-800 dark:text-slate-100 relative flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 border-b border-white/60 dark:border-white/10 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Prominent Large Round / Circular Student Photo */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white/40 dark:bg-white/10 overflow-hidden border-4 border-white/90 dark:border-white/20 shadow-xl ring-4 ring-pink-300/40 dark:ring-pink-500/20 shrink-0 relative group">
              <img
                src={imageSrc}
                alt={student.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=FFB6C1&color=700&bold=true&rounded=true`;
                }}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{student.name}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold">
                Roll No: {student.roll_no}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                <span className="px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 backdrop-blur-md shadow-xs">
                  {student.department} - Section {student.section}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 backdrop-blur-md shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block animate-pulse" />
                  Sem: {selectedSem} ({displayYear})
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${
                  currentSemViolationsCount >= 10
                    ? 'bg-[#FF453A]/20 text-[#FF453A] border-[#FF453A]/30'
                    : currentSemViolationsCount >= 5
                    ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/30'
                    : 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30'
                }`}>
                  {currentSemViolationsCount >= 10 ? 'High Risk (Level 2+)' : currentSemViolationsCount >= 5 ? 'Advisory Warning (Level 1)' : 'Clean Record'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="px-3.5 py-2 rounded-full bg-white/70 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white text-slate-700 dark:text-slate-200 transition-colors border border-white/60 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                title="Edit Student Profile (DEO / Admin)"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/60 dark:bg-white/10 hover:bg-white/90 text-slate-700 dark:text-white transition-colors border border-white/60 dark:border-white/10 shadow-xs cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interactive Institutional Academic Semester Structure (1-1 to 4-2) */}
          <div className="p-5 rounded-[24px] bg-white/70 dark:bg-white/[0.04] border border-purple-200/50 dark:border-white/10 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-500" strokeWidth={2} />
                Select Academic Semester to View Violations & Analytics
              </h4>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                Viewing: Sem {selectedSem} ({currentSemViolationsCount} Violations)
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
              {ALL_SEMESTERS.map((semKey) => {
                const isSelected = semKey === selectedSem;
                const isCurrentActive = semKey === activeSem;
                const count = semTotals[semKey] !== undefined
                  ? semTotals[semKey]
                  : ((isSelected && analytics)
                    ? analytics.total
                    : (student.semester_violations?.[semKey] ?? (semKey === activeSem ? student.violations_count : 0)));

                return (
                  <button
                    key={semKey}
                    type="button"
                    onClick={() => setSelectedSem(semKey)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left sm:text-center ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 ring-4 ring-purple-500/30 shadow-md transform scale-[1.03]'
                        : isCurrentActive
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25'
                        : count > 0
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                        : 'bg-black/5 dark:bg-white/[0.03] border-black/5 dark:border-white/10 text-slate-500 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="font-extrabold text-[11px] flex items-center justify-between sm:justify-center gap-1">
                      <span>{semKey}</span>
                      {isCurrentActive && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`} title="Current Active Semester" />
                      )}
                    </div>
                    <div className="text-xs font-black mt-1">
                      {count} <span className="text-[9px] font-medium opacity-80">v.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Donut Chart with Breakdown Numbers Below */}
            <div className="p-5 rounded-[24px] bg-white/70 dark:bg-white/[0.04] border border-pink-200/50 dark:border-white/10 shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <PieChartIcon className="w-4 h-4 text-rose-400" strokeWidth={2} />
                  Types ({selectedSem})
                </h4>

                <div className="h-32 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={52}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {displayPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={typePieData.length > 0 ? CATEGORY_COLORS[index % CATEGORY_COLORS.length] : '#30D158'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Type and Number Breakdown Below Chart */}
              <div className="mt-3 space-y-1.5 border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs font-medium">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" /> Late Arrival
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{lateVal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" /> Bunk
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{bunkVal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2]" /> Dress Code
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{dressVal}</span>
                </div>
              </div>
            </div>

            {/* Exactly 6-Month Area Curve Chart */}
            <div className="md:col-span-2 p-5 rounded-[24px] bg-white/70 dark:bg-white/[0.04] border border-pink-200/50 dark:border-white/10 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
                  Sem {selectedSem} Violation Trend
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">
                  Sem {selectedSem} Distribution
                </span>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="studentModalCurve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF2D55" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#FF2D55" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 11, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: isDark ? '#98989D' : '#64748B', fontSize: 11, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                      itemStyle={{ color: '#FF2D55', fontWeight: 'bold' }}
                      labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="violations"
                      stroke="#FF2D55"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#studentModalCurve)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline History */}
          <div className="p-5 rounded-[24px] bg-white/70 dark:bg-white/[0.04] border border-pink-200/50 dark:border-white/10 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" strokeWidth={2} />
                Semester {selectedSem} Incident Trail
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">
                {analytics?.timeline?.length || 0} Incident Records
              </span>
            </div>

            {isLoading && (
              <p className="text-xs text-slate-400 font-medium py-2">Loading Sem {selectedSem} violations...</p>
            )}

            {!isLoading && analytics?.timeline && analytics.timeline.length > 0 ? (
              <div className="space-y-2">
                {analytics.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.type}</span>
                        <span className="text-slate-400 font-medium">• {item.location}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold">
                          Sem {item.semester || selectedSem}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{item.remark}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-400 block">{item.date}</span>
                      <Badge variant={item.status === 'Pending' ? 'warning' : 'success'} size="sm">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium py-2">
                No violation records logged for student in Semester {selectedSem}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
