// lib/trust/canonical.ts
// Canonical JSON stringify and SHA-256 utilities for drift detection

/**
 * Canonical stringify - sorts keys for deterministic output
 * Used for drift detection by comparing hash of expected vs actual data
 */
export const canonicalStringify = (v: any): string => {
  if (v === null || v === undefined) {
    return JSON.stringify(v);
  }

  if (typeof v !== 'object') {
    return JSON.stringify(v);
  }

  if (Array.isArray(v)) {
    return JSON.stringify(v.map(item =>
      typeof item === 'object' && item !== null
        ? JSON.parse(canonicalStringify(item))
        : item
    ));
  }

  // Sort keys for objects
  return JSON.stringify(v, Object.keys(v).sort());
};

/**
 * Browser-compatible SHA-256 hash function
 * Uses Web Crypto API (SubtleCrypto)
 * @param data - String to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function sha256Browser(data: string): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('SHA-256 requires Web Crypto API (browser environment)');
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Compute SHA-256 hash of canonical JSON
 * Combines canonicalStringify with sha256Browser
 */
export async function canonicalHash(data: any): Promise<string> {
  const canonical = canonicalStringify(data);
  return sha256Browser(canonical);
}

/**
 * Verify if data matches expected hash (drift detection)
 * @param data - Data to check
 * @param expectedHash - Expected SHA-256 hash
 * @returns true if hashes match, false otherwise
 */
export async function verifyHash(data: any, expectedHash: string): Promise<boolean> {
  const actualHash = await canonicalHash(data);
  return actualHash === expectedHash;
}
