import { useEffect, useState } from "react";

/**
 * Custom hook for smooth count-up animations from 0 to target value
 * Uses requestAnimationFrame for 60fps performance
 *
 * @param end - Target value to count up to
 * @param duration - Animation duration in seconds (default: 1.2s)
 * @param delay - Delay before animation starts in seconds (default: 0s)
 * @returns Current animated value
 */
export function useCountUpValue(
  end: number,
  duration: number = 1.2,
  delay: number = 0
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease-out cubic function for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutCubic * end);

      setCount(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure we end exactly at target
      }
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        animationFrameId = requestAnimationFrame(step);
      }, delay * 1000);
    } else {
      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [end, duration, delay]);

  return count;
}
