'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';

const GOVERNANCE_BADGES = [
  { id: 'G13', name: 'Audit Mirror', color: 'from-blue-500 to-cyan-500' },
  { id: 'G14', name: 'Proof Digest', color: 'from-cyan-500 to-teal-500' },
  { id: 'G15', name: 'Federation Sync', color: 'from-teal-500 to-green-500' },
  { id: 'G16', name: 'Tower Receipt', color: 'from-green-500 to-emerald-500' },
  { id: 'G17', name: 'Observatory', color: 'from-emerald-500 to-lime-500' },
  { id: 'G18', name: 'Resilience', color: 'from-lime-500 to-yellow-500' },
];

export function GovernanceHeaderStrip() {
  const [activeBadge, setActiveBadge] = useState(0);
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  // Cycle through badges every 3 seconds
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveBadge((prev) => (prev + 1) % GOVERNANCE_BADGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              delay: 3,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Shield className="w-5 h-5 text-blue-400" />
          </motion.div>
          <span className="font-semibold">Governance Status</span>
        </div>
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </motion.div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {GOVERNANCE_BADGES.map((badge, index) => (
          <div
            key={badge.id}
            className="relative"
            onMouseEnter={() => setHoveredBadge(index)}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            <motion.div
              className={`
                relative px-3 py-2 rounded-md text-center cursor-default
                bg-gradient-to-r ${badge.color}
                ${activeBadge === index ? 'ring-2 ring-offset-1 ring-offset-gray-900 ring-blue-400' : ''}
              `}
              animate={
                activeBadge === index
                  ? {
                      boxShadow: [
                        '0 0 0px rgba(59, 130, 246, 0)',
                        '0 0 20px rgba(59, 130, 246, 0.6)',
                        '0 0 0px rgba(59, 130, 246, 0)',
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <span className="text-xs font-medium">{badge.id}</span>
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredBadge === index && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap"
                >
                  {badge.name}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
        <span>Genesis Certified (G21)</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          Last sync:
          <motion.span
            className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
          2s ago
        </span>
      </div>
    </div>
  );
}
