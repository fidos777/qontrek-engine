// Toast helper types and utilities

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function createToast(type: ToastType, message: string, duration = 3000): Toast {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    duration,
  };
}

export function getToastIcon(type: ToastType): string {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'info': return 'ℹ';
    case 'warning': return '⚠';
  }
}

export function getToastColor(type: ToastType): string {
  switch (type) {
    case 'success': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'info': return 'bg-blue-500';
    case 'warning': return 'bg-yellow-500';
  }
}
