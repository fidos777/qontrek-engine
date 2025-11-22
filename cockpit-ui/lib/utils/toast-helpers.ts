// Toast notification helpers for Voltek

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastAction {
  type: 'ADD_TOAST' | 'REMOVE_TOAST' | 'CLEAR_ALL';
  payload?: Toast | string;
}

// Generate unique ID for toast
export function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create toast object
export function createToast(
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 5000
): Toast {
  return {
    id: generateToastId(),
    type,
    title,
    message,
    duration,
  };
}

// Pre-built toast creators
export const toastHelpers = {
  success: (title: string, message?: string) => createToast('success', title, message),
  error: (title: string, message?: string) => createToast('error', title, message, 7000),
  warning: (title: string, message?: string) => createToast('warning', title, message, 6000),
  info: (title: string, message?: string) => createToast('info', title, message),

  // Specific action toasts for Voltek
  callInitiated: (contact: string) =>
    createToast('info', 'Initiating Call', `Opening dialer for ${contact}`),

  smsSent: (contact: string) =>
    createToast('success', 'SMS Opened', `Opening SMS app for ${contact}`),

  whatsappOpened: (contact: string) =>
    createToast('success', 'WhatsApp Opened', `Opening WhatsApp for ${contact}`),

  emailSent: (contact: string) =>
    createToast('success', 'Email Client Opened', `Opening email for ${contact}`),

  leadUpdated: (leadId: string) =>
    createToast('success', 'Lead Updated', `Lead ${leadId} has been updated`),

  importSuccess: (count: number) =>
    createToast('success', 'Import Complete', `Successfully imported ${count} leads`),

  importError: (message: string) =>
    createToast('error', 'Import Failed', message),

  validationError: (message: string) =>
    createToast('error', 'Validation Error', message),

  networkError: () =>
    createToast('error', 'Network Error', 'Please check your connection and try again'),
};

// Get icon for toast type
export function getToastIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return 'ℹ';
  }
}

// Get color classes for toast type
export function getToastColors(type: ToastType): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-400',
      };
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-400',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-400',
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-400',
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-400',
      };
  }
}
