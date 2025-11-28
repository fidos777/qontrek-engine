// lib/widgets/types.ts
// L3 Widget Types

// Widget state enum
export type WidgetState = 'loading' | 'ready' | 'error' | 'stale';

// Widget schema definition
export interface WidgetSchema {
  widget_type: string;
  version: string;
  title: string;
  description?: string;
}

// Widget instance with runtime data
export interface WidgetInstance {
  schema: WidgetSchema;
  data: Record<string, unknown>;
  state: WidgetState;
  last_updated: string;
  error?: string;
}

// Widget component props
export interface WidgetComponentProps {
  instance: WidgetInstance;
}
