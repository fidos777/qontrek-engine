'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface TrustScoreCircleProps {
  value: number;
  size?: number;
}

export function TrustScoreCircle({ value, size = 120 }: TrustScoreCircleProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 15,
    mass: 1,
  });

  // Calculate circle dimensions
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // On value change, spike to ~100 then ease to actual value
    const spikeValue = 100;

    // First spike to 100
    motionValue.set(spikeValue);

    // Then ease to the actual value after a brief delay
    const timeout = setTimeout(() => {
      motionValue.set(value);
    }, 150);

    return () => clearTimeout(timeout);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => unsubscribe();
  }, [springValue]);

  // Calculate stroke dash offset based on spring value
  const offset = circumference - (springValue.get() / 100) * circumference;

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-500 dark:text-blue-400"
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (displayValue / 100) * circumference,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      </svg>

      {/* Center text display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {displayValue}
        </motion.span>
      </div>
    </div>
  );
}
