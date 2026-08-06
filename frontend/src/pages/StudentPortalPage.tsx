import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Mail,
  Send,
  Maximize2,
  X,
  Search,
  Filter,
  ChevronDown,
  Sparkles,
  Camera,
  Layers,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { apiClient } from '../services/api';

export const formatToIST = (dateVal: string | number | undefined): string => {
  if (!dateVal) return 'Recent Incident';
  const str = String(dateVal).trim();
  if (str.includes('AM') || str.includes('PM') || str.includes('am') || str.includes('pm')) {
    return str;
  }
  try {
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return str;
    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return str;
  }
};

interface StudentProfile {
  roll_no: string;
  name: string;
  email: string;
  department: string;
  year?: string | number;
  section?: string;
  current_semester?: string;
  violations_count?: number;
  late_count?: number;
  bunk_count?: number;
  dress_code_count?: number;
  photo_registered?: boolean;
  semester_violations?: Record<string, number>;
}

interface StudentViolation {
  _id: string;
  type: string;
  location?: string;
  remarks?: string;
  timestamp?: string | number;
  created_at?: string;
  date?: string;
  status?: string;
  captured_image?: string;
  confidence?: number;
  semester?: string;
  academic_year?: string;
  mail_sent?: boolean;
}

const ALL_SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const getYearFromSemester = (sem: string): string => {
  if (sem.startsWith('1')) return '1st Year';
  if (sem.startsWith('2')) return '2nd Year';
  if (sem.startsWith('3')) return '3rd Year';
  if (sem.startsWith('4')) return '4th Year';
  return '3rd Year';
};

export const StudentPortalPage: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [selectedSem, setSelectedSem] = useState<string>('4-1');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profRes, violRes, settingsRes] = await Promise.all([
          axios.get('/api/student/me', { headers }).catch(() => null),
          axios.get('/api/student/violations', { headers }).catch(() => null),
          apiClient.get('/api/settings/discipline').catch(() => null),
        ]);

        if (profRes?.data?.success) {
          setProfile(profRes.data.data);
        }
        if (violRes?.data?.success) {
          setViolations(violRes.data.data || []);
        }

        const settingsSem = settingsRes?.data?.data?.current_semester;
        if (settingsSem) {
          setSelectedSem(settingsSem);
        } else if (profRes?.data?.data?.current_semester) {
          setSelectedSem(profRes.data.data.current_semester);
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

  const semTotals = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_SEMESTERS.forEach((sem) => { map[sem] = 0; });
    violations.forEach((v) => {
      const semKey = v.semester || (v.created_at && new Date(v.created_at).getFullYear() === 2026 ? '4-1' : '3-2');
      if (map[semKey] !== undefined) {
        map[semKey] += 1;
      }
    });
    return map;
  }, [violations]);

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesSearch =
        search === '' ||
        (v.type || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.remarks || '').toLowerCase().includes(search.toLowerCase());

      const vSem = v.semester || (v.created_at && new Date(v.created_at).getFullYear() === 2026 ? '4-1' : '3-2');
      const matchesSem = selectedSem === 'All' || vSem === selectedSem;

      const normStatus = (v.status || 'Logged').toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Resolved' && normStatus.includes('resolve')) ||
        (statusFilter === 'Logged' && (normStatus.includes('log') || normStatus.includes('detect') || normStatus.includes('pending'))) ||
        (statusFilter === 'Mail Sent' && v.mail_sent);

      return matchesSearch && matchesSem && matchesStatus;
    });
  }, [violations, search, selectedSem, statusFilter]);

  const displayedViolations = useMemo(() => {
    return filteredViolations.slice(0, displayLimit);
  }, [filteredViolations, displayLimit]);

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

  const activeSem = profile?.current_semester || selectedSem || '4-1';
  const activeYear = getYearFromSemester(activeSem);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Light/Dark Responsive SaaS Student Card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-7 rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-xl relative overflow-hidden bg-white/80 dark:bg-slate-950/70 backdrop-blur-2xl space-y-6"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#007AFF]/10 via-[#BF5AF2]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Student Avatar */}
            <div
              onClick={() => photoUrl && setPreviewModal({ url: photoUrl, title: `${profile?.name || 'Student Profile'} (${profile?.roll_no})`, subtitle: 'Registered Biometric Enrolled Photo' })}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-2 border-slate-200 dark:border-white/20 shadow-lg ring-4 ring-[#007AFF]/15 shrink-0 relative group cursor-pointer"
            >
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt={profile?.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-full">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-[#007AFF] rounded-full flex items-center justify-center text-white font-extrabold text-xl">
                  {studentInitials}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border border-[#007AFF]/30">
                  Student Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Entra ID Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BF5AF2]/15 text-[#BF5AF2] border border-[#BF5AF2]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 512D ArcFace Profile
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {profile?.name || 'Student Profile'}
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Roll Number: <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.roll_no}</span> • {profile?.email || `${profile?.roll_no}@vvit.net`}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                  {profile?.department || 'CSE'} — Section {profile?.section || 'B'}
                </span>
                <span className="px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
                  Default Sem: {selectedSem} ({activeYear})
                </span>
              </div>
            </div>
          </div>

          {/* Compact, Perfectly Aligned Total Incidents Badge */}
          <div className="px-4 py-2.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center gap-3 shrink-0 self-center sm:self-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 block leading-none">Total Incidents</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-tight block mt-0.5">{violations.length}</span>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-500 opacity-80" />
          </div>
        </div>

        {/* Semester Filter Pill Buttons */}
        <div className="pt-4 border-t border-slate-200/70 dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              Academic Semester Filter
            </h4>
            <span className="text-xs font-semibold text-[#007AFF]">
              Selected: {selectedSem === 'All' ? 'All Semesters' : `Semester ${selectedSem}`}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => { setSelectedSem('All'); setDisplayLimit(10); }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedSem === 'All'
                  ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md shadow-[#007AFF]/20 scale-[1.02]'
                  : 'bg-slate-100/80 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
              }`}
            >
              All ({violations.length})
            </button>

            {ALL_SEMESTERS.map((semKey) => {
              const isSelected = semKey === selectedSem;
              const count = semTotals[semKey] || 0;

              return (
                <button
                  key={semKey}
                  type="button"
                  onClick={() => { setSelectedSem(semKey); setDisplayLimit(10); }}
                  className={`py-1.5 px-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md shadow-[#007AFF]/20 scale-[1.02]'
                      : count > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-100/80 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{semKey}</span>
                  </div>
                  <div className="text-[10px] opacity-75 font-medium mt-0.5">{count} rec</div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Light/Dark Responsive Incident Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden bg-white/80 dark:bg-slate-950/70 backdrop-blur-2xl"
      >
        <div className="p-5 sm:p-6 border-b border-slate-200/70 dark:border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center shrink-0 border border-[#FF3B30]/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Compliance Log Audit</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click any row to inspect camera snapshot evidence</p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 font-semibold text-slate-700 dark:text-slate-300 self-start sm:self-center border border-slate-200 dark:border-white/10">
              {displayedViolations.length} of {filteredViolations.length} Records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setDisplayLimit(10); }}
                placeholder="Search type, location, remarks..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setDisplayLimit(10); }}
              className="px-4 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="All">All Statuses</option>
              <option value="Logged">Logged / Active</option>
              <option value="Resolved">Resolved</option>
              <option value="Mail Sent">Mail Dispatched</option>
            </select>
          </div>
        </div>

        {filteredViolations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1.5">
            <ShieldAlert className="w-8 h-8 mx-auto opacity-40 text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No incident logs found for Semester {selectedSem}</p>
            <p className="text-slate-500 text-[11px]">Select another semester or adjust search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Camera Snapshot</th>
                  <th className="py-3.5 px-5">Violation Type</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Timestamp (IST)</th>
                  <th className="py-3.5 px-5">Remarks & Evidence</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 font-medium">
                {displayedViolations.map((v) => {
                  const formattedDate = v.date || formatToIST(v.created_at || v.timestamp);
                  const incidentImg = v.captured_image || (profile?.roll_no ? `/api/students/${profile.roll_no}/image` : null);
                  const isResolved = (v.status || '').toLowerCase().includes('resolve');

                  const confPercent = v.confidence
                    ? (v.confidence > 1 ? v.confidence.toFixed(1) : (v.confidence * 100).toFixed(1))
                    : null;

                  return (
                    <tr
                      key={v._id}
                      onClick={() => incidentImg && setPreviewModal({
                        url: incidentImg,
                        title: `${v.type || 'Incident Snapshot'} — ${profile?.name || 'Student'} (${profile?.roll_no})`,
                        subtitle: `${formattedDate} • Location: ${v.location || 'Campus Zone'}`
                      })}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      {/* Camera Snapshot Thumbnail Column */}
                      <td className="py-4 px-5">
                        {incidentImg ? (
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/20 shadow-xs group relative bg-slate-900"
                            title="Click row to inspect full camera snapshot"
                          >
                            <img src={incidentImg} alt={v.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-semibold">
                            No Photo
                          </div>
                        )}
                      </td>

                      {/* Violation Type */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{v.type || 'Compliance Violation'}</p>
                          {confPercent && (
                            <span className="text-[11px] font-medium text-[#007AFF] dark:text-[#0A84FF]">
                              {confPercent}% Match Confidence
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{v.location || 'Campus Zone'}</span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-5">
                        <p className="text-slate-700 dark:text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {formattedDate}
                        </p>
                      </td>

                      {/* Remarks & Mail Info */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="space-y-0.5">
                          {v.remarks ? (
                            <p className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate" title={v.remarks}>
                              {v.remarks}
                            </p>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">System logged compliance match</p>
                          )}
                          {v.mail_sent && (
                            <p className="text-[11px] text-[#007AFF] font-medium flex items-center gap-1 pt-0.5">
                              <Mail className="w-3.5 h-3.5" /> Email Dispatched to Student
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5 text-right">
                        {isResolved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        ) : v.mail_sent ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30 inline-flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-[#007AFF]" /> Mail Sent
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {v.status || 'Logged'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredViolations.length > displayLimit && (
          <div className="p-4 text-center border-t border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 10)}
              className="px-6 py-2 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/25 font-semibold text-xs border border-[#007AFF]/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4" /> Load More Records ({filteredViolations.length - displayLimit} remaining)
            </button>
          </div>
        )}
      </motion.div>

      {/* Lightbox Image Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-slate-900 border border-white/20 rounded-[28px] overflow-hidden shadow-2xl p-6 text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{previewModal.title}</h3>
                  {previewModal.subtitle && (
                    <p className="text-xs text-slate-400 font-medium">{previewModal.subtitle}</p>
                  )}
                </div>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 max-h-[65vh] flex items-center justify-center">
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1.5 text-[#30D158] font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Verified Compliance Evidence
                </span>
                <span>AttendGuard v3.0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
