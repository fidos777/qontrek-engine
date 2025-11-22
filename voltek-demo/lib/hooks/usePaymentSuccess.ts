'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export function usePaymentSuccess(recentSuccessCount: number) {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (recentSuccessCount > 0 && !hasTriggered) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        });
      }

      setHasTriggered(true);
    }
  }, [recentSuccessCount, hasTriggered]);

  return hasTriggered;
}
