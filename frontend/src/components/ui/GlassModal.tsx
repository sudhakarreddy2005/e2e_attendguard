import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const GlassModal = forwardRef<HTMLDivElement, GlassModalProps>(({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}, ref) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => backdropRef.current as HTMLDivElement);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === backdropRef.current) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${maxWidth} glass-panel rounded-[28px] p-6 shadow-2xl`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between mb-5">
                <div>
                  {title && (
                    <h3 className="text-lg font-extrabold text-[#1E293B] dark:text-white">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#64748B] hover:text-[#1E293B] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GlassModal.displayName = 'GlassModal';
