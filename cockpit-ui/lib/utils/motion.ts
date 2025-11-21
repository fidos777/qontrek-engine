/**
 * Returns motion props for framer-motion components
 * This allows conditional enabling of animations based on user preferences
 */
export function getMotionProps(): Record<string, unknown> | null {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return null;
    }
  }

  return {};
}

/**
 * Stagger children animation variants
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Fade in from left animation variant
 */
export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

/**
 * Scale up fade in animation variant
 */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};
