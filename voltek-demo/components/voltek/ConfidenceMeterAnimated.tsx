'use client';

import { motion } from 'framer-motion';
import { useCountUpValue } from '@/lib/hooks/useCountUpValue';

interface Props {
  value: number;
  label?: string;
}

export function ConfidenceMeterAnimated({ value, label = 'Trust Index' }: Props) {
  const displayValue = useCountUpValue(value, 1500, 200);

  const getColor = (val: number) => {
    if (val >= 80) return 'text-green-500';
    if (val >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <motion.div
        className={`text-4xl font-bold ${getColor(value)}`}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {displayValue}%
      </motion.div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor(value)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
