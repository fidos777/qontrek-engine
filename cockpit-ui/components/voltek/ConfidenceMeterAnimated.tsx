"use client";

import { motion } from "framer-motion";
import { getMotionProps } from "@/lib/utils/motion";

interface ConfidenceMeterAnimatedProps {
  value: number;
  label?: string;
  showProofSync?: boolean;
}

/**
 * Animated confidence/trust meter with pulse animation
 * Features:
 * - Animated bar fill from 0% to target value
 * - Pulsing percentage text
 * - Optional proof sync indicator
 */
export function ConfidenceMeterAnimated({
  value,
  label = "Trust Index",
  showProofSync = true,
}: ConfidenceMeterAnimatedProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <motion.div
          className="text-lg font-bold text-gray-900"
          {...getMotionProps({
            animate: {
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            },
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          })}
        >
          {percentage}%
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      {/* Proof Sync Indicator */}
      {showProofSync && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            {...getMotionProps({
              animate: {
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              },
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            })}
          />
          <span>Proof sync verified</span>
        </div>
      )}
    </div>
  );
}
