/**
 * Motion utilities for Framer Motion animations
 * Respects user's prefers-reduced-motion setting for accessibility
 */

import type { MotionProps } from "framer-motion";

/**
 * Check if user prefers reduced motion
 * @returns true if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get motion props that respect user preferences
 * Returns empty object if user prefers reduced motion
 *
 * @param props - Motion props to apply
 * @returns Motion props or empty object based on user preference
 */
export function getMotionProps<T extends MotionProps>(
  props: T
): T | Record<string, never> {
  if (prefersReducedMotion()) {
    return {};
  }
  return props;
}

/**
 * Standard animation variants for consistent UX
 */
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 },
  },
};
