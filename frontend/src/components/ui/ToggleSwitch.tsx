import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-xs font-bold text-[#1E293B] dark:text-white block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium block mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`toggle-switch ${checked ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
};
