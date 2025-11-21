/**
 * Returns motion props respecting user reduced motion preference
 */
export function getMotionProps(shouldAnimate = true) {
  if (typeof window === 'undefined') return null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !shouldAnimate) {
    return {
      initial: {},
      animate: {},
      transition: { duration: 0 },
    };
  }

  return null;
}
