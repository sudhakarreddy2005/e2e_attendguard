import React, { useState, useEffect } from 'react';
import { Sliders, Cpu, Save, Trash2, AlertTriangle, ShieldCheck, Database, Server, RefreshCw, Zap, Bell, Mail, BookOpen, Layers } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [threshold, setThreshold] = useState('0.60');
  const [minFaceSize, setMinFaceSize] = useState('80');
  const [llmModel, setLlmModel] = useState('qwen3:8b');
  const [saved, setSaved] = useState(false);
  const [autoLog, setAutoLog] = useState(true);
  const [blurDetection, setBlurDetection] = useState(true);
  const [cnnFallback, setCnnFallback] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [temperature, setTemperature] = useState('0.2');

  // Disciplinary Policy State
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('4-1');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifMode, setNotifMode] = useState<'live' | 'shadow' | 'dry_run'>('live');
  const [threshL1, setThreshL1] = useState(5);
  const [threshL2, setThreshL2] = useState(10);
  const [threshL3, setThreshL3] = useState(15);
  const [committeeEmail, setCommitteeEmail] = useState('discipline@vvit.net');

  useEffect(() => {
    const fetchDisciplineConfig = async () => {
      try {
        const resp = await apiClient.get('/api/settings/discipline');
        if (resp.data?.success && resp.data?.data) {
          const cfg = resp.data.data;
          if (cfg.current_academic_year) setAcademicYear(cfg.current_academic_year);
          if (cfg.current_semester) setSemester(cfg.current_semester);
          if (cfg.notifications_enabled !== undefined) setNotifEnabled(cfg.notifications_enabled);
          if (cfg.notification_mode) setNotifMode(cfg.notification_mode);
          if (cfg.threshold_level_1) setThreshL1(cfg.threshold_level_1);
          if (cfg.threshold_level_2) setThreshL2(cfg.threshold_level_2);
          if (cfg.threshold_level_3) setThreshL3(cfg.threshold_level_3);
          if (cfg.disciplinary_committee_email) setCommitteeEmail(cfg.disciplinary_committee_email);
        }
      } catch (err) {
        console.error('Failed to load discipline config:', err);
      }
    };
    fetchDisciplineConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/api/settings/discipline', {
        current_academic_year: academicYear,
        current_semester: semester,
        notifications_enabled: notifEnabled,
        notification_mode: notifMode,
        threshold_level_1: threshL1,
        threshold_level_2: threshL2,
        threshold_level_3: threshL3,
        disciplinary_committee_email: committeeEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update discipline settings:', err);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Settings & Architecture
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]">
              Apple HIG Specs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Configure ArcFace computer vision parameters, local LLM inference engines, and database synchronization.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="apple-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-lg self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-white" strokeWidth={2} />
          <span>Save Changes</span>
        </button>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" /> System architecture configuration updated and applied live!
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Computer Vision Section */}
        <div className="glass-panel p-6 sm:p-7 rounded-[28px] shadow-lg space-y-6 border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0 border border-[#007AFF]/30">
              <Cpu className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                ArcFace Computer Vision Engine
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Biometric face matching thresholding and image processing pipeline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Cosine Match Threshold
                </label>
                <span className="px-2 py-0.5 rounded-lg bg-[#007AFF] text-white font-mono font-bold text-[11px]">
                  {threshold}
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.85"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full accent-[#007AFF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.40 (Permissive)</span>
                <span>0.60 (Strict)</span>
                <span>0.85 (Ultra-Exact)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Minimum Face Width
                </label>
                <span className="px-2 py-0.5 rounded-lg bg-[#BF5AF2] text-white font-mono font-bold text-[11px]">
                  {minFaceSize} px
                </span>
              </div>
              <input
                type="number"
                value={minFaceSize}
                onChange={(e) => setMinFaceSize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-[#BF5AF2]"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Filters out small or distant faces below this resolution threshold.
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-4 border-t border-black/5 dark:border-white/10">
            <ToggleSwitch
              checked={autoLog}
              onChange={setAutoLog}
              label="Auto-Log Confirmed Matches"
              description="Automatically create violation records in GuardDB when face match confidence exceeds threshold."
            />
            <ToggleSwitch
              checked={blurDetection}
              onChange={setBlurDetection}
              label="Laplacian Variance Blur Filtering"
              description="Skip low-quality blurred camera frames to reduce false negatives during entry scans."
            />
            <ToggleSwitch
              checked={cnnFallback}
              onChange={setCnnFallback}
              label="CNN High-Accuracy Fallback Engine"
              description="Invokes deeper ResNet backbone when cosine match is ambiguous (0.55-0.60)."
            />
          </div>
        </div>

        {/* Institutional Disciplinary Escalation Policy Card */}
        <div className="glass-panel p-6 sm:p-7 rounded-[28px] shadow-lg space-y-6 border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center shrink-0 border border-[#FF9500]/30">
                <Bell className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Institutional Disciplinary Escalation Policy
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Semester-scoped violation thresholds, notification modes, and recipient rules
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
              notifMode === 'live'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : notifMode === 'shadow'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
            }`}>
              {notifMode === 'live' ? '● Live Email Mode' : notifMode === 'shadow' ? '◐ Shadow Test Mode' : '◯ Dry Run Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Active Academic Year */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-[#FF9500]"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2028-2029">2028-2029</option>
              </select>
            </div>

            {/* Active Semester */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-500" /> Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-[#FF9500]"
              >
                <option value="1-1">1-1 (Year 1, Sem 1)</option>
                <option value="1-2">1-2 (Year 1, Sem 2)</option>
                <option value="2-1">2-1 (Year 2, Sem 1)</option>
                <option value="2-2">2-2 (Year 2, Sem 2)</option>
                <option value="3-1">3-1 (Year 3, Sem 1)</option>
                <option value="3-2">3-2 (Year 3, Sem 2)</option>
                <option value="4-1">4-1 (Year 4, Sem 1)</option>
                <option value="4-2">4-2 (Year 4, Sem 2)</option>
              </select>
            </div>

            {/* Delivery Mode */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-500" /> Dispatch Mode
              </label>
              <select
                value={notifMode}
                onChange={(e) => setNotifMode(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-[#FF9500]"
              >
                <option value="live">Live (Real Recipient MS Graph API)</option>
                <option value="shadow">Shadow (Reroute to Test Email)</option>
                <option value="dry_run">Dry Run (Audit Log Only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Level 1 Card */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs">Level 1 Advisory</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  Student Only
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Early warning self-correction advisory email.</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Threshold:</span>
                <input
                  type="number"
                  value={threshL1}
                  onChange={(e) => setThreshL1(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-blue-500/30 text-center font-bold text-xs"
                />
                <span className="text-[11px] text-slate-400 font-medium">Violations</span>
              </div>
            </div>

            {/* Level 2 Card */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">Level 2 Warning</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  Student + Counsellor
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Formal warning notice and mandatory counselling.</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Threshold:</span>
                <input
                  type="number"
                  value={threshL2}
                  onChange={(e) => setThreshL2(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-amber-500/30 text-center font-bold text-xs"
                />
                <span className="text-[11px] text-slate-400 font-medium">Violations</span>
              </div>
            </div>

            {/* Level 3 Card */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs">Level 3 Escalation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300">
                  Student + Counsellor + Committee
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Official referral to Disciplinary Committee.</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Threshold:</span>
                <input
                  type="number"
                  value={threshL3}
                  onChange={(e) => setThreshL3(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-rose-500/30 text-center font-bold text-xs"
                />
                <span className="text-[11px] text-slate-400 font-medium">Violations</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Disciplinary Committee Official Address
              </label>
              <input
                type="email"
                value={committeeEmail}
                onChange={(e) => setCommitteeEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-[#FF9500]"
              />
            </div>

            <div className="flex items-end pb-1">
              <ToggleSwitch
                checked={notifEnabled}
                onChange={setNotifEnabled}
                label="Automated Email Escalations Enabled"
                description="When enabled, newly created violations trigger automatic email notifications."
              />
            </div>
          </div>
        </div>

        {/* Local AI LLM Assistant Section */}
        <div className="glass-panel p-6 sm:p-7 rounded-[28px] shadow-lg space-y-5 border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shrink-0 border border-[#BF5AF2]/30">
              <Sliders className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Executive Intelligence Model
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ollama local LLM inference for executive policy synthesis & risk reasoning
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Active LLM Model
              </label>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-[#BF5AF2]"
              >
                <option value="qwen3:8b">Qwen3 8B Instruct (Recommended for Executive Reasoning)</option>
                <option value="llama3:8b">Llama 3 8B (High Accuracy)</option>
                <option value="mistral:7b">Mistral 7B (Fast Inference)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Model Sampling Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full accent-[#BF5AF2] cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0.0 (Deterministic)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Sync Settings */}
        <div className="glass-panel p-6 sm:p-7 rounded-[28px] shadow-lg space-y-5 border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0 border border-[#30D158]/30">
              <Database className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                GuardDB Synchronization & Data Integrity
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                MongoDB student roster synchronization & audit logging rules
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              checked={autoSync}
              onChange={setAutoSync}
              label="Real-time Roster Auto-Sync"
              description="Keep student profile metadata synchronized with campus database changes automatically."
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 sm:p-7 rounded-[28px] bg-[#FF453A]/10 border border-[#FF453A]/25 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF453A]/20 text-[#FF453A] flex items-center justify-center shrink-0 border border-[#FF453A]/30">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#FF453A] tracking-tight">
                System Maintenance & Storage Reset
              </h3>
              <p className="text-xs text-[#FF453A]/80 font-medium">
                Irreversible maintenance operations. Use only during institutional system resets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-[#FF453A] text-white hover:bg-[#D73A30] text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} /> Re-Index Face Embeddings
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-[#FF453A]/20 text-[#FF453A] hover:bg-[#FF453A]/30 border border-[#FF453A]/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2} /> Purge In-Memory Cache
            </button>
          </div>
        </div>
      </form>
    </PageTransition>
  );
};
