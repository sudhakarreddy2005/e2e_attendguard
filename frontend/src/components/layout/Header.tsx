import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { violationService } from '../../services/violationService';
import { Violation } from '../../types/violation';

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
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const fetchRecent = async () => {
    try {
      setLoading(true);
      const data = await violationService.getViolations();
      // Sort newest first & take top 5
      const sorted = (data || []).slice(-5).reverse();
      setRecentViolations(sorted);
      setUnreadCount(sorted.length > 0 ? sorted.length : 0);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [location.pathname]);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

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
            onClick={() => {
              if (!showNotifications) fetchRecent();
              setShowNotifications(!showNotifications);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all relative cursor-pointer"
            title="System & Disciplinary Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#FF453A] text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-3 w-84 sm:w-96 rounded-[24px] glass-panel bg-white/90 dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 shadow-2xl p-4 z-50 text-xs backdrop-blur-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#007AFF]" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Live Campus Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF453A]/15 text-[#FF453A] font-bold text-[10px]">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {/* System Health Item */}
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">ArcFace 512D Vector Engine</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">RetinaFace detector active & operational.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Active System Status</span>
                    </div>
                  </div>

                  {/* Real Incident Notifications */}
                  {loading ? (
                    <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#007AFF]" /> Syncing notifications...
                    </div>
                  ) : recentViolations.length > 0 ? (
                    recentViolations.map((v) => (
                      <div
                        key={v.id || v._id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/violations');
                        }}
                        className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF]/50 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-xl bg-[#FF9F0A]/15 text-[#FF9F0A] flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                              {v.student_name || v.roll_no}
                            </p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                              {v.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {v.location} • {v.department || 'General'}
                          </p>
                          <span className="text-[10px] text-[#007AFF] font-medium mt-1 block group-hover:underline">
                            {v.date || 'Recently logged'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No active violation alerts
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/violations');
                    }}
                    className="text-xs font-bold text-[#007AFF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View All Incidents in Violations Center <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
