import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'skeleton';

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ width: width || 40, height: height || 40 }}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={{
              height: height || 12,
              width: i === lines - 1 && lines > 1 ? '70%' : width || '100%',
              borderRadius: 6,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`glass-card p-6 rounded-[26px] ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-3 w-24 rounded-md" />
          <div className="skeleton w-11 h-11 rounded-2xl" />
        </div>
        <div className="skeleton h-10 w-20 rounded-lg mb-3" />
        <div className="skeleton h-2.5 w-32 rounded-md" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ width: width || '100%', height: height || 16 }}
    />
  );
};

/** Skeleton row for table loading states */
export const SkeletonTableRow: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="border-b border-black/5 dark:border-white/5">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-4 px-4.5">
        <div className="skeleton h-3 rounded-md" style={{ width: `${50 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);
