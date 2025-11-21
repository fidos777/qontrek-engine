/**
 * Toast helper utilities for showing success/error notifications
 */

interface ToastOptions {
  confetti?: boolean;
  duration?: number;
}

/**
 * Shows a success toast notification
 * @param message - The message to display
 * @param options - Toast options
 */
export function showSuccessToast(message: string, options: ToastOptions = {}): void {
  const { confetti = false, duration = 3000 } = options;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    fixed bottom-6 right-6 z-50
    px-4 py-3 rounded-lg shadow-lg
    bg-green-600 text-white
    transform transition-all duration-300
    translate-y-0 opacity-100
  `.replace(/\s+/g, ' ').trim();
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);

  // Trigger confetti if requested
  if (confetti) {
    triggerConfetti();
  }

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  // Remove after duration
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Shows an error toast notification
 * @param message - The error message to display
 * @param options - Toast options
 */
export function showErrorToast(message: string, options: ToastOptions = {}): void {
  const { duration = 5000 } = options;

  const toast = document.createElement('div');
  toast.className = `
    fixed bottom-6 right-6 z-50
    px-4 py-3 rounded-lg shadow-lg
    bg-red-600 text-white
    transform transition-all duration-300
  `.replace(/\s+/g, ' ').trim();
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Triggers a confetti animation
 */
function triggerConfetti(): void {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'fixed z-50 pointer-events-none';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
    confetti.style.top = '-20px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

    document.body.appendChild(confetti);

    // Animate falling
    const animationDuration = 2000 + Math.random() * 1000;
    const horizontalDrift = (Math.random() - 0.5) * 200;

    confetti.animate([
      {
        transform: `translate(0, 0) rotate(0deg)`,
        opacity: 1,
      },
      {
        transform: `translate(${horizontalDrift}px, ${window.innerHeight + 50}px) rotate(${720 + Math.random() * 360}deg)`,
        opacity: 0,
      },
    ], {
      duration: animationDuration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    });

    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, animationDuration);
  }
}
