import React, { useState } from 'react';
import { Sliders, Cpu, Save, Trash2, AlertTriangle, ShieldCheck, Database, Server, RefreshCw, Zap } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              label="Multi-Pass CNN Fallback Model"
              description="Deploy secondary CNN face detector if primary HOG detector encounters extreme camera angles."
            />
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
