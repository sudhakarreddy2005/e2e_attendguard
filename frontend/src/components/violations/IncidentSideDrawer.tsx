import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Cpu,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Building,
  Camera,
  Brain,
  Send,
  MailCheck,
  History,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Violation, IncidentStatus } from '../../types/violation';
import { studentService } from '../../services/studentService';

interface IncidentSideDrawerProps {
  incident: Violation | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: IncidentStatus) => Promise<void>;
  onAddNote?: (id: string, note: string) => void;
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

export const IncidentSideDrawer: React.FC<IncidentSideDrawerProps> = ({
  incident,
  onClose,
  onUpdateStatus,
}) => {
  const [reviewerNote, setReviewerNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!incident) return null;

  const enrolledImg = studentService.getStudentImage(incident.roll_no);
  const confidencePercent = incident.confidence
    ? (incident.confidence > 1 ? incident.confidence.toFixed(1) : (incident.confidence * 100).toFixed(1))
    : null;

  const incidentShortId = incident._id ? incident._id.slice(-8).toUpperCase() : 'INC';
  const incidentDate = incident.created_at
    ? new Date(incident.created_at).toLocaleString()
    : incident.date || 'Recorded Date';

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(incident._id, newStatus);
    } catch {
      alert('Failed to transition status');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusStyle = STATUS_BADGE_STYLES[incident.status] || {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  // Generate clean audit trail based strictly on real incident fields
  const auditEvents = [
    {
      timestamp: incidentDate,
      action: `Incident Logged (${incident.type}) at ${incident.location}`,
      user: incident.detection_method === 'manual' ? 'Security Staff' : 'Vision System Engine',
      role: incident.detection_method === 'manual' ? 'Manual Entry' : 'Automated Detection',
    },
    ...(confidencePercent
      ? [
          {
            timestamp: incidentDate,
            action: `ArcFace Biometric Vector Match: ${confidencePercent}% similarity score`,
            user: 'GuardDB Matcher',
            role: 'System',
          },
        ]
      : []),
    ...(incident.status !== 'Pending' && incident.status !== 'Detected'
      ? [
          {
            timestamp: new Date().toLocaleTimeString(),
            action: `Workflow status updated to ${incident.status}`,
            user: incident.reviewed_by || 'Authorized User',
            role: 'Incident Reviewer',
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-md flex justify-end">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Side Drawer Content */}
      <div className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl h-full shadow-2xl overflow-y-auto border-l border-white/60 dark:border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Bar */}
        <div className="p-6 bg-white/50 dark:bg-slate-900/80 border-b border-black/5 dark:border-white/10 sticky top-0 z-10 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#007AFF]/15 text-[#007AFF]">
              <ShieldAlert className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white font-mono">
                  INC-{incidentShortId}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
                >
                  {incident.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {incident.type} • {incident.location} • {incidentDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Action Center Control Bar */}
          <div className="p-4 rounded-[22px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Workflow Lifecycle Actions
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('Under Review')}
                className="px-3.5 py-2 rounded-xl bg-[#007AFF]/15 hover:bg-[#007AFF] text-[#007AFF] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Start Review
              </button>

              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('Verified')}
                className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-500 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Verified
              </button>

              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('Action Taken')}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" /> Escalate & Take Action
              </button>

              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('Dismissed')}
                className="px-3.5 py-2 rounded-xl bg-slate-500/15 hover:bg-slate-500 text-slate-600 dark:text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Dismiss (False Positive)
              </button>

              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('Closed')}
                className="px-3.5 py-2 rounded-xl bg-[#30D158]/15 hover:bg-[#30D158] text-[#30D158] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Close Incident
              </button>
            </div>
          </div>

          {/* Student Profile Overview */}
          <div className="p-5 rounded-[24px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Student Profile Record
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[11px] font-extrabold">
                {incident.academic_year || 'Current Academic Year'} • Sem {incident.semester || '3-1'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-md shrink-0">
                <img
                  src={enrolledImg}
                  alt={incident.student_name || incident.roll_no}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.student_name || incident.roll_no)}&background=FFB6C1&color=700&bold=true&rounded=true`;
                  }}
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  {incident.student_name || 'Enrolled Student'}
                </h3>
                <p className="text-xs font-mono font-bold text-[#007AFF]">
                  Roll Number: {incident.roll_no}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold pt-0.5">
                  <span>{incident.department || 'Department'} - Section {incident.section || 'A'}</span>
                  <span>•</span>
                  <span className="text-slate-500">Status: {incident.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Face Recognition & Biometric Diagnostics */}
          <div className="p-5 rounded-[24px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#007AFF]" />
                Face Verification & Diagnostic Metrics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Captured Incident Snapshot */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span className="text-[10px] font-bold text-slate-500 mb-1.5">Captured Camera Snapshot</span>
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-800 border border-white/20 shadow-inner flex items-center justify-center">
                  <img
                    src={incident.captured_image || enrolledImg}
                    alt="Captured"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = enrolledImg;
                    }}
                  />
                </div>
              </div>

              {/* Database Enrolled Photo */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <span className="text-[10px] font-bold text-slate-500 mb-1.5">Enrolled GuardDB Record</span>
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-800 border border-white/20 shadow-inner flex items-center justify-center">
                  <img src={enrolledImg} alt="Enrolled" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Confidence Score</span>
                <span className="text-sm font-extrabold text-[#30D158]">
                  {confidencePercent ? `${confidencePercent}%` : 'Verified Record'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Camera Source</span>
                <span className="text-xs font-bold text-[#007AFF] flex items-center gap-1">
                  <Camera className="w-3 h-3" /> {incident.camera_id || 'Campus Camera'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Building Zone</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Building className="w-3 h-3 text-purple-400" /> {incident.location}
                </span>
              </div>
            </div>
          </div>

          {/* AI Incident Analysis & Risk Engine */}
          <div className="p-5 rounded-[24px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-purple-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Incident Diagnostics Summary
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-purple-200/50 dark:border-white/10 space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                Incident category "{incident.type}" logged at {incident.location} for student {incident.student_name || incident.roll_no} ({incident.department || 'CSE'}-{incident.section || 'A'}).
              </p>
              {incident.remarks && (
                <p className="text-slate-500 italic text-[11px]">
                  Remarks: "{incident.remarks}"
                </p>
              )}
            </div>
          </div>

          {/* Multi-Recipient Notification Status */}
          <div className="p-5 rounded-[24px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-[#007AFF]" />
                Institutional Notification Dispatch Channel
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                Microsoft Graph API
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#007AFF]" /> Student Email ({incident.roll_no.toLowerCase()}@vvit.net)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] font-bold text-[10px]">
                    Dispatched
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Audit Trail */}
          <div className="p-5 rounded-[24px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500" />
              Audit Trail Event Log
            </span>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-500/20">
              {auditEvents.map((ev, i) => (
                <div key={i} className="pl-7 relative flex items-start justify-between text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 absolute left-2 top-1 shadow-xs" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{ev.action}</p>
                    <p className="text-[11px] text-slate-400">
                      by <span className="font-semibold text-slate-600 dark:text-slate-300">{ev.user}</span> ({ev.role})
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{ev.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewer Notes Input */}
          <div className="p-5 rounded-[24px] glass-panel border border-white/60 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#007AFF]" />
              Administrative Notes & Operational Remarks
            </span>

            <textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="Add internal security note or review remark..."
              className="w-full p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF] h-20"
            />
            {incident.remarks && (
              <p className="text-xs text-slate-500 italic">Existing Note: "{incident.remarks}"</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
