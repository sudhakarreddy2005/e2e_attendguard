import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, Calendar, Building, ShieldAlert, CheckCircle2, ChevronDown, RefreshCw } from 'lucide-react';

interface SmartFilterBarProps {
  groupBy: 'type' | 'location' | 'department';
  onGroupByChange: (mode: 'type' | 'location' | 'department') => void;
}

export const SmartFilterBar: React.FC<SmartFilterBarProps> = ({
  groupBy,
  onGroupByChange,
}) => {
  const [showExpanded, setShowExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [blockFilter, setBlockFilter] = useState('All Blocks');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [academicYear, setAcademicYear] = useState('2025 - 2026');
  const [sectionFilter, setSectionFilter] = useState('All Sections');

  const activeFilterCount = [
    dateRange !== 'This Month',
    deptFilter !== 'All Departments',
    blockFilter !== 'All Blocks',
    typeFilter !== 'All Types',
    statusFilter !== 'All Statuses',
    academicYear !== '2025 - 2026',
    sectionFilter !== 'All Sections',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDateRange('This Month');
    setDeptFilter('All Departments');
    setBlockFilter('All Blocks');
    setTypeFilter('All Types');
    setStatusFilter('All Statuses');
    setAcademicYear('2025 - 2026');
    setSectionFilter('All Sections');
  };

  return (
    <div className="glass-panel p-5 rounded-[26px] shadow-lg border border-white/40 dark:border-white/10 space-y-4">
      {/* Top Segmented Control & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Apple Segmented Control for Group By */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" /> Group Analytics By:
          </span>
          <div className="flex items-center p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-xs">
            {(['type', 'location', 'department'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onGroupByChange(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
                  groupBy === mode
                    ? 'apple-active-pill'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Drawer Toggle & Active Pill */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-[#FF453A] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters ({activeFilterCount})
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExpanded(!showExpanded)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all ${
              showExpanded || activeFilterCount > 0
                ? 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border-[#007AFF]/40'
                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border-white/20 dark:border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Smart Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[10px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExpanded ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Expanded Smart Filter Options */}
      <AnimatePresence>
        {showExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pt-4 border-t border-black/5 dark:border-white/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="This Month">This Month (July 2026)</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Semester">Fall Semester 2026</option>
                  <option value="Full Academic Year">Full Academic Year</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Computer Science">Computer Science & Eng (CSE)</option>
                  <option value="Electronics">Electronics & Comm (ECE)</option>
                  <option value="Mechanical">Mechanical Engineering (MECH)</option>
                  <option value="Civil">Civil Engineering (CIVIL)</option>
                  <option value="Electrical">Electrical & Electronics (EEE)</option>
                  <option value="AI & Data Science">AI & Data Science (AIDS)</option>
                </select>
              </div>

              {/* Campus Block */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Campus Block
                </label>
                <select
                  value={blockFilter}
                  onChange={(e) => setBlockFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="All Blocks">All Campus Blocks</option>
                  <option value="Central Gate">Central Gate & Main Lobby</option>
                  <option value="North Academic">North Academic Block</option>
                  <option value="Science Complex">Science Complex & Labs</option>
                  <option value="Library Square">Library Square Entrance</option>
                </select>
              </div>

              {/* Violation Type */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Violation Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="All Types">All Violation Types</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Dress Code">Dress Code Non-Compliance</option>
                  <option value="Unauthorized Access">Unauthorized Entry Flag</option>
                  <option value="ID Missing">ID Badge Missing</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Audit Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Resolved">Resolved & Audited</option>
                  <option value="Pending Audit">Pending Administrative Review</option>
                  <option value="Escalated">Escalated to HOD</option>
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="2025 - 2026">2025 - 2026 Academic Year</option>
                  <option value="2026 - 2027">2026 - 2027 Academic Year</option>
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Section / Cohort
                </label>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/30 dark:border-white/10 focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="All Sections">All Cohort Sections</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
