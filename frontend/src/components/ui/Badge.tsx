import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  glow?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  glow = false,
}) => {
  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    neutral: 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-indigo-500',
    neutral: 'bg-slate-400',
  };

  const glowStyles = {
    success: 'badge-glow-success',
    warning: 'badge-glow-warning',
    danger: 'badge-glow-danger',
    info: 'badge-glow-info',
    neutral: '',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border backdrop-blur-md ${variantStyles[variant]} ${sizeStyles[size]} ${pulse ? 'badge-pulse' : ''} ${glow ? glowStyles[variant] : ''}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
};
