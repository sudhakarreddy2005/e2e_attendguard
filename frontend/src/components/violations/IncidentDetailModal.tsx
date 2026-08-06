import React from 'react';
import {
  ShieldAlert,
  Building,
  Camera,
  Calendar,
  Tag,
  Cpu,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { Violation } from '../../types/violation';
import { studentService } from '../../services/studentService';
import { GlassModal } from '../ui/GlassModal';

interface IncidentDetailModalProps {
  incident: Violation | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: any) => Promise<void>;
}

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Detected': { bg: 'bg-[#FF9F0A]/15', text: 'text-[#FF9F0A]', border: 'border-[#FF9F0A]/30' },
  'Pending': { bg: 'bg-[#FF9F0A]/15', text: 'text-[#FF9F0A]', border: 'border-[#FF9F0A]/30' },
  'Under Review': { bg: 'bg-[#007AFF]/15', text: 'text-[#007AFF]', border: 'border-[#007AFF]/30' },
  'Reviewed': { bg: 'bg-[#007AFF]/15', text: 'text-[#007AFF]', border: 'border-[#007AFF]/30' },
  'Verified': { bg: 'bg-purple-500/15', text: 'text-purple-500', border: 'border-purple-500/30' },
  'Action Taken': { bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' },
  'Escalated': { bg: 'bg-[#FF3B30]/15', text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/30' },
  'Resolved': { bg: 'bg-[#30D158]/15', text: 'text-[#30D158]', border: 'border-[#30D158]/30' },
  'Closed': { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
  'Dismissed': { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

/**
 * Format any date value to Indian Standard Time (IST).
 * Exported so ViolationsPage can reuse it.
 */
export const formatToIST = (dateVal: string | number | undefined): string => {
  if (!dateVal) return 'Recorded Date';
  try {
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return String(dateVal);
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
    return String(dateVal);
  }
};

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
}) => {
  if (!incident) return null;

  // Use captured snapshot image if available, otherwise fall back to uploaded/enrolled student image
  const enrolledImg = studentService.getStudentImage(incident.roll_no);
  const snapshotImage =
    incident.captured_image && incident.captured_image.trim().length > 0
      ? incident.captured_image
      : enrolledImg;

  const incidentShortId = incident._id ? incident._id.slice(-8).toUpperCase() : 'INC';
  // Backend now sends 'date' pre-formatted in IST, and 'created_at' as IST ISO string
  const incidentDate = incident.date || formatToIST(incident.created_at || incident.iso_date);

  const currentStatusStyle = STATUS_BADGE_STYLES[incident.status] || {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  const confPercent = incident.confidence
    ? (incident.confidence > 1 ? incident.confidence.toFixed(1) : (incident.confidence * 100).toFixed(1)) + '%'
    : 'Verified Log';

  const loggedBy = incident.reviewed_by || (incident.detection_method === 'automatic' ? 'System AI Logger' : 'Administrator');

  return (
    <GlassModal
      isOpen={Boolean(incident)}
      onClose={onClose}
      title={`Campus Incident Record — INC-${incidentShortId}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#007AFF]/15 text-[#007AFF]">
              <ShieldAlert className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-white text-sm">
                  {incident.type}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
                >
                  {incident.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Building className="w-3 h-3 text-purple-400" /> {incident.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {incidentDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Student Identity & Photo Comparison */}
        <div className="p-4 rounded-2xl glass-panel border border-white/60 dark:border-white/10 space-y-4">
          {/* Student Info Row */}
          <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-sm shrink-0">
              <img
                src={enrolledImg}
                alt={incident.student_name || incident.roll_no}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.student_name || incident.roll_no)}&background=007AFF&color=fff&bold=true`;
                }}
              />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                {incident.student_name || 'Enrolled Student'}
              </h3>
              <p className="text-xs font-mono font-bold text-[#007AFF]">
                Roll No: {incident.roll_no}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {incident.department || 'CSE'} - Section {incident.section || 'A'}
              </p>
            </div>
          </div>

          {/* Side-by-Side: Incident Snapshot + Enrolled Photo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Incident Snapshot (captured camera image OR uploaded student photo) */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center">
              <span className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#007AFF]" /> Incident Snapshot
              </span>
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-inner">
                <img
                  src={snapshotImage}
                  alt="Incident Snapshot"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.roll_no)}&background=007AFF&color=fff`;
                  }}
                />
              </div>
            </div>

            {/* Enrolled DB Record */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center">
              <span className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-400" /> Enrolled Record
              </span>
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-inner">
                <img
                  src={enrolledImg}
                  alt="Enrolled Student"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.roll_no)}&background=007AFF&color=fff`;
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Details */}
        {incident.remarks && (
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Incident Remarks</span>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              "{incident.remarks}"
            </p>
          </div>
        )}

        {/* Real Incident Telemetry */}
        <div className="p-4 rounded-2xl glass-panel border border-white/60 dark:border-white/10 space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#007AFF]" /> Incident Telemetry
          </span>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            {/* Detection Method */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#007AFF]" /> Detection Method
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                {incident.detection_method === 'automatic' ? 'Vision AI Engine' : 'Manual Registry'}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#30D158]" /> ArcFace Match
              </span>
              <p className="font-bold text-[#30D158]">
                {confPercent}
              </p>
            </div>

            {/* Academic Term */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500" /> Academic Term
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Semester {incident.semester || '3-1'} ({incident.academic_year || '2025-2026'})
              </p>
            </div>

            {/* Reviewer / Logger */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-400" /> Logged By
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {loggedBy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
