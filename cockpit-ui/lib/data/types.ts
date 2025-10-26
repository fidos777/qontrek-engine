/**
 * Canonical data types for Voltek project imports
 * Session 1A - Data model & store
 */

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Represents a Voltek lead/prospect
 */
export interface VoltekLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "lost" | "converted";
  source?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Represents a Voltek project
 */
export interface VoltekProject {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed" | "archived";
  lead_id?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  revenue?: number;
  success_rate?: number;
  recovery_rate_7d?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * The complete dataset snapshot containing all imported data
 */
export interface VoltekDataset {
  version: string;
  imported_at: string;
  source: "import" | "supabase" | "manual";
  leads?: VoltekLead[];
  projects?: VoltekProject[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Computed Metrics & KPIs
// ============================================================================

/**
 * Key Performance Indicators derived from the dataset
 */
export interface KpiSummary {
  // Recovery & success metrics
  recovery_rate_7d: number;
  success_rate: number;

  // Trust & quality
  trust_index: number;

  // Volume metrics
  total_leads: number;
  total_projects: number;
  active_projects: number;

  // Financial
  total_revenue: number;
  average_project_value: number;

  // Conversion
  lead_conversion_rate: number;

  // Computed timestamp
  computed_at: string;
}

/**
 * Governance state and compliance badges
 */
export interface GovernanceState {
  badges: string[];
  score: number; // 0-100
  compliance_level: "none" | "partial" | "full";
  last_audit: string;
}

/**
 * Complete computed snapshot combining raw data with derived metrics
 */
export interface ComputedSnapshot {
  // Derived metrics
  summary: KpiSummary;
  governance: GovernanceState;
  totals: Record<string, number>;

  // Provenance
  hash: string;
  source: "import" | "supabase" | "manual";
  freshness: number; // minutes since import

  // Raw dataset reference
  dataset: VoltekDataset;

  // Timestamp
  computed_at: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Detail payload for proof.updated event
 */
export interface ProofUpdatedDetail {
  freshness: number;
  source: "import" | "supabase" | "manual";
  hash: string;
  timestamp: string;
}

/**
 * Custom event for proof updates
 */
export interface ProofUpdatedEvent extends CustomEvent<ProofUpdatedDetail> {
  type: "proof.updated";
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result type for validation operations
 */
export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  issues?: string[];
}

/**
 * Subscription callback type
 */
export type SnapshotSubscriber = (snapshot: ComputedSnapshot) => void;
