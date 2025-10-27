export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const getMotionConfig = (duration = 0.2) =>
  prefersReducedMotion
    ? { duration: 0 }
    : { duration, ease: [0.22, 0.61, 0.36, 1] };
