'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  action: string;
  confidence: number;
}

export function AISuggestionBadge({ action, confidence }: Props) {
  return (
    <motion.div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500 text-purple-100 text-xs font-medium"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{
          rotate: [0, 15, -15, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Sparkles className="w-3 h-3" />
      </motion.div>
      <span>
        AI: {action} ({confidence}%)
      </span>
    </motion.div>
  );
}
