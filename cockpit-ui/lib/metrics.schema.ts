// lib/metrics.schema.ts
// ⚠️ C3-COMPLIANT - KPI schema + severity resolution + state mapping

import { type SystemState, severityToState } from "./stateGrammar";

export interface KpiThreshold {
  warn: number;
  fail: number;
  direction: "above" | "below"; // "above" = higher is worse, "below" = lower is worse
}

export interface KpiDefinition {
  key: string;
  label: string;
  unit?: string; // e.g., "MYR", "%", "days"
  threshold?: KpiThreshold;
}

// Standard KPI definitions for cockpit dashboards
export const KPI_SCHEMA: Record<string, KpiDefinition> = {
  // CFO Lens
  pipeline: {
    key: "pipeline",
    label: "Pipeline Value",
    unit: "MYR",
  },
  collected: {
    key: "collected",
    label: "Collected",
    unit: "MYR",
  },
  outstanding: {
    key: "outstanding",
    label: "Outstanding",
    unit: "MYR",
    threshold: { warn: 50000, fail: 100000, direction: "above" },
  },
  atRisk: {
    key: "atRisk",
    label: "At Risk",
    unit: "MYR",
    threshold: { warn: 20000, fail: 50000, direction: "above" },
  },
  collectionRate: {
    key: "collectionRate",
    label: "Collection Rate",
    unit: "%",
    threshold: { warn: 0.7, fail: 0.5, direction: "below" },
  },

  // Watchdog
  onTime: {
    key: "onTime",
    label: "On Time",
    unit: "count",
  },
  atRiskCount: {
    key: "atRiskCount",
    label: "At Risk",
    unit: "count",
    threshold: { warn: 10, fail: 20, direction: "above" },
  },
  critical: {
    key: "critical",
    label: "Critical",
    unit: "count",
    threshold: { warn: 5, fail: 10, direction: "above" },
  },

  // Funnel
  conversionRate: {
    key: "conversionRate",
    label: "Conversion Rate",
    unit: "%",
    threshold: { warn: 0.3, fail: 0.2, direction: "below" },
  },
  openRate: {
    key: "openRate",
    label: "Open Rate",
    unit: "%",
    threshold: { warn: 0.4, fail: 0.25, direction: "below" },
  },

  // Lead Timeline
  responseTime: {
    key: "responseTime",
    label: "Response Time",
    unit: "hours",
    threshold: { warn: 24, fail: 48, direction: "above" },
  },
};

/**
 * Resolve severity based on KPI value and threshold
 * Returns a number between 0 (ok) and 1 (fail)
 */
export function resolveSeverity(kpiKey: string, value: number): number {
  const kpi = KPI_SCHEMA[kpiKey];
  if (!kpi || !kpi.threshold) return 0; // No threshold = no severity

  const { warn, fail, direction } = kpi.threshold;

  if (direction === "above") {
    // Higher is worse (e.g., outstanding debt)
    if (value >= fail) return 1.0;
    if (value >= warn) return 0.5;
    return 0.0;
  } else {
    // Lower is worse (e.g., collection rate)
    if (value <= fail) return 1.0;
    if (value <= warn) return 0.5;
    return 0.0;
  }
}

/**
 * Map KPI to system state based on threshold
 */
export function mapKpiToState(kpiKey: string, value: number): SystemState {
  const severity = resolveSeverity(kpiKey, value);
  return severityToState(severity);
}

/**
 * Format KPI value with unit
 */
export function formatKpiValue(kpiKey: string, value: number): string {
  const kpi = KPI_SCHEMA[kpiKey];
  if (!kpi) return String(value);

  switch (kpi.unit) {
    case "MYR":
      return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
      }).format(value);
    case "%":
      return `${Math.round(value * 100)}%`;
    case "days":
    case "hours":
      return `${value.toFixed(1)} ${kpi.unit}`;
    case "count":
      return value.toLocaleString("en-MY");
    default:
      return String(value);
  }
}

/**
 * Get KPI label
 */
export function getKpiLabel(kpiKey: string): string {
  return KPI_SCHEMA[kpiKey]?.label || kpiKey;
}

/**
 * Validate if KPI exists in schema
 */
export function isValidKpi(kpiKey: string): boolean {
  return kpiKey in KPI_SCHEMA;
}
