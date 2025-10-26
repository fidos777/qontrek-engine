'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSnapshot, type GovernanceBadge } from '@/lib/state/voltekStore';
import { on, off } from '@/lib/events/bus';

interface GovernanceHeaderStripProps {
  className?: string;
}

const badgeLevelColors = {
  bronze: 'bg-amber-700 text-amber-100',
  silver: 'bg-slate-400 text-slate-900',
  gold: 'bg-yellow-500 text-yellow-950',
  platinum: 'bg-purple-500 text-purple-50',
};

export default function GovernanceHeaderStrip({ className = '' }: GovernanceHeaderStripProps) {
  const [badges, setBadges] = useState<GovernanceBadge[]>([]);
  const [score, setScore] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Initialize from store snapshot
  useEffect(() => {
    const snapshot = getSnapshot();
    setBadges(snapshot.governance.badges);
    setScore(snapshot.governance.score);
    setDisplayScore(snapshot.governance.score);
  }, []);

  // Subscribe to import:completed events
  useEffect(() => {
    const handleImportCompleted = () => {
      // Re-read store snapshot
      const snapshot = getSnapshot();
      const newScore = snapshot.governance.score;

      // Update badges
      setBadges(snapshot.governance.badges);

      // Trigger pulse animation
      setIsPulsing(true);

      // Update score with animation
      setScore(newScore);

      // Stop pulsing after 1200ms
      const timeout = setTimeout(() => {
        setIsPulsing(false);
      }, 1200);

      return () => clearTimeout(timeout);
    };

    on('import:completed', handleImportCompleted);

    return () => {
      off('import:completed', handleImportCompleted);
    };
  }, []);

  // Animate score counter
  useEffect(() => {
    if (displayScore === score) return;

    const duration = 1200; // 1.2 seconds
    const steps = 60;
    const increment = (score - displayScore) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(prev => prev + increment);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [score, displayScore]);

  return (
    <div className={`flex items-center gap-4 px-6 py-3 bg-slate-900 border-b border-slate-700 ${className}`}>
      {/* Governance Score Chip */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-lg"
        animate={isPulsing ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.6, repeat: isPulsing ? 1 : 0 }}
      >
        <span className="text-sm font-semibold text-white">Gov Score:</span>
        <motion.span
          className="text-2xl font-bold text-white tabular-nums"
          key={score}
        >
          {Math.round(displayScore)}
          <span className="text-sm text-blue-200">/100</span>
        </motion.span>
      </motion.div>

      {/* Governance Badges */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Badges:</span>
        <div className="flex gap-2">
          <AnimatePresence mode="popLayout">
            {badges.map((badge) => (
              <motion.div
                key={badge.id}
                className={`
                  relative px-3 py-1.5 rounded-full text-xs font-medium
                  ${badgeLevelColors[badge.level]}
                  ${isPulsing ? 'animate-ping-subtle' : ''}
                `}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={
                  isPulsing
                    ? {
                        scale: [1, 1.15, 1],
                        opacity: [1, 0.8, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(59, 130, 246, 0)',
                          '0 0 0 8px rgba(59, 130, 246, 0.4)',
                          '0 0 0 0 rgba(59, 130, 246, 0)',
                        ],
                      }
                    : { scale: 1, opacity: 1 }
                }
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  repeat: isPulsing ? 2 : 0,
                  repeatDelay: 0.1,
                }}
              >
                {badge.label}
                {badge.achieved && (
                  <motion.span
                    className="ml-1"
                    animate={isPulsing ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.6, repeat: isPulsing ? 1 : 0 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="ml-auto flex items-center gap-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${isPulsing ? 'bg-green-500' : 'bg-slate-600'}`}
          animate={isPulsing ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.8, repeat: isPulsing ? Infinity : 0 }}
        />
        <span className="text-xs text-slate-400">
          {isPulsing ? 'Updating...' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
