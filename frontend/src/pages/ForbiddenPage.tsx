import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF3B30]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FF9500]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel max-w-lg w-full p-8 rounded-[32px] border border-white/50 dark:border-white/10 shadow-2xl backdrop-blur-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9500] text-white flex items-center justify-center shadow-lg shadow-[#FF3B30]/30 border border-white/20"
        >
          <ShieldAlert className="w-10 h-10 text-white" strokeWidth={2} />
        </motion.div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
          403 Access Denied
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          You do not have the required security permissions to view this module.
        </p>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 mb-8 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Authenticated Identity:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200">{user?.email || user?.username || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Assigned Role:</span>
            <span className="font-mono text-[#007AFF] font-bold uppercase">{user?.role || 'None'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Security Enforcement:</span>
            <span className="font-mono text-[#FF3B30] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Permission Restricted
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#00C6FF] text-white font-semibold text-sm shadow-md shadow-[#007AFF]/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </motion.button>
      </motion.div>
    </div>
  );
};
