import React, { useState } from 'react';
import { Sliders, Cpu, Save, Trash2, AlertTriangle } from 'lucide-react';
import { PinLockOverlay } from '../components/ui/PinLockOverlay';
import { PageTransition } from '../components/ui/PageTransition';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [threshold, setThreshold] = useState('0.60');
  const [minFaceSize, setMinFaceSize] = useState('80');
  const [llmModel, setLlmModel] = useState('qwen3:8b');
  const [saved, setSaved] = useState(false);
  const [autoLog, setAutoLog] = useState(true);
  const [blurDetection, setBlurDetection] = useState(true);
  const [cnnFallback, setCnnFallback] = useState(false);

  if (!isUnlocked) {
    return <PinLockOverlay onUnlock={() => setIsUnlocked(true)} targetName="System Configuration & Thresholds" correctPin="7781" />;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PageTransition className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">System Architecture Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Configure computer vision thresholds, hardware acceleration, and LLM inference</p>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3.5 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] text-xs font-bold flex items-center gap-2">
            ✓ Configuration saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* CV Settings */}
        <div className="glass-panel p-6 rounded-[28px] shadow-lg space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /> ArcFace Computer Vision Engine
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Cosine Similarity Match Threshold (0.40 - 0.85)</label>
              <input type="number" step="0.01" min="0.40" max="0.85" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-900 dark:text-white font-mono" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Recommended: 0.60 (Higher = stricter match)</p>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Minimum Face Width (Pixels)</label>
              <input type="number" value={minFaceSize} onChange={(e) => setMinFaceSize(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-900 dark:text-white font-mono" />
            </div>
            <div className="pt-2 space-y-3.5 border-t border-black/10 dark:border-white/10">
              <ToggleSwitch checked={autoLog} onChange={setAutoLog} label="Auto-Log Violations" description="Automatically create violation records when a face match is confirmed." />
              <ToggleSwitch checked={blurDetection} onChange={setBlurDetection} label="Blur Detection (Laplacian)" description="Skip frames with high blur to reduce false negatives." />
              <ToggleSwitch checked={cnnFallback} onChange={setCnnFallback} label="CNN Fallback Model" description="Use CNN-based detector as fallback when HOG fails to detect faces." />
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="glass-panel p-6 rounded-[28px] shadow-lg space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#BF5AF2]" strokeWidth={2} /> Local LLM Assistant
          </h3>
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Ollama Model</label>
              <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-900 dark:text-white font-semibold">
                <option value="qwen3:8b">Qwen3 8B Instruct (Recommended)</option><option value="llama3:8b">Llama 3 8B</option><option value="mistral:7b">Mistral 7B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone-card p-6 space-y-4">
          <h3 className="text-base font-extrabold text-[#FF453A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" strokeWidth={2} /> Danger Zone
          </h3>
          <p className="text-xs text-[#FF453A]/70 font-medium">These actions are irreversible. Proceed with extreme caution.</p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="apple-btn-danger flex items-center gap-2 px-4 py-2.5 text-xs font-bold">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Reset All Embeddings
            </button>
            <button type="button" className="apple-btn-danger flex items-center gap-2 px-4 py-2.5 text-xs font-bold">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Purge Violation Logs
            </button>
          </div>
        </div>

        <button type="submit" className="apple-btn-primary flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-md">
          <Save className="w-4 h-4 text-white" strokeWidth={2} /> Save System Settings
        </button>
      </form>
    </PageTransition>
  );
};
