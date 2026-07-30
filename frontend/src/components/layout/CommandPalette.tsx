import React, { useState, useEffect } from 'react';
import { Search, X, User, AlertTriangle, ArrowRight, LayoutDashboard, Users, Scan, FileBarChart2, Settings } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { studentService } from '../../services/studentService';
import { Student } from '../../types/student';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_ACTIONS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', hint: 'Overview & KPIs' },
  { label: 'Students', icon: Users, path: '/students', hint: 'Student Directory' },
  { label: 'Live Scanner', icon: Scan, path: '/detect', hint: 'Face Recognition' },
  { label: 'Reports', icon: FileBarChart2, path: '/reports', hint: 'Analytics' },
  { label: 'Settings', icon: Settings, path: '/settings', hint: 'Configuration' },
];

export const CommandPalette: React.FC = () => {
  const { isOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const students = await studentService.searchStudents(query);
        setResults(students);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 p-4"
          onClick={closeSearch}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -5 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl glass-panel rounded-[28px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4.5 border-b border-white/20 dark:border-white/10">
              <Search className="w-5 h-5 text-[#007AFF] dark:text-[#0A84FF] shrink-0" strokeWidth={2.5} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students by name or roll number..."
                className="w-full px-4 py-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base font-medium"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 rounded-md border border-slate-200 dark:border-slate-800 shadow-xs">
                  ESC
                </kbd>
                <button
                  onClick={closeSearch}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Results Body */}
            <div className="max-h-96 overflow-y-auto p-2.5">
              {isLoading && (
                <div className="p-4 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                    Searching GuardDB...
                  </span>
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No students matching "<span className="font-bold text-slate-900 dark:text-white">{query}</span>"
                </div>
              )}

              {/* Quick Actions (shown when no query) */}
              {!query && (
                <>
                  <div className="p-3.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Quick Navigation
                  </div>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.path}
                        onClick={() => {
                          closeSearch();
                          navigate(action.path);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center">
                            <Icon className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{action.label}</span>
                            <p className="text-[11px] text-slate-400">{action.hint}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" strokeWidth={2} />
                      </div>
                    );
                  })}
                </>
              )}

              {/* Student Results */}
              {results.length > 0 && (
                <>
                  <div className="p-3.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Students ({results.length} found)
                  </div>
                  {results.map((student) => (
                    <div
                      key={student.roll_no}
                      onClick={() => {
                        closeSearch();
                        navigate(`/students?roll=${student.roll_no}`);
                      }}
                      className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] text-white font-bold text-xs flex items-center justify-center shadow-md">
                          {student.roll_no.slice(-3)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {student.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {student.roll_no} • {student.department}-{student.section}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {student.violations_count} Violations
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" strokeWidth={2} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
