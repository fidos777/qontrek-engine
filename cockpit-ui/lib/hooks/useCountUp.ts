"use client";

import { useEffect, useState } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  delay?: number;
  decimals?: number;
}

export function useCountUp({ end, duration = 1.2, delay = 0, decimals = 0 }: UseCountUpOptions) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const durationMs = duration * 1000;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / durationMs, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(eased * end);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setValue(end);
        }
      };

      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return decimals > 0 ? Number(value.toFixed(decimals)) : Math.floor(value);
}
