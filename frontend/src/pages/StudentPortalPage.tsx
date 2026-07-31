import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Building,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface StudentProfile {
  roll_no: string;
  name: string;
  email: string;
  department: string;
  year?: string | number;
  section?: string;
  violations_count?: number;
  late_count?: number;
  bunk_count?: number;
  dress_code_count?: number;
  photo_registered?: boolean;
}

interface StudentViolation {
  _id: string;
  type: string;
  location?: string;
  remarks?: string;
  timestamp?: string;
  created_at?: string;
  status?: string;
}

export const StudentPortalPage: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profRes, violRes] = await Promise.all([
          axios.get('/api/student/me', { headers }).catch(() => null),
          axios.get('/api/student/violations', { headers }).catch(() => null),
        ]);

        if (profRes?.data?.success) {
          setProfile(profRes.data.data);
        }
        if (violRes?.data?.success) {
          setViolations(violRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load student portal data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchStudentData();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const photoUrl = profile?.roll_no && !imageError ? `/api/students/${profile.roll_no}/image` : null;
  const studentInitials = (profile?.name || profile?.roll_no || 'ST')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-[28px] border border-white/50 dark:border-white/10 shadow-xl relative overflow-hidden bg-gradient-to-r from-[#007AFF]/10 via-transparent to-[#5856D6]/10"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] p-0.5 shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={profile?.name}
                className="w-full h-full object-cover rounded-[22px]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-white font-extrabold text-xl">
                {studentInitials}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border border-[#007AFF]/30">
                Student Self-Service Portal
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated via Entra ID
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {profile?.name || 'Student Profile'}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
              Roll Number: <span className="font-bold text-[#007AFF]">{profile?.roll_no}</span> • {profile?.email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-[22px] border border-white/50 dark:border-white/10 shadow-lg flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{profile?.department || 'CSE'}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-[22px] border border-white/50 dark:border-white/10 shadow-lg flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#5856D6]/10 text-[#5856D6] dark:text-[#5E5CE6] flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Year & Section</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {profile?.year || '3rd Year'} • Sec {profile?.section || 'A'}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-[22px] border border-white/50 dark:border-white/10 shadow-lg flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Violations</p>
            <p className="text-xl font-extrabold text-[#FF3B30]">{profile?.violations_count ?? violations.length ?? 0}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-[22px] border border-white/50 dark:border-white/10 shadow-lg flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#30D158]/10 text-[#30D158] flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</p>
            <p className="text-sm font-bold text-[#30D158]">Active Student</p>
          </div>
        </motion.div>
      </div>

      {/* Violation History Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-[28px] border border-white/50 dark:border-white/10 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">My Violation History</h2>
              <p className="text-xs text-slate-400">Recorded campus compliance logs from database</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 font-bold text-slate-600 dark:text-slate-300">
            {violations.length} Records
          </span>
        </div>

        {violations.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
            No compliance violations recorded for your profile. Great record!
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {violations.map((v) => {
              const dateStr = v.created_at || v.timestamp;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div key={v._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${v.status === 'Resolved' ? 'bg-[#30D158]' : 'bg-[#FF3B30]'}`} />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{v.type || 'Compliance Violation'}</p>
                      {v.remarks && (
                        <p className="text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {v.remarks}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {v.location || 'Campus'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold self-start sm:self-center border ${
                      v.status === 'Resolved'
                        ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30'
                        : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                    }`}
                  >
                    {v.status || 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
