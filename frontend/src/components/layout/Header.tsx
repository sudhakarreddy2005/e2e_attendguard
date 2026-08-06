import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Sparkles, AlertTriangle, ShieldCheck, Mail, ChevronRight, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { violationService } from '../../services/violationService';
import { notificationService, NotificationHistoryItem } from '../../services/notificationService';
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
  const [activeTab, setActiveTab] = useState<'mails' | 'incidents'>('mails');
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [mailHistory, setMailHistory] = useState<NotificationHistoryItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [violationsData, historyData] = await Promise.all([
        violationService.getViolations().catch(() => []),
        notificationService.getHistory(20).catch(() => []),
      ]);

      const sortedViolations = (violationsData || []).slice(-5).reverse();
      setRecentViolations(sortedViolations);
      setMailHistory(historyData || []);

      const totalCount = (historyData?.length || 0) + (sortedViolations?.length || 0);
      setUnreadCount(totalCount > 0 ? Math.min(totalCount, 9) : 0);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
              if (!showNotifications) fetchData();
              setShowNotifications(!showNotifications);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all relative cursor-pointer"
            title="Disciplinary Notifications & Email Status"
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
                className="absolute right-0 mt-3 w-88 sm:w-[410px] rounded-[24px] glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 shadow-2xl p-4 z-50 text-xs backdrop-blur-2xl space-y-3"
              >
                {/* Header Title & Mark Read */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#007AFF]" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Disciplinary Alerts & Mails</h4>
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

                {/* Sub-Tabs: Mails Sent vs Incidents Logged */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1">
                  <button
                    onClick={() => setActiveTab('mails')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'mails'
                        ? 'bg-white dark:bg-white/15 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-[#007AFF]" />
                    Disciplinary Mails ({mailHistory.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'incidents'
                        ? 'bg-white dark:bg-white/15 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F0A]" />
                    Incidents Logged ({recentViolations.length})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="p-5 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#007AFF]" /> Fetching real-time notifications...
                    </div>
                  ) : activeTab === 'mails' ? (
                    /* Sent Disciplinary Mail Audit List */
                    mailHistory.length > 0 ? (
                      mailHistory.map((item) => (
                        <div
                          key={item._id}
                          className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5">
                            <Send className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                {item.student_name || item.roll_number}
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] uppercase tracking-wider shrink-0">
                                {item.delivery_status || 'SENT'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Roll No: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.roll_number}</span> • Level {item.notification_level || 1} Escalation
                            </p>
                            {item.recipient && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                Sent to: {item.recipient}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {item.sent_at ? new Date(item.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently Dispatched'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                        <Mail className="w-6 h-6 mx-auto stroke-1 text-slate-400 mb-1" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No Disciplinary Mails Sent Yet</p>
                        <p className="text-[11px]">Mails dispatch automatically when student violations cross policy thresholds.</p>
                      </div>
                    )
                  ) : (
                    /* Recent Logged Campus Incidents */
                    recentViolations.length > 0 ? (
                      recentViolations.map((v) => (
                        <div
                          key={v.id || v._id}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/violations');
                          }}
                          className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF]/50 transition-all flex items-start gap-3 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 text-[#FF9F0A] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                {v.student_name || v.roll_no}
                              </p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
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
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No active violation alerts
                      </div>
                    )
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
                    View Violations Management Center <ChevronRight className="w-3.5 h-3.5" />
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
