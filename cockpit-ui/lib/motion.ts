// lib/motion.ts
// ⚠️ C3-COMPLIANT - Reduced-motion parity utilities

"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR-safe)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return reducedMotion;
}

/**
 * Soft enter animation classes (respects reduced-motion)
 * Returns Tailwind classes for fade-in effect
 */
export function useSoftEnter(): string {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    // Fallback: gradient + ring instead of animation
    return "ring-1 ring-gray-200";
  }

  // Standard fade-in animation
  return "animate-fade-in";
}

/**
 * Get transition classes (respects reduced-motion)
 */
export function useTransition(duration: "fast" | "normal" | "slow" = "normal"): string {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return ""; // No transitions for reduced-motion
  }

  switch (duration) {
    case "fast":
      return "transition-all duration-150";
    case "slow":
      return "transition-all duration-500";
    default:
      return "transition-all duration-300";
  }
}

/**
 * Get scale hover classes (respects reduced-motion)
 */
export function useScaleHover(): string {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return "hover:ring-2 hover:ring-blue-300"; // Ring instead of scale
  }

  return "hover:scale-105 transition-transform";
}

/**
 * Apply motion parity to any animation class
 * Returns the class if motion is enabled, empty string otherwise
 */
export function withMotionParity(animationClass: string, fallbackClass?: string): string {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return fallbackClass || "";
  }

  return animationClass;
}
