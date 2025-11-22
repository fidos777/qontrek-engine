'use client';

import { motion } from 'framer-motion';

interface Props {
  used: number;
  limit: number;
  label?: string;
}

export function RateLimitMeterPie({ used, limit, label = 'API Usage' }: Props) {
  const percentage = Math.min((used / limit) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-500">
        {used} / {limit}
      </span>
    </div>
  );
}
