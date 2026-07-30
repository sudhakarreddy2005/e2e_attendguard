import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface PinLockOverlayProps {
  onUnlock: () => void;
  targetName?: string;
  correctPin?: string;
}

export const PinLockOverlay: React.FC<PinLockOverlayProps> = ({
  onUnlock,
  targetName = 'Restricted Page',
  correctPin = '7781',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-panel p-7 rounded-[28px] shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF9F0A]/20">
          <Lock className="w-8 h-8" strokeWidth={2} />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Passcode Required</h3>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Enter administrative PIN to access <span className="font-bold text-slate-700 dark:text-slate-200">{targetName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="••••"
              className={`w-full py-3.5 text-center text-2xl tracking-[0.5em] font-mono rounded-2xl bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white border focus:outline-none transition-all ${
                error
                  ? 'border-[#FF453A] ring-2 ring-[#FF453A]/20'
                  : 'border-white/20 dark:border-white/10 focus:border-[#FF9F0A]'
              }`}
              autoFocus
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-4.5" strokeWidth={2} />
          </div>

          {error && (
            <p className="text-xs font-bold text-[#FF453A] flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2} /> Incorrect PIN passcode
            </p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF9F0A] to-[#FF8800] text-white font-bold text-sm shadow-lg shadow-[#FF9F0A]/30 transition-all disabled:opacity-40"
          >
            Unlock Security Gate
          </button>
        </form>
      </div>
    </div>
  );
};
