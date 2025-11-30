// ============================================
// SOLAR RECENT WINS WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Show recent successful recoveries
// ============================================

import { z } from 'zod';
import type { WidgetSchema, RecentSuccess } from '@/types/solar';

// Zod validation schema
export const RecentSuccessSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  days_to_pay: z.number(),
  paid_at: z.string(),
  stage: z.string(),
});

export const SolarRecentWinsDataSchema = z.object({
  successes: z.array(RecentSuccessSchema),
  total_recovered: z.number(),
  avg_days_to_pay: z.number(),
});

export type SolarRecentWinsData = z.infer<typeof SolarRecentWinsDataSchema>;

// Widget definition
export const SOLAR_RECENT_WINS_SCHEMA: WidgetSchema = {
  id: 'solar_recent_wins',
  name: 'Recent Recoveries',
  description: 'Timeline of recent successful payments',
  category: 'list',
  vertical: 'solar',
  
  data_source: {
    type: 'mcp',
    mcp_tool: 'getPipelineSummary',
    params: {},
    fallback_file: '/data/g2_dashboard_v19.1.json',
  },
  
  ui_hints: {
    size: 'sm',
    color: 'green',
    icon: 'check-circle',
    animate: true,
    priority: 7,
  },
  
  refresh_interval_ms: 60000,
};

// Data transformer
export function transformToRecentWinsData(mcpResponse: {
  recent_success: RecentSuccess[];
}): SolarRecentWinsData {
  const successes = mcpResponse.recent_success;
  const totalRecovered = successes.reduce((sum, s) => sum + s.amount, 0);
  const avgDays = successes.length > 0
    ? successes.reduce((sum, s) => sum + s.days_to_pay, 0) / successes.length
    : 0;
  
  return {
    successes,
    total_recovered: totalRecovered,
    avg_days_to_pay: Math.round(avgDays * 10) / 10,
  };
}

// Helper: Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default SOLAR_RECENT_WINS_SCHEMA;
