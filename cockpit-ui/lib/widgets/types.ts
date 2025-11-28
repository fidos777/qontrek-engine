// lib/widgets/types.ts
// Type definitions for widget system

export type WidgetState = 'idle' | 'loading' | 'success' | 'error';

export interface WidgetFieldSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  binding: string;
  label?: string;
  format?: string;
}

export interface WidgetSchema {
  widget_type: string;
  title: string;
  description?: string;
  fields: WidgetFieldSchema[];
  refreshInterval?: number;
}

export interface WidgetInstance {
  id: string;
  schema: WidgetSchema;
  data: Record<string, unknown>;
  state: WidgetState;
  error?: string;
  lastUpdated?: Date;
}

export interface WidgetComponentProps {
  instance: WidgetInstance;
}
