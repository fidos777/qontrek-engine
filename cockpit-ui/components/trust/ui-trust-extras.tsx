"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Fallback Data
// ─────────────────────────────────────────────────────────────────────────────

interface GateStatus {
  gate: string;
  name: string;
  status: "pass" | "partial" | "fail";
  score?: number;
}

interface GovernanceResponse {
  gates: Record<string, { name: string; status: "pass" | "partial" | "fail"; score?: number }>;
}

interface RateLimitResponse {
  usage: number;
  limit: number;
  remaining: number;
  resetAt?: string;
}

const FALLBACK_GOVERNANCE: GovernanceResponse = {
  gates: {
    G13: { name: "Blueprint", status: "pass", score: 98 },
    G14: { name: "Capability", status: "pass", score: 95 },
    G15: { name: "Rollout", status: "partial", score: 78 },
    G16: { name: "ROI Forecast", status: "pass", score: 92 },
    G18: { name: "Observability", status: "pass", score: 88 },
  },
};

const FALLBACK_RATE_LIMIT: RateLimitResponse = {
  usage: 127,
  limit: 1000,
  remaining: 873,
  resetAt: new Date(Date.now() + 3600000).toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Fetch with fallback
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Silent fallback - no console errors per requirements
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GovernanceHeaderStrip (default export)
// ─────────────────────────────────────────────────────────────────────────────

export default function GovernanceHeaderStrip(props?: { refreshMs?: number }): JSX.Element {
  const refreshMs = props?.refreshMs ?? 60000; // Default 60s
  const [gates, setGates] = useState<GateStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchWithFallback<GovernanceResponse>("/api/mcp/governance", FALLBACK_GOVERNANCE);

      const targetGates = ["G13", "G14", "G15", "G16", "G18"];
      const mapped: GateStatus[] = targetGates
        .filter((g) => data.gates[g])
        .map((g) => ({
          gate: g,
          name: data.gates[g].name,
          status: data.gates[g].status,
          score: data.gates[g].score,
        }));

      setGates(mapped);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-500">Loading governance status...</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200"
      role="navigation"
      aria-label="Governance gate status badges"
    >
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        Governance
      </span>
      <div className="flex items-center gap-2" role="list">
        {gates.map((g) => (
          <GateBadge key={g.gate} gate={g} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GateBadge - Individual badge component
// ─────────────────────────────────────────────────────────────────────────────

function GateBadge({ gate }: { gate: GateStatus }): JSX.Element {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800 border-green-300";
      case "partial":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "fail":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTooltipText = (gate: GateStatus) => {
    const statusText = gate.status === "pass" ? "Passed" : gate.status === "partial" ? "Partial" : "Failed";
    const scoreText = gate.score ? ` (Score: ${gate.score})` : "";
    return `${gate.gate}: ${gate.name} - ${statusText}${scoreText}`;
  };

  return (
    <div className="relative" role="listitem">
      <button
        type="button"
        className={`relative px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(
          gate.status
        )}`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        aria-label={getTooltipText(gate)}
        aria-describedby={`tooltip-${gate.gate}`}
      >
        {gate.gate}
      </button>

      {/* Tooltip */}
      {tooltipVisible && (
        <div
          id={`tooltip-${gate.gate}`}
          role="tooltip"
          className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none"
        >
          <div className="font-semibold">{gate.gate}: {gate.name}</div>
          <div className="text-gray-300">
            Status: {gate.status} {gate.score && `• Score: ${gate.score}`}
          </div>
          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RateLimitMeterPie (named export)
// ─────────────────────────────────────────────────────────────────────────────

export function RateLimitMeterPie(props: { title?: string; refreshMs?: number }): JSX.Element {
  const title = props.title ?? "Rate Limit";
  const refreshMs = props.refreshMs ?? 30000; // Default 30s

  const [data, setData] = useState<RateLimitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchWithFallback<RateLimitResponse>("/api/mcp/rate-limit", FALLBACK_RATE_LIMIT);
      setData(result);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 text-center">Loading rate limit data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 text-center">Rate limit data unavailable</div>
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((data.usage / data.limit) * 100));
  const isHighUsage = usagePercent > 85;

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="relative flex-shrink-0">
          <PieChart
            percentage={usagePercent}
            size={120}
            strokeWidth={12}
            shouldShake={isHighUsage && !shouldReduceMotion}
          />
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-sm text-gray-600">Usage</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.usage.toLocaleString()} / {data.limit.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{usagePercent}% used</div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Remaining</div>
            <div className={`text-xl font-semibold ${isHighUsage ? "text-rose-600" : "text-green-600"}`}>
              {data.remaining.toLocaleString()}
            </div>
          </div>

          {data.resetAt && (
            <div className="text-xs text-gray-500">
              Resets: {new Date(data.resetAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Warning badge for high usage */}
      {isHighUsage && (
        <div
          className="mt-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800"
          role="alert"
          aria-live="polite"
        >
          <strong>Warning:</strong> Rate limit usage is high ({usagePercent}%)
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PieChart - Animated SVG pie chart
// ─────────────────────────────────────────────────────────────────────────────

interface PieChartProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  shouldShake: boolean;
}

function PieChart({ percentage, size, strokeWidth, shouldShake }: PieChartProps): JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    if (percentage <= 50) return "#10b981"; // green-500
    if (percentage <= 85) return "#f59e0b"; // amber-500
    return "#f43f5e"; // rose-500
  };

  const shakeAnimation = shouldShake
    ? {
        x: [0, -2, 2, -2, 2, 0],
        y: [0, 2, -2, 2, -2, 0],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
        },
      }
    : {};

  return (
    <motion.div
      animate={shakeAnimation}
      className="relative"
      style={{ width: size, height: size }}
      aria-label={`Rate limit usage: ${percentage} percent`}
      role="img"
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
      </div>
    </motion.div>
  );
}
