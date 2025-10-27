/**
 * Qontrek Proof Layer Utilities
 * Cryptographic verification helpers for G2 dashboard
 */

export interface ProofDatum {
  field: string;
  value: any;
  hash: string;
  timestamp: string;
  etag: string;
  drift?: boolean;
}

/**
 * Builds a deep link URL for proof verification
 */
export function buildDeepLink(data: ProofDatum): string {
  const params = new URLSearchParams({
    field: data.field,
    hash: data.hash,
    etag: data.etag,
  });
  return `https://qontrek.com/verify?${params.toString()}`;
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

/**
 * Generates a mock proof datum for testing
 */
export function mockProofDatum(field: string, value: any, drift = false): ProofDatum {
  return {
    field,
    value,
    hash: `0x${Math.random().toString(16).substring(2, 66).padEnd(64, '0')}`,
    timestamp: new Date().toISOString(),
    etag: `"${Math.random().toString(36).substring(2, 15)}"`,
    drift,
  };
}
