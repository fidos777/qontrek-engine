"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { emitProofSync } from "@/lib/events/governance-events";

interface ProofFreshnessIndicatorProps {
  /** Timestamp of last proof update */
  lastUpdated?: Date | string | null;
  /** Source identifier for the proof */
  source?: string;
  /** Additional CSS classes */
  className?: string;
}

const FRESHNESS_STATES = {
  fresh: {
    threshold: 60,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    icon: CheckCircle2,
    label: "Fresh",
  },
  recent: {
    threshold: 300,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    icon: Clock,
    label: "Recent",
  },
  aging: {
    threshold: 3600,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
    icon: Clock,
    label: "Aging",
  },
  stale: {
    threshold: Infinity,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
    icon: AlertCircle,
    label: "Stale",
  },
};

/**
 * ProofFreshnessIndicator v2.0
 * - Handles invalid dates gracefully
 * - Animates states smoothly
 * - Color-coded states (Fresh, Recent, Aging, Stale)
 * - Emits proof.sync events every second
 */
export default function ProofFreshnessIndicator({
  lastUpdated,
  source = "tower",
  className = "",
}: ProofFreshnessIndicatorProps) {
  const [freshness, setFreshness] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Handle motion preferences
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Safe freshness updater
  useEffect(() => {
    const updateFreshness = () => {
      if (!lastUpdated) return;
      const last =
        typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
      if (isNaN(last.getTime())) return; // ⛔ invalid date
      const seconds = Math.floor((Date.now() - last.getTime()) / 1000);
      setFreshness(seconds);
      emitProofSync(seconds, source);
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated, source]);

  // Determine color state
  const getCurrentState = () => {
    if (freshness < FRESHNESS_STATES.fresh.threshold) return FRESHNESS_STATES.fresh;
    if (freshness < FRESHNESS_STATES.recent.threshold) return FRESHNESS_STATES.recent;
    if (freshness < FRESHNESS_STATES.aging.threshold) return FRESHNESS_STATES.aging;
    return FRESHNESS_STATES.stale;
  };

  const currentState = getCurrentState();
  const Icon = currentState.icon;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-3 px-3 py-2 rounded-lg border ${currentState.borderColor} ${currentState.bgColor} transition-colors duration-500 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated Icon */}
      <motion.div
        animate={
          prefersReducedMotion
            ? {}
            : currentState === FRESHNESS_STATES.fresh
            ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }
            : currentState === FRESHNESS_STATES.stale
            ? { rotate: [0, 360] }
            : { opacity: [0.7, 1, 0.7] }
        }
        transition={
          currentState === FRESHNESS_STATES.stale
            ? { duration: 3, repeat: Infinity, ease: "linear" }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Icon className={`w-4 h-4 ${currentState.color}`} />
      </motion.div>

      {/* Text content */}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${currentState.color}`}>
          Proof {formatTime(freshness)}
        </span>
        <span className="text-xs text-slate-500">{currentState.label}</span>
      </div>

      {/* Dot pulse */}
      <motion.div
        className={`w-2 h-2 rounded-full ${currentState.color.replace("text-", "bg-")}`}
        animate={prefersReducedMotion ? {} : { opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

