import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

/**
 * Trigger confetti animation
 * Launches 200 particles with customizable options
 */
export function triggerConfetti() {
  confetti({
    particleCount: 200,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  });
}

/**
 * Show success toast notification
 * @param message - Success message to display
 * @param options - Optional configuration
 * @param options.confetti - Whether to trigger confetti animation
 */
export function showSuccessToast(
  message: string,
  options?: { confetti?: boolean }
) {
  toast.success(message, {
    duration: 4000,
    position: 'bottom-right',
    style: {
      background: '#10b981',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
  });

  if (options?.confetti) {
    triggerConfetti();
  }
}

/**
 * Show error toast notification
 * @param message - Error message to display
 */
export function showErrorToast(message: string) {
  toast.error(message, {
    duration: 5000,
    position: 'bottom-right',
    style: {
      background: '#ef4444',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#ef4444',
    },
  });
}

/**
 * Show info toast notification
 * @param message - Info message to display
 */
export function showInfoToast(message: string) {
  toast(message, {
    duration: 3000,
    position: 'bottom-right',
    style: {
      background: '#3b82f6',
      color: '#ffffff',
      fontWeight: '500',
    },
    icon: 'ℹ️',
  });
}

/**
 * Show proof sync toast notification
 * Displays a notification when proof sync is verified
 */
export function showProofSyncToast() {
  toast.success('✅ Proof sync verified — Tower acknowledgment received.', {
    duration: 4000,
    position: 'bottom-right',
    style: {
      background: '#10b981',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
  });
}
