// lib/utils/toast-helpers.ts
// Toast notification helpers using react-hot-toast

import toast from 'react-hot-toast';

export const showSuccessToast = (message: string, options?: { duration?: number }) => {
  toast.success(message, {
    duration: options?.duration || 3000,
    style: {
      background: 'var(--bg-card, #ffffff)',
      color: 'var(--text-1, #1f2937)',
      border: '1px solid var(--success, #10b981)',
    },
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    icon: 'i',
    style: {
      background: 'var(--bg-card, #ffffff)',
      color: 'var(--text-1, #1f2937)',
      border: '1px solid var(--stroke, #e5e7eb)',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    style: {
      background: 'var(--bg-card, #ffffff)',
      color: 'var(--text-1, #1f2937)',
      border: '1px solid var(--error, #ef4444)',
    },
  });
};

export const showWarningToast = (message: string) => {
  toast(message, {
    icon: '!',
    style: {
      background: 'var(--bg-card, #ffffff)',
      color: 'var(--text-1, #1f2937)',
      border: '1px solid var(--warning, #f59e0b)',
    },
  });
};

// Confetti celebration effect
export const triggerConfetti = async () => {
  try {
    const confetti = (await import('canvas-confetti')).default;

    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 999,
    };

    function fire(particleRatio: number, opts: {
      spread?: number;
      startVelocity?: number;
      decay?: number;
      scalar?: number;
    }) {
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
  } catch (error) {
    // Confetti is optional, fail silently
    console.warn('Confetti not available:', error);
  }
};
