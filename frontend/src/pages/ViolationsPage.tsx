import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Calendar,
  Filter,
  X,
  LayoutGrid,
  List,
  Download,
  Eye,
  Building,
  Cpu,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { violationService } from '../services/violationService';
import { studentService } from '../services/studentService';
import { Violation, IncidentStatus } from '../types/violation';
import { PageTransition } from '../components/ui/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { GlassModal } from '../components/ui/GlassModal';
import { IncidentDetailModal, formatToIST } from '../components/violations/IncidentDetailModal';

/* ─── Inline Toast Notification ───────────────────────────────────── */
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

const InlineToast: React.FC<{ toast: ToastState; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-[#30D158]" />,
    error: <XCircle className="w-4 h-4 text-[#FF453A]" />,
    info: <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />,
  };
  const bgMap = {
    success: 'bg-[#30D158]/15 border-[#30D158]/30 text-[#30D158]',
    error: 'bg-[#FF453A]/15 border-[#FF453A]/30 text-[#FF453A]',
    info: 'bg-[#FF9F0A]/15 border-[#FF9F0A]/30 text-[#FF9F0A]',
  };
  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-xl text-xs font-bold ${bgMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <span className="text-slate-800 dark:text-white">{toast.message}</span>
          <button onClick={onDismiss} className="ml-2 p-0.5 hover:opacity-70 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Inline Confirm Dialog ───────────────────────────────────────── */
interface ConfirmState {
  visible: boolean;
  message: string;
  onConfirm: () => void;
}

const InlineConfirmDialog: React.FC<{ state: ConfirmState; onCancel: () => void }> = ({ state, onCancel }) => (
  <AnimatePresence>
    {state.visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-[24px] p-6 max-w-sm w-full shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FF453A]/15">
              <AlertTriangle className="w-5 h-5 text-[#FF453A]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Confirm Action</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{state.message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onCancel} className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer">Cancel</button>
            <button
              onClick={() => { state.onConfirm(); onCancel(); }}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-[#FF453A] text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              Delete Permanently
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Detected': 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
  'Pending': 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
  'Under Review': 'bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30',
  'Reviewed': 'bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30',
  'Verified': 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  'Action Taken': 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  'Escalated': 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30',
  'Resolved': 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30',
  'Closed': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  'Dismissed': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const VIOLATION_TYPE_STYLES: Record<string, string> = {
  'Late Arrival': 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
  'Dress Code': 'bg-[#BF5AF2]/15 text-[#BF5AF2] border-[#BF5AF2]/30',
  'Bunk': 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30',
};

export const ViolationsPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Default to Command Table View per user requirement
  const [activeView, setActiveView] = useState<'feed' | 'table'>('table');

  // Selected incident for Centered Modal Inspection
  const [selectedIncident, setSelectedIncident] = useState<Violation | null>(null);

  // High-Resolution Image Preview Lightbox
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewModal(null);
    };
    if (previewModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewModal]);

  // Lazy Yielding limit state (10 items per batch)
  const [displayLimit, setDisplayLimit] = useState(10);

  // Smart Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Inline Toast & Confirm Dialog (replacing browser alerts)
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const [confirmState, setConfirmState] = useState<ConfirmState>({ visible: false, message: '', onConfirm: () => {} });

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);

  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);
  const dismissConfirm = useCallback(() => setConfirmState((c) => ({ ...c, visible: false })), []);

  // Form states for manual registration
  const [rollNo, setRollNo] = useState('');
  const [vType, setVType] = useState('Late Arrival');
  const [location, setLocation] = useState('Central Block');
  const [dept, setDept] = useState('CSE');
  const [section, setSection] = useState('A');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag & Drop / Image Comparison states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [dbStudentImage, setDbStudentImage] = useState<string | null>(null);
  const [matchedStudentName, setMatchedStudentName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchViolations = () => {
    setIsLoading(true);
    violationService.getViolations()
      .then((data) => setViolations(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  // Reset lazy yield limit whenever filter criteria change
  useEffect(() => {
    setDisplayLimit(10);
  }, [search, typeFilter, locationFilter, deptFilter, statusFilter, dateFilter]);

  // When rollNo changes, attempt to look up DB image & name
  useEffect(() => {
    if (rollNo.trim().length >= 5) {
      const dbUrl = studentService.getStudentImage(rollNo.trim().toUpperCase());
      setDbStudentImage(dbUrl);
      studentService.getStudents().then((all) => {
        const found = all.find((s) => s.roll_no.toUpperCase() === rollNo.trim().toUpperCase());
        if (found) {
          setMatchedStudentName(found.name);
          setDept(found.department);
          setSection(found.section);
        }
      }).catch(() => {});
    } else {
      setDbStudentImage(null);
      setMatchedStudentName(null);
    }
  }, [rollNo]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIF).', 'error');
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setLocationFilter('ALL');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('');
  };

  // Smart Natural Language & Filtered Violations Engine
  const filteredViolations = violations.filter((v) => {
    const sQuery = search.toLowerCase().trim();

    let matchesSearch = true;
    if (sQuery) {
      if (sQuery.includes('unresolved') || sQuery.includes('pending')) {
        matchesSearch = ['Pending', 'Detected', 'Under Review'].includes(v.status);
      } else {
        matchesSearch =
          v.roll_no.toLowerCase().includes(sQuery) ||
          (v.student_name || '').toLowerCase().includes(sQuery) ||
          v.location.toLowerCase().includes(sQuery) ||
          v.remarks.toLowerCase().includes(sQuery) ||
          (v.camera_id || '').toLowerCase().includes(sQuery) ||
          (v._id || '').toLowerCase().includes(sQuery);
      }
    }

    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;
    const matchesLocation = locationFilter === 'ALL' || v.location.toLowerCase() === locationFilter.toLowerCase();
    const matchesDept = deptFilter === 'ALL' || (v.department || '').toUpperCase() === deptFilter.toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

    let matchesDate = true;
    if (dateFilter) {
      const rawDateStr = v.created_at || v.iso_date || v.date || '';
      if (rawDateStr) {
        try {
          const isoFormatted = new Date(rawDateStr).toISOString().slice(0, 10);
          matchesDate = isoFormatted === dateFilter || rawDateStr.startsWith(dateFilter);
        } catch {
          matchesDate = rawDateStr.includes(dateFilter);
        }
      }
    }

    return matchesSearch && matchesType && matchesLocation && matchesDept && matchesStatus && matchesDate;
  });

  const yieldedViolations = filteredViolations.slice(0, displayLimit);
  const hasMoreViolations = filteredViolations.length > displayLimit;

  const handleDelete = async (id: string) => {
    setConfirmState({
      visible: true,
      message: 'Delete this incident record permanently from GuardDB? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await violationService.deleteViolation(id);
          if (selectedIncident?._id === id) {
            setSelectedIncident(null);
          }
          fetchViolations();
          showToast('Incident record deleted successfully.', 'success');
        } catch {
          showToast('Failed to delete incident record.', 'error');
        }
      },
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    try {
      await violationService.updateStatus(id, newStatus);
      fetchViolations();
      if (selectedIncident && selectedIncident._id === id) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
      showToast(`Status updated to "${newStatus}".`, 'success');
    } catch {
      showToast('Failed to update incident status.', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await violationService.createViolation({
        roll_no: rollNo.toUpperCase(),
        type: vType,
        location,
        department: dept,
        section,
        remarks: remarks || (uploadedFile ? 'Uploaded image incident log' : 'Manual entry'),
        captured_image: uploadedImagePreview || undefined,
      });
      setShowAddModal(false);
      setRollNo('');
      setRemarks('');
      setUploadedFile(null);
      setUploadedImagePreview(null);
      setDbStudentImage(null);
      fetchViolations();
      showToast('Campus incident logged successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Incident creation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = 'Incident ID,Roll No,Student Name,Type,Location,Department,Status,Date\n';
    const rows = filteredViolations
      .map(
        (v) =>
          `"${v._id}","${v.roll_no}","${v.student_name || ''}","${v.type}","${v.location}","${v.department}","${v.status}","${v.created_at || v.date || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Incident_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const isFiltered =
    search ||
    typeFilter !== 'ALL' ||
    locationFilter !== 'ALL' ||
    deptFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    dateFilter !== '';

  return (
    <PageTransition className="space-y-5">
      {/* Inline Toast & Confirm Dialog */}
      <InlineToast toast={toast} onDismiss={dismissToast} />
      <InlineConfirmDialog state={confirmState} onCancel={dismissConfirm} />
      {/* Action Controls & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveView('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'table'
                  ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Command Table
            </button>
            <button
              onClick={() => setActiveView('feed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'feed'
                  ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Live Feed
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Showing {yieldedViolations.length} of {filteredViolations.length} records
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="apple-btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#007AFF]" /> Export CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="apple-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} /> Log Incident
          </button>
        </div>
      </div>

      {/* Advanced Search & Smart Filter Control Bar */}
      <div className="glass-panel p-4 rounded-[24px] space-y-3 shadow-md border border-white/60 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-white">
            <Filter className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
            <span>Incident Smart Filters</span>
          </div>

          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-[#FF453A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Global Search */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, roll, ID, or remarks..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#007AFF] font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" strokeWidth={2} />
          </div>

          {/* Date Calendar Picker */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" strokeWidth={2} />
          </div>

          {/* Violation Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Categories</option>
              <option value="Late Arrival">Late Arrival</option>
              <option value="Dress Code">Dress Code</option>
              <option value="Bunk">Bunk</option>
            </select>
          </div>

          {/* Workflow Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Detected">Detected / Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Action Taken">Action Taken</option>
              <option value="Closed">Closed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="IT">IT</option>
              <option value="CIC">CIC</option>
              <option value="CSO">CSO</option>
              <option value="CSM">CSM</option>
              <option value="AIDS">AIDS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area: Feed vs Table */}
      {activeView === 'feed' ? (
        /* Real-Time Live Incident Feed View with 4 to 5 cards per row grid */
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-44 rounded-[22px] glass-panel animate-pulse bg-slate-200/50 dark:bg-white/5" />
              ))}
            </div>
          ) : yieldedViolations.length === 0 ? (
            <div className="glass-panel p-10 rounded-[28px] text-center">
              <EmptyState icon={ShieldAlert} title="No Incidents Found" subtitle="No incident records match your selected filter criteria." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {yieldedViolations.map((v, index) => {
                const confPercent = v.confidence
                  ? (v.confidence > 1 ? v.confidence.toFixed(1) : (v.confidence * 100).toFixed(1))
                  : null;
                const statusStyle = STATUS_BADGE_STYLES[v.status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
                const vTypeStyle = VIOLATION_TYPE_STYLES[v.type] || 'bg-black/5 text-slate-600 border-black/10';
                const avatarUrl = v.captured_image || studentService.getStudentImage(v.roll_no);

                return (
                  <motion.div
                    key={v._id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(0,122,255,0.12)' }}
                    onClick={() => setSelectedIncident(v)}
                    className="glass-panel p-4 rounded-[22px] border border-white/60 dark:border-white/10 shadow-sm cursor-pointer space-y-3 relative group flex flex-col justify-between"
                  >
                    {/* Top Bar: Type Pill & Status Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border truncate ${vTypeStyle}`}>
                        {v.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusStyle}`}>
                        {v.status}
                      </span>
                    </div>

                    {/* Student Avatar & Identification */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/80 dark:border-white/20 shadow-xs shrink-0">
                        <img
                          src={avatarUrl}
                          alt={v.student_name || v.roll_no}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.student_name || v.roll_no)}&background=FFB6C1&color=700&bold=true&rounded=true`;
                          }}
                        />
                      </div>

                      <div className="space-y-0.5 overflow-hidden">
                        <h3 className="font-extrabold text-slate-800 dark:text-white truncate text-xs">
                          {v.student_name || 'Student'}
                        </h3>
                        <p className="text-[11px] font-mono font-bold text-[#007AFF] truncate">
                          {v.roll_no}
                        </p>
                      </div>
                    </div>

                    {/* Telemetry Block: Clean Key-Value Layout */}
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[11px] space-y-1.5">
                      {/* Location Row */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400 font-semibold">Location</span>
                        <span className="font-bold truncate max-w-[110px] flex items-center gap-1">
                          <Building className="w-3 h-3 text-purple-400 shrink-0" />
                          {v.location}
                        </span>
                      </div>

                      {/* Confidence Row */}
                      <div className="flex items-center justify-between text-[#30D158]">
                        <span className="text-[10px] text-slate-400 font-semibold">Vector Match</span>
                        <span className="font-extrabold flex items-center gap-1">
                          <Cpu className="w-3 h-3 shrink-0" />
                          {confPercent ? `${confPercent}%` : 'Verified'}
                        </span>
                      </div>

                      {/* Timestamp Row */}
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="text-[10px] text-slate-400 font-semibold">Time</span>
                        <span className="font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {v.date || formatToIST(v.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Lazy Yielding Controls */}
          {hasMoreViolations && (
            <div className="flex flex-col items-center justify-center p-4 glass-panel rounded-[22px] space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{yieldedViolations.length}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{filteredViolations.length}</span> incident records
              </p>
              <button
                onClick={() => setDisplayLimit((prev) => prev + 10)}
                className="apple-btn-secondary px-6 py-2.5 text-xs font-bold shadow-sm hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#007AFF]" />
                Load Next 10 Incidents
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Default High-Density Command Table View */
        <div className="glass-panel rounded-[26px] overflow-hidden shadow-lg border border-white/60 dark:border-white/10 space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <th className="py-4 px-4.5">Student</th>
                  <th className="py-4 px-4.5">Incident Snapshot</th>
                  <th className="py-4 px-4.5">Violation Category</th>
                  <th className="py-4 px-4.5">Zone Location</th>
                  <th className="py-4 px-4.5">Timestamp</th>
                  <th className="py-4 px-4.5 text-center">Status</th>
                  <th className="py-4 px-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
                ) : yieldedViolations.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={ShieldAlert} title="No incidents found" subtitle="No incident records match your selected filter criteria." />
                    </td>
                  </tr>
                ) : (
                  yieldedViolations.map((v, index) => {
                    const statusStyle = STATUS_BADGE_STYLES[v.status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
                    const enrolledAvatar = studentService.getStudentImage(v.roll_no);
                    const incidentSnapshot = v.captured_image && v.captured_image.trim().length > 0 ? v.captured_image : null;

                    return (
                      <motion.tr
                        key={v._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setSelectedIncident(v)}
                        className="table-row-hover even:bg-white/35 dark:even:bg-white/[0.02] cursor-pointer"
                      >
                        {/* Student Name, Roll No & DB Profile Photo */}
                        <td className="py-3 px-4.5">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModal({ url: enrolledAvatar, title: `${v.student_name || v.roll_no} — Enrolled DB Photo` });
                              }}
                              className="w-9 h-9 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shadow-sm shrink-0 bg-slate-200 dark:bg-slate-800 cursor-pointer hover:scale-110 transition-transform relative group"
                              title="Click to preview Enrolled DB Photo"
                            >
                              <img
                                src={enrolledAvatar}
                                alt={v.student_name || v.roll_no}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.student_name || v.roll_no)}&background=007AFF&color=fff&bold=true`;
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{v.student_name || 'Student'}</div>
                              <div className="text-[11px] font-mono text-[#007AFF] font-extrabold">{v.roll_no}</div>
                            </div>
                          </div>
                        </td>

                        {/* Incident Snapshot Column */}
                        <td className="py-3 px-4.5">
                          {incidentSnapshot ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModal({ url: incidentSnapshot, title: `Incident Snapshot — ${v.student_name || v.roll_no}` });
                              }}
                              className="w-10 h-10 rounded-xl overflow-hidden border border-white/80 dark:border-white/20 shadow-sm bg-slate-200 dark:bg-slate-800 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-[#007AFF] transition-all relative group"
                              title="Click to preview Incident Camera Photo"
                            >
                              <img
                                src={incidentSnapshot}
                                alt="Incident Snapshot"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 text-[10px] font-medium">
                              <Camera className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>No Camera Snapshot</span>
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${VIOLATION_TYPE_STYLES[v.type] || 'bg-black/5 text-slate-600 border-black/10'}`}>
                            {v.type}
                          </span>
                        </td>

                        {/* Zone Location */}
                        <td className="py-3.5 px-4.5 font-medium text-slate-600 dark:text-slate-300">
                          {v.location}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {v.date || formatToIST(v.created_at)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusStyle}`}>
                            {v.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIncident(v);
                              }}
                              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-[#007AFF] transition-colors cursor-pointer"
                              title="Inspect Incident Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(v._id);
                              }}
                              className="p-2 rounded-xl hover:bg-[#FF453A]/15 text-[#FF453A] transition-colors cursor-pointer"
                              title="Delete Incident Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Lazy Yielding Load More Controls */}
          {hasMoreViolations && (
            <div className="flex flex-col items-center justify-center p-4 border-t border-black/5 dark:border-white/10 space-y-2 bg-white/40 dark:bg-white/[0.02]">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{yieldedViolations.length}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{filteredViolations.length}</span> incident records
              </p>
              <button
                onClick={() => setDisplayLimit((prev) => prev + 10)}
                className="apple-btn-secondary px-6 py-2.5 text-xs font-bold shadow-sm hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#007AFF]" />
                Load Next 10 Incidents
              </button>
            </div>
          )}
        </div>
      )}

      {/* Centered Incident Details Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* High-Resolution Image Preview Lightbox */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModal(null)}
            className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] glass-panel rounded-[28px] overflow-hidden border border-white/20 p-2 shadow-2xl flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between px-4 py-2 border-b border-white/10">
                <h3 className="text-xs font-bold text-white truncate">{previewModal.title}</h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 overflow-hidden flex items-center justify-center">
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-h-[70vh] w-auto object-contain rounded-2xl border border-white/10"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Violation Modal (Preserves Drag & Drop / Side-by-side comparison) */}
      <GlassModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Log Campus Incident with Image Verification" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              Upload Incident Photo (Supports PNG, JPG, JPEG, WEBP, HEIF)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragActive ? 'border-[#007AFF] bg-[#007AFF]/10' : 'border-slate-300 dark:border-white/20 hover:border-[#007AFF]/60 bg-black/5 dark:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto text-[#007AFF] mb-1 animate-bounce" strokeWidth={2} />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Drag & drop incident photo here, or <span className="text-[#007AFF] underline">browse file</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG, WEBP, HEIF</p>
            </div>
          </div>

          {(uploadedImagePreview || dbStudentImage) && (
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#007AFF]" /> Side-by-Side Verification
                </span>
                {matchedStudentName && <span className="text-[11px] font-bold text-[#30D158]">{matchedStudentName}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">Uploaded Incident Photo</span>
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-xs flex items-center justify-center">
                    {uploadedImagePreview ? (
                      <img src={uploadedImagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400">No upload</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">Database Enrolled Photo</span>
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-xs flex items-center justify-center">
                    {dbStudentImage ? (
                      <img
                        src={dbStudentImage}
                        alt="DB Enrolled"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rollNo || 'Student')}&background=007AFF&color=fff`;
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Enter Roll No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Student Roll Number</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value.toUpperCase())}
              placeholder="e.g. 23BQ1A05A9"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 font-mono text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Violation Category</label>
              <select
                value={vType}
                onChange={(e) => setVType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="Late Arrival">Late Arrival</option>
                <option value="Dress Code">Dress Code</option>
                <option value="Bunk">Bunk Class</option>
                <option value="Unauthorized Access">Unauthorized Access</option>
                <option value="ID Missing">ID Badge Missing</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Zone Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="Main Gate">Main Gate</option>
                <option value="Playground">Playground</option>
                <option value="OAT">OAT (Open Air Theatre)</option>
                <option value="Central Block">Central Block</option>
                <option value="A Block">A Block</option>
                <option value="B Block">B Block</option>
                <option value="C Block">C Block</option>
                <option value="D Block">D Block</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-600 dark:text-slate-300 font-semibold">Remarks & Details</label>
              <span className="text-[10px] text-slate-400 font-medium">Click quick remark to fill</span>
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`Select quick remarks below for ${vType} or enter details...`}
              className="w-full px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF] h-16 text-xs"
            />
            {/* Dynamic Preset Remarks Chips combining Location & Violation Type */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {((loc: string, vt: string) => {
                const locName = loc === 'OAT' ? 'OAT (Open Air Theatre)' : loc;
                if (vt === 'Late Arrival') {
                  return [
                    `Late Arrival at ${locName}`,
                    `Late Arrival at ${locName} after 9:00 AM`,
                    `Delayed entry scan at ${locName}`,
                    `Repeated late entry flag at ${locName}`,
                  ];
                }
                if (vt === 'Dress Code') {
                  return [
                    `Dress Code Violation at ${locName}`,
                    `Improper uniform at ${locName}`,
                    `Missing blazer/shirt at ${locName}`,
                    `Formal grooming non-compliance at ${locName}`,
                  ];
                }
                if (vt === 'Bunk' || vt === 'Bunk Class') {
                  return [
                    `Bunking Class - loitering near ${locName}`,
                    `Found at ${locName} during lecture hours`,
                    `Unapproved absence near ${locName}`,
                    `Gathering near ${locName} during lab hour`,
                  ];
                }
                if (vt === 'ID Missing' || vt === 'No ID Card') {
                  return [
                    `No ID Card at ${locName}`,
                    `Failed ID scan at ${locName}`,
                    `Temporary pass issued at ${locName}`,
                  ];
                }
                return [
                  `Unauthorized movement near ${locName}`,
                  `Unapproved exit attempt at ${locName}`,
                  `Restricted zone flag at ${locName}`,
                ];
              })(location, vType).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRemarks(preset)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer border ${
                    remarks === preset
                      ? 'bg-[#007AFF]/20 text-[#007AFF] border-[#007AFF]/40 font-bold'
                      : 'bg-black/5 dark:bg-white/10 hover:bg-[#007AFF]/15 hover:text-[#007AFF] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="apple-btn-secondary px-4 py-2 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="apple-btn-primary px-4 py-2 text-xs font-bold shadow-md disabled:opacity-50">
              {isSubmitting ? 'Logging...' : 'Log Campus Incident'}
            </button>
          </div>
        </form>
      </GlassModal>
    </PageTransition>
  );
};
