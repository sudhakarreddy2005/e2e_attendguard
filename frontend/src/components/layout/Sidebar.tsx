import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scan,
  AlertTriangle,
  FileBarChart2,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  onOpenAI?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const isExpanded = isHovered;

  const formatRoleDisplay = (r?: string) => {
    if (!r) return 'User';
    const norm = r.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (norm === 'SUPERADMIN') return 'Super Admin';
    if (norm === 'PRINCIPAL') return 'Principal';
    if (norm === 'HOD') return 'HOD';
    if (norm === 'DEO') return 'DEO';
    if (norm === 'SECURITY') return 'Security Staff';
    if (norm === 'STUDENT') return 'Student';
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Students', path: '/students', icon: Users, permission: 'students.view' },
    { label: 'Recognition', path: '/detect', icon: Scan, permission: 'recognition.view' },
    { label: 'Violations', path: '/violations', icon: AlertTriangle, permission: 'violations.view' },
    { label: 'Reports', path: '/reports', icon: FileBarChart2, permission: 'reports.view' },
    { label: 'User Admin', path: '/users', icon: UserCheck, permission: 'users.manage' },
    { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' },
    { label: 'Student Portal', path: '/student-portal', icon: GraduationCap, permission: 'student.self' },
  ];

  const navItems = allNavItems.filter((item) => hasPermission(item.permission));

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isExpanded ? '240px' : '72px' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel relative flex flex-col h-[calc(100vh-32px)] sticky top-4 z-30 select-none rounded-[26px] overflow-hidden shadow-xl border border-white/50 dark:border-white/10 shrink-0"
    >
      {/* Brand Header */}
      <div className="flex items-center px-4 h-20 border-b border-black/5 dark:border-white/10 overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] text-white flex items-center justify-center shadow-md shadow-[#007AFF]/20 shrink-0 border border-white/30"
          >
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
          </motion.div>

          <motion.div
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col whitespace-nowrap overflow-hidden"
          >
            <span className="font-bold tracking-tight text-slate-700 dark:text-slate-100 text-base flex items-center gap-1.5">
              AttendGuard
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] font-bold border border-[#007AFF]/20">
                3.0
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">Campus Intelligence</span>
          </motion.div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 relative group overflow-hidden ${
                  isActive
                    ? 'apple-active-pill font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 font-medium'
                }`
              }
              title={!isExpanded ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} strokeWidth={2} />
                  <motion.span
                    animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="truncate whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] overflow-hidden">
        <motion.div
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between mb-2 px-1 whitespace-nowrap overflow-hidden"
        >
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
              {user?.display_name || user?.username || 'User'}
            </span>
            <span className="text-[10px] text-[#007AFF] dark:text-[#0A84FF] font-bold uppercase tracking-wider">
              {formatRoleDisplay(user?.role)}
            </span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#FF453A] hover:bg-[#FF453A]/10 font-semibold text-xs transition-colors overflow-hidden"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400 hover:text-[#FF453A]" strokeWidth={2} />
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="truncate whitespace-nowrap"
          >
            Sign Out
          </motion.span>
        </motion.button>
      </div>
    </motion.aside>
  );
};
