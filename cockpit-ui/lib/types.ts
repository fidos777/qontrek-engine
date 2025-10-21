// lib/types.ts
// ⚠️ C3-COMPLIANT - Shared TypeScript interfaces for all cockpit components

// ========================================
// CFO Lens Types
// ========================================

export interface CfoSummary {
  pipeline: number;
  collected: number;
  outstanding: number;
  atRisk: number;
}

export interface CfoForecast {
  period: string;
  amount: number;
}

export interface CfoPriority {
  name: string;
  value: number;
  trend: string; // "up" | "down" | "stable"
}

export interface CfoRiskHeat {
  segment: string;
  riskScore: number; // 0-1 scale
}

export interface CfoIncremental {
  phase: string;
  before: number;
  after: number;
}

export interface CfoTowerEval {
  towerEval: number; // 0-1 scale
  parity: number; // 0-1 scale
}

// ========================================
// Watchdog Types
// ========================================

export interface SlaBuckets {
  onTime: number;
  atRisk: number;
  critical: number;
}

export interface CriticalLead {
  name: string;
  daysOverdue: number;
  assignedTo?: string;
}

export interface EscalationRule {
  name: string;
  trigger: string; // "D3" | "D7" | "D21"
  action: string;
}

// ========================================
// Funnel Types
// ========================================

export interface FunnelStep {
  label: string;
  sent: number;
  opened: number;
  clicked: number;
  conversion: number; // 0-1 scale
}

export interface FunnelFilter {
  step: string;
  status: "sent" | "opened" | "clicked" | "converted";
}

// ========================================
// Heatmap Types
// ========================================

export interface HeatCell {
  x: number;
  y: number;
  intensity: number; // 0-1 scale
}

export interface TacticScore {
  tactic: string;
  score: number; // 0-100 scale
}

export interface HeatmapConfig {
  width: number;
  height: number;
  colorScale: string[];
}

// ========================================
// Timeline Types
// ========================================

export interface LeadEvent {
  timestamp: string; // ISO 8601
  type: string; // "call" | "email" | "meeting" | "note"
  note: string;
}

export interface IntentPoint {
  date: string; // ISO 8601
  value: number; // 0-100 scale
}

export interface SimilarCase {
  id: string;
  title: string;
  similarity: number; // 0-1 scale
}

export interface TimelineContext {
  leadId: string;
  leadName: string;
  status: string;
}

// ========================================
// Mobile Types
// ========================================

export interface HotLead {
  name: string;
  score: number; // 0-100 scale
  phone: string;
  lastContact: string; // ISO 8601
  company?: string;
}

export interface MobileAction {
  type: "call" | "whatsapp" | "email";
  label: string;
  url: string;
}

// ========================================
// A/B Experiment Types
// ========================================

export interface Experiment {
  name: string;
  startDate: string; // ISO 8601
  expectedLift: number; // 0-1 scale
  status: "active" | "completed" | "planned";
}

export interface ExperimentResult {
  experiment: string;
  winner: string; // "A" | "B" | "no-diff"
  confidence: number; // 0-1 scale
  ciRange?: [number, number]; // Confidence interval
}

export interface ExperimentDesignDoc {
  url: string;
  title: string;
}

// ========================================
// Tower & Seal Types
// ========================================

export interface SealRequest {
  manifest_path: string;
  gate: string;
  generated_at: string; // ISO 8601
}

export interface SealResponse {
  sealed: boolean;
  duplicate: boolean;
  sealed_at: string; // ISO 8601
  seal_hash: string; // SHA256
  sealed_by: string;
  parent_hash: string | null;
}

export interface LineageAnchor {
  parent_proof: string;
  parent_hash: string | null;
  merkle: {
    root: string | null;
    leaves: string[];
  };
  notes: string;
}

// ========================================
// Telemetry Types
// ========================================

export interface TelemetryEvent {
  event: string;
  rel: string;
  source: "real" | "fallback" | "ui";
  timestamp: string; // ISO 8601
}

export interface TelemetryWindow {
  file: string;
  lastSent: number; // Unix timestamp
  interval: number; // milliseconds
}

// ========================================
// UI Component Types
// ========================================

export interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface BadgeProps {
  state: "ok" | "warn" | "fail" | "pending" | "sealed" | "reflex";
  label?: string;
  size?: "sm" | "md" | "lg";
}

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number; // milliseconds
  ariaLive?: "polite" | "assertive";
}
