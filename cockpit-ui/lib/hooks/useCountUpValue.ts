import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 to target (supports decimals)
 * @param end Target value
 * @param duration Duration (seconds)
 * @param delay Delay before animation (seconds)
 * @param decimals How many decimal places (default: 0)
 */
export function useCountUpValue(
  end: number,
  duration = 1.2,
  delay = 0,
  decimals = 0
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const increment = end / (duration * 60); // 60fps

      const timer = setInterval(() => {
        start += increment;

        if (start >= end) {
          setValue(end);
          clearInterval(timer);
        } else {
          const nextValue = decimals > 0
            ? Number(start.toFixed(decimals))
            : Math.floor(start);
          setValue(nextValue);
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [end, duration, delay, decimals]);

  return value;
}
