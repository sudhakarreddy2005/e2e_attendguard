import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  Building2,
  MapPin,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ExecutiveKpiGridProps {
  totalViolations: number;
  totalStudents: number;
  todayActivity: number;
  topViolationName: string;
  topViolationCount: number;
  deptCount: number;
  topLocationName: string;
  topLocationCount: number;
  recognitionAccuracy: number;
  healthScore: number;
  isLoading?: boolean;
}

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({
  totalViolations,
  totalStudents,
  todayActivity,
  topViolationName,
  topViolationCount,
  deptCount,
  topLocationName,
  topLocationCount,
  recognitionAccuracy,
  healthScore,
  isLoading = false,
}) => {
  const kpiList = [
    {
      id: 'total_violations',
      title: 'Total Incidents',
      value: isLoading ? '—' : totalViolations.toString(),
      subtext: 'MongoDB Real-time Count',
      icon: AlertTriangle,
      color: '#007AFF',
      bgLight: 'bg-[#007AFF]/15',
    },
    {
      id: 'today_activity',
      title: "Today's Detections",
      value: isLoading ? '—' : todayActivity.toString(),
      subtext: 'Camera Scans Today',
      icon: Activity,
      color: '#FF2D55',
      bgLight: 'bg-[#FF2D55]/15',
    },
    {
      id: 'top_location',
      title: 'Violation Hotspot',
      value: isLoading ? '—' : topLocationName,
      subtext: `${topLocationCount} Incidents Logged`,
      icon: MapPin,
      color: '#FF9F0A',
      bgLight: 'bg-[#FF9F0A]/15',
    },
    {
      id: 'top_violation',
      title: 'Most Common Violation',
      value: isLoading ? '—' : topViolationName,
      subtext: `${topViolationCount} Cases Logged`,
      icon: ShieldAlert,
      color: '#BF5AF2',
      bgLight: 'bg-[#BF5AF2]/15',
    },
    {
      id: 'total_students',
      title: 'Enrolled Students',
      value: isLoading ? '—' : totalStudents.toString(),
      subtext: 'Active Roster Synced',
      icon: Users,
      color: '#30D158',
      bgLight: 'bg-[#30D158]/15',
    },
    {
      id: 'departments',
      title: 'Monitored Faculties',
      value: isLoading ? '—' : deptCount.toString(),
      subtext: `${deptCount} Active Departments`,
      icon: Building2,
      color: '#007AFF',
      bgLight: 'bg-[#007AFF]/15',
    },
    {
      id: 'cv_accuracy',
      title: 'Recognition Accuracy',
      value: isLoading ? '—' : `${recognitionAccuracy}%`,
      subtext: 'ArcFace v2.1 Precision',
      icon: CheckCircle2,
      color: '#30D158',
      bgLight: 'bg-[#30D158]/15',
    },
    {
      id: 'campus_safety',
      title: 'Campus Safety Index',
      value: isLoading ? '—' : `${healthScore} / 100`,
      subtext: healthScore >= 80 ? 'Grade A Compliance' : 'Review Recommended',
      icon: Sparkles,
      color: '#34C759',
      bgLight: 'bg-[#34C759]/15',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {kpiList.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <motion.div
            key={kpi.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-4 rounded-2xl border border-white/40 dark:border-white/10 flex flex-col justify-between shadow-xs bg-white/60 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {kpi.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl ${kpi.bgLight} flex items-center justify-center shrink-0 border border-white/20 dark:border-white/10`}
                style={{ color: kpi.color }}
              >
                <IconComponent className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>

            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight truncate block">
                {kpi.value}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                {kpi.subtext}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
