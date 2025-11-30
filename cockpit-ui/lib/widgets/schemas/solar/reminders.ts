// ============================================
// SOLAR ACTIVE REMINDERS WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Show pending action reminders
// ============================================

import { z } from 'zod';
import type { WidgetSchema, ActiveReminder } from '@/types/solar';

// Zod validation schema
export const ActiveReminderSchema = z.object({
  id: z.string(),
  project_no: z.string(),
  lead_name: z.string(),
  stage: z.string(),
  next_action: z.string(),
  due_date: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const SolarRemindersDataSchema = z.object({
  reminders: z.array(ActiveReminderSchema),
  high_priority_count: z.number(),
  today_count: z.number(),
  overdue_count: z.number(),
});

export type SolarRemindersData = z.infer<typeof SolarRemindersDataSchema>;

// Priority colors
export const PRIORITY_COLORS = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
};

// Widget definition
export const SOLAR_REMINDERS_SCHEMA: WidgetSchema = {
  id: 'solar_reminders',
  name: 'Active Reminders',
  description: 'List of pending action reminders',
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
    color: 'orange',
    icon: 'bell',
    animate: true,
    priority: 8,
  },
  
  refresh_interval_ms: 30000,
};

// Data transformer
export function transformToRemindersData(mcpResponse: {
  active_reminders: ActiveReminder[];
}): SolarRemindersData {
  const reminders = mcpResponse.active_reminders;
  const today = new Date().toISOString().split('T')[0];
  
  return {
    reminders,
    high_priority_count: reminders.filter(r => r.priority === 'HIGH').length,
    today_count: reminders.filter(r => r.due_date === today).length,
    overdue_count: reminders.filter(r => r.due_date < today).length,
  };
}

// Helper: Check if reminder is overdue
export function isOverdue(dueDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dueDate < today;
}

// Helper: Check if reminder is due today
export function isDueToday(dueDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dueDate === today;
}

export default SOLAR_REMINDERS_SCHEMA;
