import crypto from 'crypto';

/**
 * Compute SHA-256 hash of data
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute Merkle root from file hashes
 * Follows deterministic binary tree construction
 */
export function computeMerkleRoot(fileHashes: string[]): string {
  if (fileHashes.length === 0) {
    throw new Error('Cannot compute Merkle root from empty file list');
  }

  if (fileHashes.length === 1) {
    return fileHashes[0];
  }

  // Sort hashes for determinism
  const sorted = [...fileHashes].sort();
  let currentLevel = sorted;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Pair exists - combine hashes
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(sha256(combined));
      } else {
        // Odd node - promote to next level
        nextLevel.push(currentLevel[i]);
      }
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Verify Merkle proof path
 */
export function verifyMerkleProof(
  leafHash: string,
  proofPath: Array<{ hash: string; position: 'left' | 'right' }>,
  expectedRoot: string
): boolean {
  let currentHash = leafHash;

  for (const { hash, position } of proofPath) {
    const combined = position === 'left'
      ? hash + currentHash
      : currentHash + hash;
    currentHash = sha256(combined);
  }

  return currentHash === expectedRoot;
}

/**
 * Compute deterministic digest of manifest
 */
export function computeManifestDigest(manifest: Record<string, any>): string {
  // Create canonical JSON (sorted keys)
  const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
  return sha256(canonical);
}
