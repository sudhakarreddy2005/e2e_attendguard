import { Variants } from 'framer-motion';

// Premium Easing Curves
export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
export const SMOOTH_SPRING = { type: 'spring', stiffness: 260, damping: 24 } as const;
export const BOUNCE_SPRING = { type: 'spring', stiffness: 300, damping: 18 } as const;
export const GENTLE_SPRING = { type: 'spring', stiffness: 120, damping: 14 } as const;

// Stagger Container
export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Blur-to-Sharp Fade In Up (Linear/Apple signature reveal)
export const blurFadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(6px)',
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EXPO_OUT,
    },
  },
};

// Simple Fade In
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EXPO_OUT },
  },
};

// Scale In (for cards and badges)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: EXPO_OUT },
  },
};

// Slide In Left/Right
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EXPO_OUT },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EXPO_OUT },
  },
};

// SVG Path Draw Animation
export const pathDrawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: EXPO_OUT },
      opacity: { duration: 0.3 },
    },
  },
};

// Materialize Clip Path Reveal
export const clipPathReveal: Variants = {
  hidden: {
    clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
    opacity: 0,
    y: 40,
  },
  visible: {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EXPO_OUT },
  },
};
