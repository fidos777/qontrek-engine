'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Phone, MessageSquare, MessageCircle, ArrowUpCircle } from 'lucide-react';

interface AISuggestionBadgeProps {
  /**
   * Suggested action type
   */
  action: 'call' | 'sms' | 'whatsapp' | 'escalate';
  /**
   * AI confidence percentage (0-100)
   */
  confidence: number;
  /**
   * Optional reasoning text
   */
  reasoning?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when badge is clicked
   */
  onClick?: () => void;
}

/**
 * Action configuration with icons and colors
 */
const ACTION_CONFIG = {
  call: {
    icon: Phone,
    label: 'Call',
    color: 'from-blue-500 to-cyan-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS',
    color: 'from-green-500 to-emerald-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  whatsapp: {
    icon: MessageCircle,
    label: 'WhatsApp',
    color: 'from-emerald-500 to-teal-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  escalate: {
    icon: ArrowUpCircle,
    label: 'Escalate',
    color: 'from-orange-500 to-red-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

/**
 * AISuggestionBadge Component
 * R1.5.2 - AI-powered suggestion badge with animated sparkles
 *
 * Features:
 * - Purple gradient badge with Sparkles icon (rotating)
 * - Action-specific icons and colors
 * - Confidence percentage display
 * - Fade-in animation with delay
 * - Hover tooltip showing reasoning
 * - Respects prefers-reduced-motion
 */
export default function AISuggestionBadge({
  action,
  confidence,
  reasoning,
  className = '',
  onClick,
}: AISuggestionBadgeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const config = ACTION_CONFIG[action];
  const ActionIcon = config.icon;

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main badge */}
      <motion.button
        className={`
          relative px-4 py-2 rounded-lg
          bg-gradient-to-r from-purple-600/80 to-violet-600/80
          border border-purple-400/30
          backdrop-blur-sm
          hover:border-purple-400/60
          transition-all duration-300
          cursor-pointer
          ${onClick ? 'hover:scale-105' : ''}
        `}
        onClick={onClick}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      >
        {/* Sparkle glow effect */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-purple-400/20"
            animate={{
              opacity: [0.2, 0.4, 0.2],
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
          {/* Rotating Sparkles icon */}
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    rotate: [0, 360],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>

          {/* AI label */}
          <span className="text-xs font-bold text-white">AI:</span>

          {/* Action icon */}
          <ActionIcon className={`w-4 h-4 ${config.textColor}`} />

          {/* Action label */}
          <span className="text-xs font-medium text-white">{config.label}</span>

          {/* Confidence badge */}
          <div className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-black/30">
            <span className="text-xs font-bold text-white">{confidence}%</span>
          </div>
        </div>

        {/* Pulse animation on corners */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute top-0 left-0 w-2 h-2 rounded-full bg-purple-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute top-0 right-0 w-2 h-2 rounded-full bg-violet-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </>
        )}
      </motion.button>

      {/* Tooltip with reasoning */}
      {reasoning && showTooltip && (
        <motion.div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg max-w-xs z-50 border border-purple-400/30"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-purple-400 mb-1">AI Reasoning</div>
              <div className="text-slate-300">{reasoning}</div>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </motion.div>
      )}

      {/* Confidence level indicator */}
      <div className="absolute -bottom-1 left-0 right-0 h-1 bg-slate-800/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${config.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

/**
 * Compact version of AISuggestionBadge
 * For use in table cells or tight spaces
 */
export function AISuggestionBadgeCompact({
  action,
  confidence,
  className = '',
}: Pick<AISuggestionBadgeProps, 'action' | 'confidence' | 'className'>) {
  const config = ACTION_CONFIG[action];
  const ActionIcon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded
        ${config.bgColor} border border-purple-400/20
        ${className}
      `}
    >
      <Sparkles className="w-3 h-3 text-purple-400" />
      <ActionIcon className={`w-3 h-3 ${config.textColor}`} />
      <span className="text-xs font-medium text-slate-300">{confidence}%</span>
    </div>
  );
}
