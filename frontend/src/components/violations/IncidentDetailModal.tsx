import React, { useState, useEffect } from 'react';
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
  Eye,
  X,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  if (!incident) return null;

  const enrolledImg = studentService.getStudentImage(incident.roll_no);
  const hasCapturedImage = Boolean(incident.captured_image && incident.captured_image.trim().length > 0);
  const capturedImg = hasCapturedImage ? (incident.captured_image as string) : null;

  const incidentShortId = incident._id ? incident._id.slice(-8).toUpperCase() : 'INC';
  const incidentDate = incident.date || formatToIST(incident.created_at || incident.iso_date);

  const currentStatusStyle = STATUS_BADGE_STYLES[incident.status] || {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  const confPercent = incident.confidence
    ? (incident.confidence > 1 ? incident.confidence.toFixed(1) : (incident.confidence * 100).toFixed(1)) + '%'
    : 'Verified Log';

  const loggedBy = incident.reviewed_by || (incident.detection_method === 'automatic' ? 'Vision AI Logger' : 'Administrator');

  return (
    <>
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

          {/* Student Identity & Side-by-Side Photo Comparison */}
          <div className="p-4 rounded-2xl glass-panel border border-white/60 dark:border-white/10 space-y-4">
            {/* Student Info Row */}
            <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/10">
              <div
                onClick={() => setPreviewImage({ url: enrolledImg, title: `${incident.student_name || incident.roll_no} — DB Profile` })}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Click to preview Enrolled DB Photo"
              >
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

            {/* Side-by-Side: Incident Snapshot + DB Enrolled Record */}
            <div className="grid grid-cols-2 gap-4">
              {/* Incident Snapshot */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-[#007AFF]" /> Incident Snapshot
                </span>
                {capturedImg ? (
                  <div
                    onClick={() => setPreviewImage({ url: capturedImg, title: `Incident Snapshot — ${incident.student_name || incident.roll_no}` })}
                    className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-inner relative group cursor-pointer hover:ring-2 hover:ring-[#007AFF] transition-all"
                  >
                    <img
                      src={capturedImg}
                      alt="Incident Snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 flex flex-col items-center justify-center p-2 text-slate-400 text-[10px]">
                    <Camera className="w-6 h-6 stroke-1 mb-1 text-slate-400" />
                    <span>No Camera Snapshot</span>
                  </div>
                )}
              </div>

              {/* DB Enrolled Photo */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-400" /> Enrolled DB Record
                </span>
                <div
                  onClick={() => setPreviewImage({ url: enrolledImg, title: `${incident.student_name || incident.roll_no} — Enrolled DB Photo` })}
                  className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-inner relative group cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <img
                    src={enrolledImg}
                    alt="Enrolled Student"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.roll_no)}&background=007AFF&color=fff`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
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
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#007AFF]" /> Detection Method
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                  {incident.detection_method === 'automatic' ? 'Vision AI Engine' : 'Manual Registry'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#30D158]" /> ArcFace Match
                </span>
                <p className="font-bold text-[#30D158]">
                  {confPercent}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-500" /> Academic Term
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Semester {incident.semester || '3-1'} ({incident.academic_year || '2025-2026'})
                </p>
              </div>

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

      {/* Lightbox High-Resolution Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
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
                <h3 className="text-xs font-bold text-white truncate">{previewImage.title}</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 overflow-hidden flex items-center justify-center">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[70vh] w-auto object-contain rounded-2xl border border-white/10"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
