'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { emitProofSync } from '@/lib/events/governance-events';

interface ProofFreshnessIndicatorProps {
  /**
   * Timestamp of last proof update
   */
  lastUpdated: Date;
  /**
   * Source identifier for the proof
   */
  source?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Color state configuration based on freshness
 */
const FRESHNESS_STATES = {
  fresh: {
    // < 60s
    threshold: 60,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    icon: CheckCircle2,
    label: 'Fresh',
  },
  recent: {
    // 60s - 300s (5 min)
    threshold: 300,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    icon: Clock,
    label: 'Recent',
  },
  aging: {
    // 300s - 3600s (1 hour)
    threshold: 3600,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    icon: Clock,
    label: 'Aging',
  },
  stale: {
    // > 3600s
    threshold: Infinity,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    icon: AlertCircle,
    label: 'Stale',
  },
};

/**
 * ProofFreshnessIndicator Component
 * R1.5.2 - Real-time proof freshness indicator with color-coded states
 *
 * Features:
 * - Calculates freshness in seconds (updates every 1s)
 * - Color states: green (<60s), blue (60-300s), yellow (300-3600s), orange (>3600s)
 * - Animated icons with state-specific effects
 * - Smooth color transitions
 * - Emits proof.sync events for monitoring
 * - Respects prefers-reduced-motion
 * - 60fps optimized
 */
export default function ProofFreshnessIndicator({
  lastUpdated,
  source = 'tower',
  className = '',
}: ProofFreshnessIndicatorProps) {
  const [freshness, setFreshness] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Update freshness every second
  useEffect(() => {
    const updateFreshness = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setFreshness(seconds);

      // Emit proof sync event
      emitProofSync(seconds, source);
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, source]);

  // Determine current state based on freshness
  const getCurrentState = () => {
    if (freshness < FRESHNESS_STATES.fresh.threshold) return FRESHNESS_STATES.fresh;
    if (freshness < FRESHNESS_STATES.recent.threshold) return FRESHNESS_STATES.recent;
    if (freshness < FRESHNESS_STATES.aging.threshold) return FRESHNESS_STATES.aging;
    return FRESHNESS_STATES.stale;
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const currentState = getCurrentState();
  const Icon = currentState.icon;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg
        border ${currentState.borderColor} ${currentState.bgColor}
        transition-colors duration-500
        ${className}
      `}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon with state-specific animation */}
      <motion.div
        animate={
          prefersReducedMotion
            ? {}
            : currentState === FRESHNESS_STATES.fresh
            ? {
                // Pulsing for fresh state
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }
            : currentState === FRESHNESS_STATES.stale
            ? {
                // Rotating for stale state
                rotate: [0, 360],
              }
            : {
                // Subtle pulse for other states
                opacity: [0.7, 1, 0.7],
              }
        }
        transition={
          currentState === FRESHNESS_STATES.stale
            ? {
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }
            : {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <Icon className={`w-4 h-4 ${currentState.color}`} />
      </motion.div>

      {/* Text content */}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${currentState.color}`}>
          Proof {formatTime(freshness)}
        </span>
        <span className="text-xs text-slate-500">
          {currentState.label}
        </span>
      </div>

      {/* Status indicator dot */}
      <motion.div
        className={`w-1.5 h-1.5 rounded-full ${currentState.color.replace('text-', 'bg-')}`}
        animate={
          prefersReducedMotion
            ? {}
            : {
                opacity: [0.4, 1, 0.4],
              }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

/**
 * Compact version of ProofFreshnessIndicator
 * For use in tight spaces or navigation bars
 */
export function ProofFreshnessIndicatorCompact({
  lastUpdated,
  source = 'tower',
  className = '',
}: ProofFreshnessIndicatorProps) {
  const [freshness, setFreshness] = useState(0);

  useEffect(() => {
    const updateFreshness = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setFreshness(seconds);
      emitProofSync(seconds, source);
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, source]);

  const getCurrentState = () => {
    if (freshness < 60) return FRESHNESS_STATES.fresh;
    if (freshness < 300) return FRESHNESS_STATES.recent;
    if (freshness < 3600) return FRESHNESS_STATES.aging;
    return FRESHNESS_STATES.stale;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const currentState = getCurrentState();
  const Icon = currentState.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${currentState.color}`} />
      <span className={`text-xs font-medium ${currentState.color}`}>
        {formatTime(freshness)}
      </span>
    </div>
  );
}
