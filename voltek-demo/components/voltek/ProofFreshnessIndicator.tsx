'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  lastUpdated: Date;
}

export function ProofFreshnessIndicator({ lastUpdated }: Props) {
  const [freshnessSeconds, setFreshnessSeconds] = useState(0);

  useEffect(() => {
    const updateFreshness = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
      setFreshnessSeconds(diff);
    };

    // Initial update
    updateFreshness();

    // Update every second
    const interval = setInterval(updateFreshness, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getConfig = () => {
    if (freshnessSeconds < 60) {
      return {
        color: 'bg-green-500',
        textColor: 'text-green-100',
        Icon: CheckCircle2,
        animate: true,
        rotation: false,
      };
    } else if (freshnessSeconds < 300) {
      return {
        color: 'bg-blue-500',
        textColor: 'text-blue-100',
        Icon: Clock,
        animate: false,
        rotation: false,
      };
    } else if (freshnessSeconds < 3600) {
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-100',
        Icon: Clock,
        animate: false,
        rotation: false,
      };
    } else {
      return {
        color: 'bg-orange-500',
        textColor: 'text-orange-100',
        Icon: AlertCircle,
        animate: false,
        rotation: true,
      };
    }
  };

  const formatTime = () => {
    if (freshnessSeconds < 60) {
      return `${freshnessSeconds}s ago`;
    } else if (freshnessSeconds < 3600) {
      return `${Math.floor(freshnessSeconds / 60)}m ago`;
    } else {
      return `${Math.floor(freshnessSeconds / 3600)}h ago`;
    }
  };

  const config = getConfig();
  const IconComponent = config.Icon;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${config.color} ${config.textColor}
      `}
      animate={
        config.animate
          ? {
              opacity: [0.8, 1, 0.8],
            }
          : {}
      }
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    >
      <motion.div
        animate={
          config.rotation
            ? {
                rotate: [0, 360],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <IconComponent className="w-3 h-3" />
      </motion.div>
      <span>Proof: {formatTime()}</span>
    </motion.div>
  );
}
