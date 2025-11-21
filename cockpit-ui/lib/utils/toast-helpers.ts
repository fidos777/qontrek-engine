import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

/**
 * Show success toast
 */
export const showSuccessToast = (message: string, options?: {
  confetti?: boolean;
  duration?: number;
}) => {
  toast.success(message, {
    duration: options?.duration || 3000,
    icon: '✅',
    style: {
      background: 'var(--bg-card)',
      color: 'var(--text-1)',
      border: '1px solid var(--stroke)',
    },
  });

  if (options?.confetti) {
    triggerConfetti();
  }
};

/**
 * Show error toast
 */
export const showErrorToast = (message: string) => {
  toast.error(message, {
    icon: '❌',
    style: {
      background: 'var(--bg-card)',
      color: 'var(--text-1)',
      border: '1px solid var(--error)',
    },
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: 'var(--bg-card)',
      color: 'var(--text-1)',
      border: '1px solid var(--stroke)',
    },
  });
};

/**
 * Confetti effect (zIndex normalized to 999, below Radix Dialogs at 1000)
 */
export const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 999,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};
