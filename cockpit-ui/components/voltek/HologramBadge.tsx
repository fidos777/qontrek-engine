'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HologramBadgeProps {
  /**
   * Text to display in the hologram badge
   */
  text: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * HologramBadge Component
 * R1.5.2 - Holographic badge with animated gradient and scanning effect
 *
 * Features:
 * - SVG gradient background (blue-purple shifting)
 * - Animated gradient stops with opacity changes
 * - Foreground badge with cycling blue→purple→blue shadow
 * - White scanning line that moves vertically
 * - Respects prefers-reduced-motion
 */
export default function HologramBadge({ text, className = '' }: HologramBadgeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Background SVG with animated gradient */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Animated gradient definition */}
          <linearGradient id="hologram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              offset="0%"
              stopColor="#3b82f6"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      stopOpacity: [0.3, 0.7, 0.3],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.stop
              offset="50%"
              stopColor="#8b5cf6"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      stopOpacity: [0.5, 0.9, 0.5],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
            <motion.stop
              offset="100%"
              stopColor="#3b82f6"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      stopOpacity: [0.3, 0.7, 0.3],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </linearGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hologram-gradient)"
          rx="8"
        />
      </svg>

      {/* Foreground badge with animated shadow */}
      <motion.div
        className="relative px-6 py-3 rounded-lg border border-blue-400/50 backdrop-blur-sm bg-slate-900/80"
        animate={
          prefersReducedMotion
            ? {}
            : {
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                  '0 0 30px rgba(139, 92, 246, 0.7)',
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                ],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Scanning line effect */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
            style={{
              filter: 'blur(1px)',
            }}
            animate={{
              y: [0, 40, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Badge text */}
        <div className="relative z-10 flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-blue-300">
            {text}
          </span>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400/70 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400/70 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400/70 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400/70 rounded-br-lg" />
      </motion.div>

      {/* Outer glow effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background:
              'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            filter: 'blur(10px)',
            zIndex: -1,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
