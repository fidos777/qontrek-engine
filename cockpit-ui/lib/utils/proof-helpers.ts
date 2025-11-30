// Get nested object values safely (for deep-links)
export const pick = (obj: any, path: string): any =>
  path.split('.').reduce((o, k) => o?.[k], obj);

// Build deep-link URL for proof modal
export const buildDeepLink = (field: string): string => {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}?proof=${encodeURIComponent(field)}`;
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Enhanced maskPII with more edge cases
export const maskPIIEnhanced = (str: string, safeMode: boolean): string => {
  if (!safeMode || !str) return str;
// Email
  if (str.includes('@')) {
    const [local, domain] = str.split('@');
    if (local.length <= 2) return `••@${domain}`;
    return `${local.slice(0, 2)}•••@${domain}`;
  }
// Phone with +60
  if (str.startsWith('+60')) {
    const digits = str.slice(3).replace(/\D/g, '');
    if (digits.length < 4) return '+60 ••••';
    return `+60 •••• ${digits.slice(-4)}`;
  }
// Phone without +60 (014-923-2105 format)
  if (/^\d{3}[-\s]?\d{3}[-\s]?\d{4}$/.test(str)) {
    const digits = str.replace(/\D/g, '');
    return `••• •••• ${digits.slice(-4)}`;
  }
 // Short name (one word or very short)
  if (str.length <= 3 || !str.includes(' ')) return '•••';
// Regular name (multi-word)
  const parts = str.split(' ');
  return parts.map(p => 
    p.length <= 2 ? '••' : `${p.slice(0, 3)}•••`
  ).join(' ');
};
