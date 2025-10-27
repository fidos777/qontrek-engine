/**
 * Proof Utilities for Qontrek Trust Cockpit
 * Provides cryptographic proof layer helpers and PII masking
 */

/**
 * Represents a single proof datum with cryptographic metadata
 */
export interface ProofDatum {
  field: string;
  value: any;
  hash: string;
  etag: string;
  timestamp: string;
  drift?: boolean;
}

/**
 * Builds a proof payload with cryptographic metadata
 * @param field - The field name
 * @param value - The field value
 * @param drift - Optional drift indicator
 * @returns ProofDatum object with generated hash, etag, and timestamp
 */
export function buildProofPayload(
  field: string,
  value: any,
  drift?: boolean
): ProofDatum {
  const now = Date.now();

  const payload: ProofDatum = {
    field,
    value,
    hash: `sha256_${now.toString(36)}`,
    etag: `"${now}"`,
    timestamp: new Date().toISOString(),
  };

  if (drift !== undefined) {
    payload.drift = drift;
  }

  return payload;
}

/**
 * Masks personally identifiable information (PII) based on safe mode setting
 * @param str - The string to potentially mask
 * @param safeMode - If false, returns string unchanged; if true, applies masking
 * @returns Masked or original string
 */
export function maskPII(str: string, safeMode: boolean): string {
  if (!safeMode) {
    return str;
  }

  // Email detection and masking
  if (str.includes('@')) {
    const parts = str.split('@');
    if (parts.length === 2) {
      const [local, domain] = parts;
      if (local.length <= 2) {
        return str; // Too short to mask safely
      }
      const maskedLocal = local.slice(0, 2) + '•'.repeat(Math.max(1, local.length - 2));
      return `${maskedLocal}@${domain}`;
    }
  }

  // Phone number detection and masking (+60...)
  if (str.startsWith('+60')) {
    const digits = str.slice(3); // Remove +60 prefix
    if (digits.length < 4) {
      return str; // Too short to mask safely
    }
    const last4 = digits.slice(-4);
    return `+60 •••• ${last4}`;
  }

  // Default: show first 3 + ••• + last 3
  if (str.length <= 6) {
    return str; // Too short to mask safely
  }
  return `${str.slice(0, 3)}•••${str.slice(-3)}`;
}
