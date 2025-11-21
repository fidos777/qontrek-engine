import { useState, useEffect, useRef } from 'react';

/**
 * Hook that animates a number from 0 to the target value
 * @param target - The final value to count up to
 * @param duration - Animation duration in seconds
 * @param delay - Delay before starting animation in seconds
 * @param decimals - Number of decimal places to display
 */
export function useCountUpValue(
  target: number,
  duration: number = 1.2,
  delay: number = 0,
  decimals: number = 0
): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when target changes
    setValue(0);
    startTimeRef.current = null;

    const delayMs = delay * 1000;
    const durationMs = duration * 1000;

    const timeoutId = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = eased * target;

        setValue(currentValue);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, delay]);

  // Round to specified decimal places
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
