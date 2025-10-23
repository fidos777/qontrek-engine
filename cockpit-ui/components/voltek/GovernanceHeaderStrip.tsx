'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import { emitBadgeCycle } from '@/lib/events/governance-events';

/**
 * Governance badge definitions (G13-G18)
 * Each badge represents a governance cycle with unique color gradient
 */
const GOVERNANCE_BADGES = [
  { id: 'G13', name: 'Audit Mirror', color: 'from-blue-500 to-cyan-500' },
  { id: 'G14', name: 'Proof Digest', color: 'from-cyan-500 to-teal-500' },
  { id: 'G15', name: 'Federation Sync', color: 'from-teal-500 to-green-500' },
  { id: 'G16', name: 'Tower Receipt', color: 'from-green-500 to-emerald-500' },
  { id: 'G17', name: 'Observatory', color: 'from-emerald-500 to-lime-500' },
  { id: 'G18', name: 'Resilience', color: 'from-lime-500 to-yellow-500' },
];

interface GovernanceHeaderStripProps {
  /**
   * Cycle interval in milliseconds (default: 3000ms)
   */
  cycleInterval?: number;
  /**
   * Show footer with sync info (default: true)
   */
  showFooter?: boolean;
  /**
   * Last sync timestamp for footer display
   */
  lastSync?: Date;
}

/**
 * GovernanceHeaderStrip Component
 * R1.5.2 - Animated Tower badges with cycling, pulse effects, and governance info
 *
 * Features:
 * - Cycles through G13-G18 badges every 3s
 * - Active badge glows with blue ring + soft shadow pulse
 * - Hover tooltips show badge name
 * - Animated Shield and CheckCircle2 icons
 * - Real-time sync status in footer
 * - Respects prefers-reduced-motion
 */
export default function GovernanceHeaderStrip({
  cycleInterval = 3000,
  showFooter = true,
  lastSync = new Date(),
}: GovernanceHeaderStripProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeSinceSync, setTimeSinceSync] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Badge cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % GOVERNANCE_BADGES.length;
        const nextBadge = GOVERNANCE_BADGES[nextIndex];

        // Emit badge cycle event
        emitBadgeCycle(nextBadge.id, nextBadge.name);

        return nextIndex;
      });
    }, cycleInterval);

    // Emit initial badge
    emitBadgeCycle(GOVERNANCE_BADGES[0].id, GOVERNANCE_BADGES[0].name);

    return () => clearInterval(interval);
  }, [cycleInterval]);

  // Update time since last sync every second
  useEffect(() => {
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
      setTimeSinceSync(seconds);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [lastSync]);

  const currentBadge = GOVERNANCE_BADGES[currentIndex];

  // Format time since sync
  const formatTimeSince = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Governance Badges */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBadge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                className="relative group"
              >
                {/* Badge with glow effect */}
                <div
                  className={`
                    relative px-4 py-2 rounded-lg
                    bg-gradient-to-r ${currentBadge.color}
                    ${!prefersReducedMotion ? 'shadow-lg' : ''}
                  `}
                  style={{
                    boxShadow: prefersReducedMotion
                      ? 'none'
                      : '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {/* Pulse animation */}
                  {!prefersReducedMotion && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-blue-400 opacity-20"
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.2, 0.3, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Badge content */}
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{currentBadge.id}</span>
                  </div>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {currentBadge.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Badge progress indicators */}
            <div className="flex gap-1">
              {GOVERNANCE_BADGES.map((badge, idx) => (
                <div
                  key={badge.id}
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all duration-300
                    ${idx === currentIndex ? 'bg-blue-400 w-4' : 'bg-slate-600'}
                  `}
                />
              ))}
            </div>
          </div>

          {/* Center: Icons */}
          <div className="flex items-center gap-4">
            {/* Shield icon with rotation */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      rotate: [0, 10, -10, 0],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Shield className="w-6 h-6 text-blue-400" />
            </motion.div>

            {/* CheckCircle2 icon with opacity pulse */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      opacity: [0.5, 1, 0.5],
                    }
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </motion.div>
          </div>

          {/* Right: Tower info */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">
              Tower Federation
            </div>
            <div className="text-xs text-slate-500">
              Genesis Layer Active
            </div>
          </div>
        </div>
      </div>

      {/* Footer with sync info */}
      {showFooter && (
        <div className="border-t border-slate-700/50 bg-slate-900/50">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="font-medium">Genesis Certified (G21)</span>
                <span className="text-slate-500">•</span>
                <span>Last sync: {formatTimeSince(timeSinceSync)}</span>
              </div>

              {/* Pulsing status dot */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-blue-400"
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          opacity: [0.3, 1, 0.3],
                          scale: [1, 1.2, 1],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <span className="text-blue-400 font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
