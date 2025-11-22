'use client';

import { motion } from 'framer-motion';

interface Props {
  text: string;
}

export function HologramBadge({ text }: Props) {
  return (
    <div className="relative inline-flex items-center">
      {/* SVG Background with animated gradient */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <motion.stop
              offset="0%"
              stopColor="#3B82F6"
              animate={{
                stopOpacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.stop
              offset="50%"
              stopColor="#9333EA"
              animate={{
                stopOpacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 0.5,
              }}
            />
            <motion.stop
              offset="100%"
              stopColor="#3B82F6"
              animate={{
                stopOpacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 1,
              }}
            />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="200"
          height="40"
          fill="url(#hologramGradient)"
          rx="6"
        />
      </svg>

      {/* Foreground badge */}
      <motion.div
        className="relative z-10 px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden"
        animate={{
          boxShadow: [
            '0 0 10px rgba(59, 130, 246, 0.5)',
            '0 0 20px rgba(147, 51, 234, 0.5)',
            '0 0 10px rgba(59, 130, 246, 0.5)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        {/* Text */}
        <span className="text-sm font-medium text-white">{text}</span>

        {/* Scanning line */}
        <motion.div
          className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
          animate={{
            top: ['0%', '100%', '0%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </div>
  );
}
