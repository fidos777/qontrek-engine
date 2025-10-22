// lib/stateGrammar.ts
// ⚠️ C3-COMPLIANT - Central state grammar for system states
// All cockpit components derive visual states from this grammar

export type SystemState = "ok" | "warn" | "fail" | "pending" | "sealed" | "reflex";

export interface StateConfig {
  label: string;
  color: string; // Tailwind color class (text-*)
  bgColor: string; // Tailwind bg class (bg-*)
  borderColor: string; // Tailwind border class (border-*)
  icon: string; // Icon identifier
  ringColor?: string; // Optional ring class for contrast
}

// Central state configuration
export const STATE_GRAMMAR: Record<SystemState, StateConfig> = {
  ok: {
    label: "OK",
    color: "text-green-800",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
    ringColor: "ring-green-300",
    icon: "check-circle",
  },
  warn: {
    label: "Warning",
    color: "text-yellow-800",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-500",
    ringColor: "ring-yellow-300",
    icon: "exclamation-triangle",
  },
  fail: {
    label: "Failed",
    color: "text-red-800",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
    ringColor: "ring-red-300",
    icon: "x-circle",
  },
  pending: {
    label: "Pending",
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-500",
    ringColor: "ring-gray-300", // Added for AA contrast compliance
    icon: "clock",
  },
  sealed: {
    label: "Sealed",
    color: "text-blue-800",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    ringColor: "ring-blue-300",
    icon: "shield-check",
  },
  reflex: {
    label: "Reflex",
    color: "text-purple-800",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-500",
    ringColor: "ring-purple-300",
    icon: "lightning-bolt",
  },
};

/**
 * Get state configuration by state key
 */
export function getStateConfig(state: SystemState): StateConfig {
  return STATE_GRAMMAR[state];
}

/**
 * Render a state badge with consistent styling
 */
export function getStateBadgeClasses(state: SystemState): string {
  const config = getStateConfig(state);
  return `${config.bgColor} ${config.color} ${config.borderColor}`;
}

/**
 * Get ring classes for focus/hover states (accessibility)
 */
export function getStateRingClasses(state: SystemState): string {
  const config = getStateConfig(state);
  return config.ringColor ? `ring-2 ${config.ringColor}` : "";
}

/**
 * Map numeric severity to state
 * 0-0.3 = ok, 0.3-0.7 = warn, 0.7+ = fail
 */
export function severityToState(severity: number): SystemState {
  if (severity < 0.3) return "ok";
  if (severity < 0.7) return "warn";
  return "fail";
}

/**
 * Map boolean status to state
 */
export function booleanToState(status: boolean): SystemState {
  return status ? "ok" : "fail";
}

/**
 * Check if state is terminal (sealed/fail)
 */
export function isTerminalState(state: SystemState): boolean {
  return state === "sealed" || state === "fail";
}

/**
 * Check if state requires action
 */
export function requiresAction(state: SystemState): boolean {
  return state === "warn" || state === "fail" || state === "pending";
}

/**
 * Telemetry throttle to prevent log spam
 * Logs once per minute per (proofRef, route) composite key
 */
const logCache = new Map<string, number>();
export function logProofLoad(proofRef: string, route: string, meta?: Record<string, any>) {
  const compositeKey = `${proofRef}:${route}`;
  const now = Date.now();
  if ((now - (logCache.get(compositeKey) || 0)) < 60000) return;
  logCache.set(compositeKey, now);
  const metaStr = meta ? ` meta=${JSON.stringify(meta)}` : "";
  console.log(`📈 logProofLoad(proofRef=${proofRef}, route=${route}${metaStr})`);
}
