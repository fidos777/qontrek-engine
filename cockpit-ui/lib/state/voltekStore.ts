/**
 * Voltek Store - Governance data and state management
 */

export interface GovernanceBadge {
  id: string;
  label: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  achieved: boolean;
}

export interface GovernanceSnapshot {
  badges: GovernanceBadge[];
  score: number;
}

export interface VoltekSnapshot {
  governance: GovernanceSnapshot;
}

// In-memory state
let state: VoltekSnapshot = {
  governance: {
    badges: [
      { id: 'transparency', label: 'Transparency', level: 'gold', achieved: true },
      { id: 'compliance', label: 'Compliance', level: 'silver', achieved: true },
      { id: 'ethics', label: 'Ethics', level: 'gold', achieved: true },
      { id: 'accountability', label: 'Accountability', level: 'bronze', achieved: true },
    ],
    score: 78,
  },
};

export function getSnapshot(): VoltekSnapshot {
  return JSON.parse(JSON.stringify(state)); // Deep clone
}

export function updateGovernance(governance: Partial<GovernanceSnapshot>): void {
  state.governance = {
    ...state.governance,
    ...governance,
  };
}

export function updateGovernanceScore(score: number): void {
  state.governance.score = Math.min(100, Math.max(0, score));
}
