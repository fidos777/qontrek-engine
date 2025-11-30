"use client";

import { useEffect, useState } from "react";
import * as confetti from "canvas-confetti";
import type { Snapshot } from "../../lib/voltek/snapshotStore";

interface ImpactSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  before: Snapshot | null;
  after: Snapshot | null;
}

interface DeltaMetric {
  label: string;
  before: number;
  after: number;
  delta: number;
  format: (val: number) => string;
}

/**
 * Animated counter hook - counts from start to end value
 */
function useAnimatedCounter(
  end: number,
  duration: number = 1000,
  shouldAnimate: boolean = true
): number {
  const [count, setCount] = useState(end);

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    const start = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quad
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      setCount(start + (end - start) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, shouldAnimate]);

  return count;
}

/**
 * Impact Summary Modal
 * Shows before/after KPI deltas with animated counters
 */
export function ImpactSummaryModal({
  isOpen,
  onClose,
  before,
  after,
}: ImpactSummaryModalProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  if (!isOpen) return null;

  // Calculate deltas
  const metrics: DeltaMetric[] = [];

  if (before && after) {
    const trustDelta = after.trust_index - before.trust_index;

    metrics.push({
      label: "Recovery Rate (7d)",
      before: before.recovery_rate_7d,
      after: after.recovery_rate_7d,
      delta: after.recovery_rate_7d - before.recovery_rate_7d,
      format: (val) => `${(val * 100).toFixed(1)}%`,
    });

    metrics.push({
      label: "Success Rate",
      before: before.success_rate,
      after: after.success_rate,
      delta: after.success_rate - before.success_rate,
      format: (val) => `${(val * 100).toFixed(1)}%`,
    });

    metrics.push({
      label: "Trust Index",
      before: before.trust_index,
      after: after.trust_index,
      delta: trustDelta,
      format: (val) => val.toFixed(1),
    });

    // Trigger confetti if trust delta >= 3
    if (trustDelta >= 3 && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      if (typeof window !== "undefined") {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7"],
        });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Impact Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {!before || !after ? (
          <div className="text-center py-8 text-gray-500">
            No snapshot data available
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Import completed. Here's how your KPIs changed:
            </p>

            {metrics.map((metric) => (
              <MetricRow key={metric.label} metric={metric} />
            ))}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Single metric row with animated delta
 */
function MetricRow({ metric }: { metric: DeltaMetric }) {
  const animatedDelta = useAnimatedCounter(metric.delta, 1200);
  const deltaPercent = metric.before !== 0
    ? ((metric.delta / metric.before) * 100)
    : 0;

  const deltaColor =
    metric.delta > 0
      ? "text-green-600"
      : metric.delta < 0
      ? "text-red-600"
      : "text-gray-600";

  const bgColor =
    metric.delta > 0
      ? "bg-green-50"
      : metric.delta < 0
      ? "bg-red-50"
      : "bg-gray-50";

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-700">{metric.label}</span>
        <span className={`text-lg font-bold ${deltaColor}`}>
          {metric.delta > 0 ? "+" : ""}
          {metric.format(animatedDelta)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="text-gray-500">Before:</span>{" "}
          <span className="font-medium">{metric.format(metric.before)}</span>
        </div>
        <div>
          <span className="text-gray-500">After:</span>{" "}
          <span className="font-medium">{metric.format(metric.after)}</span>
        </div>
        {deltaPercent !== 0 && (
          <div className={`${deltaColor} font-medium`}>
            ({deltaPercent > 0 ? "+" : ""}
            {deltaPercent.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
}
