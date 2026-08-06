import React, { useState } from 'react';
import { Sun, Moon, Bell, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Campus Intelligence Overview',
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/detect': 'Recognition',
  '/violations': 'Violations',
  '/reports': 'Reports',
  '/users': 'User Admin',
  '/settings': 'Settings',
};

interface HeaderProps {
  onOpenAI?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAI }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <header className="glass-panel sticky top-4 z-20 h-16 rounded-[22px] px-6 flex items-center justify-between shadow-md border border-white/50 dark:border-white/10">
      {/* Left: Page Title */}
      <h1 className="text-lg font-bold text-slate-700 dark:text-slate-200">
        {title}
      </h1>

      {/* Middle: Prominent Liquid Glossy Ask AI Button */}
      <div className="flex-1 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenAI}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#BF5AF2]/20 via-[#007AFF]/20 to-rose-400/20 hover:from-[#BF5AF2]/30 hover:via-[#007AFF]/30 hover:to-rose-400/30 text-slate-800 dark:text-slate-100 border border-white/70 dark:border-white/20 font-bold text-xs shadow-sm backdrop-blur-xl transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#BF5AF2] animate-pulse shrink-0" strokeWidth={2.2} />
          <span className="tracking-wide">Ask AI Copilot</span>
        </motion.button>
      </div>

      {/* Right: Theme Toggle + Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer overflow-hidden relative"
          title="Toggle Dark/Light Mode"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ y: -16, opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
              exit={{ y: 16, opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#FF9F0A]" strokeWidth={2} /> : <Moon className="w-4 h-4 text-slate-600" strokeWidth={2} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all relative"
          >
            <Bell className="w-4 h-4" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF453A] rounded-full border-2 border-white dark:border-[#1C1C1E] animate-pulse" />
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-76 rounded-[22px] glass-panel border border-white/60 dark:border-white/10 shadow-xl p-4 z-50 text-xs"
              >
                <h4 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">System Notifications</h4>
                <div className="space-y-2 text-slate-500 dark:text-slate-400">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">ArcFace Engine Online</p>
                    <p className="text-[11px] mt-0.5">Recognition pipeline active.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
