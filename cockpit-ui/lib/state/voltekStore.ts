/**
 * Lightweight computed metrics store for Voltek datasets
 * Session 1A - Data model & store
 *
 * A local-first, event-driven store that:
 * - Holds the latest imported dataset snapshot
 * - Computes derived KPIs and governance status
 * - Emits window events on updates
 * - Provides subscription mechanism for reactivity
 */

import type {
  VoltekDataset,
  VoltekProject,
  ComputedSnapshot,
  KpiSummary,
  GovernanceState,
  SnapshotSubscriber,
  ProofUpdatedDetail,
} from "../data/types";

// ============================================================================
// Store State
// ============================================================================

let currentSnapshot: ComputedSnapshot | null = null;
const subscribers = new Set<SnapshotSubscriber>();

// ============================================================================
// Hashing Utilities
// ============================================================================

/**
 * Generate a stable SHA-256 hash of a snapshot using Web Crypto API
 * Browser-safe implementation
 */
export async function hashSnapshot(data: unknown): Promise<string> {
  // Serialize to stable JSON string with sorted keys
  const jsonString = JSON.stringify(data, null, 0);

  // Convert to Uint8Array
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  // Hash using Web Crypto API
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }

  // Fallback for environments without Web Crypto (Node.js)
  // This is a simple hash for development - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

/**
 * Synchronous simple hash for non-critical use cases
 * Used as fallback when async hashing isn't available
 */
export function hashSnapshotSync(data: unknown): string {
  const jsonString = JSON.stringify(data, null, 0);
  let hash = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(16, "0");
}

// ============================================================================
// KPI Computation
// ============================================================================

/**
 * Compute KPI metrics from a dataset
 */
export function computeKpis(dataset: VoltekDataset): KpiSummary {
  const projects = dataset.projects || [];
  const leads = dataset.leads || [];

  // Calculate recovery rate (average of project recovery rates)
  const projectsWithRecovery = projects.filter(
    (p) => p.recovery_rate_7d !== undefined
  );
  const recovery_rate_7d =
    projectsWithRecovery.length > 0
      ? projectsWithRecovery.reduce((sum, p) => sum + (p.recovery_rate_7d || 0), 0) /
        projectsWithRecovery.length
      : 0;

  // Calculate success rate (average of project success rates)
  const projectsWithSuccess = projects.filter(
    (p) => p.success_rate !== undefined
  );
  const success_rate =
    projectsWithSuccess.length > 0
      ? projectsWithSuccess.reduce((sum, p) => sum + (p.success_rate || 0), 0) /
        projectsWithSuccess.length
      : 0;

  // Calculate trust index (composite of success and recovery)
  const trust_index = (success_rate * 0.6 + recovery_rate_7d * 0.4);

  // Count metrics
  const total_leads = leads.length;
  const total_projects = projects.length;
  const active_projects = projects.filter((p) => p.status === "active").length;

  // Financial metrics
  const total_revenue = projects.reduce(
    (sum, p) => sum + (p.revenue || 0),
    0
  );
  const average_project_value =
    total_projects > 0 ? total_revenue / total_projects : 0;

  // Conversion metrics
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const lead_conversion_rate =
    total_leads > 0 ? (convertedLeads / total_leads) * 100 : 0;

  return {
    recovery_rate_7d,
    success_rate,
    trust_index,
    total_leads,
    total_projects,
    active_projects,
    total_revenue,
    average_project_value,
    lead_conversion_rate,
    computed_at: new Date().toISOString(),
  };
}

// ============================================================================
// Governance Computation
// ============================================================================

/**
 * Compute governance state from a dataset
 * Default badges: G13-G18 with score based on data quality
 */
export function computeGovernance(dataset: VoltekDataset): GovernanceState {
  const defaultBadges = ["G13", "G14", "G15", "G16", "G17", "G18"];

  // Calculate score based on data completeness and quality
  let score = 0;
  const projects = dataset.projects || [];
  const leads = dataset.leads || [];

  // Data presence (30 points)
  if (projects.length > 0) score += 15;
  if (leads.length > 0) score += 15;

  // Data quality (40 points)
  const projectsWithMetrics = projects.filter(
    (p) => p.success_rate !== undefined || p.recovery_rate_7d !== undefined
  ).length;
  if (projects.length > 0) {
    score += (projectsWithMetrics / projects.length) * 20;
  }

  const leadsWithEmail = leads.filter((l) => l.email).length;
  if (leads.length > 0) {
    score += (leadsWithEmail / leads.length) * 20;
  }

  // Recency (30 points)
  const importedAt = new Date(dataset.imported_at);
  const now = new Date();
  const ageInHours = (now.getTime() - importedAt.getTime()) / (1000 * 60 * 60);

  if (ageInHours < 24) {
    score += 30;
  } else if (ageInHours < 72) {
    score += 20;
  } else if (ageInHours < 168) {
    score += 10;
  }

  // Determine compliance level
  let compliance_level: "none" | "partial" | "full" = "none";
  if (score >= 80) {
    compliance_level = "full";
  } else if (score >= 50) {
    compliance_level = "partial";
  }

  return {
    badges: defaultBadges,
    score: Math.min(100, Math.round(score)),
    compliance_level,
    last_audit: new Date().toISOString(),
  };
}

// ============================================================================
// Store Operations
// ============================================================================

/**
 * Set a new dataset snapshot and compute all derived metrics
 * Emits "proof.updated" event to window
 */
export async function setSnapshot(
  dataset: VoltekDataset,
  source: "import" | "supabase" | "manual"
): Promise<void> {
  // Compute derived metrics
  const summary = computeKpis(dataset);
  const governance = computeGovernance(dataset);

  // Generate hash
  const hash = await hashSnapshot(dataset);

  // Calculate freshness (minutes since import)
  const importedAt = new Date(dataset.imported_at);
  const now = new Date();
  const freshness = Math.round((now.getTime() - importedAt.getTime()) / (1000 * 60));

  // Compute totals
  const totals = {
    leads: dataset.leads?.length || 0,
    projects: dataset.projects?.length || 0,
    active_projects: (dataset.projects || []).filter((p) => p.status === "active").length,
    revenue: (dataset.projects || []).reduce((sum, p) => sum + (p.revenue || 0), 0),
  };

  // Create new snapshot
  currentSnapshot = {
    summary,
    governance,
    totals,
    hash,
    source,
    freshness,
    dataset,
    computed_at: new Date().toISOString(),
  };

  // Notify subscribers
  notifySubscribers();

  // Emit window event for proof update
  if (typeof window !== "undefined") {
    const detail: ProofUpdatedDetail = {
      freshness,
      source,
      hash,
      timestamp: new Date().toISOString(),
    };

    const event = new CustomEvent("proof.updated", { detail });
    window.dispatchEvent(event);
  }
}

/**
 * Get the current computed snapshot
 */
export function getSnapshot(): ComputedSnapshot | null {
  return currentSnapshot;
}

/**
 * Subscribe to snapshot changes
 * Returns unsubscribe function
 */
export function subscribe(callback: SnapshotSubscriber): () => void {
  subscribers.add(callback);

  // Immediately call with current snapshot if available
  if (currentSnapshot) {
    callback(currentSnapshot);
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Clear the current snapshot
 */
export function clearSnapshot(): void {
  currentSnapshot = null;
  notifySubscribers();
}

/**
 * Get the number of active subscribers
 */
export function getSubscriberCount(): number {
  return subscribers.size;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Notify all subscribers of the current snapshot
 */
function notifySubscribers(): void {
  if (currentSnapshot) {
    subscribers.forEach((callback) => {
      try {
        callback(currentSnapshot!);
      } catch (error) {
        console.error("Error in snapshot subscriber:", error);
      }
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export const voltekStore = {
  setSnapshot,
  getSnapshot,
  subscribe,
  clearSnapshot,
  getSubscriberCount,
  computeKpis,
  computeGovernance,
  hashSnapshot,
  hashSnapshotSync,
};

export default voltekStore;
