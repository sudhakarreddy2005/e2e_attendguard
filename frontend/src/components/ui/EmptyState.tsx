import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'No results found',
  subtitle = "Try adjusting your search or filter to find what you're looking for.",
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 border border-[#007AFF]/20 dark:border-[#0A84FF]/20 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#007AFF] dark:text-[#0A84FF]" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-bold text-[#1E293B] dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium max-w-xs leading-relaxed">
        {subtitle}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 apple-btn-primary px-5 py-2.5 text-xs font-bold"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
