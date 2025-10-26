/**
 * Document hashing utilities for proof of upload
 *
 * This module provides cryptographic hashing for uploaded files using Web Crypto API.
 * Useful for verifying file integrity and creating audit trails.
 */

/**
 * Hash a file using SHA-256
 *
 * @param file - The file to hash
 * @param algorithm - The hashing algorithm to use (default: SHA-256)
 * @returns Promise<string> - Hex-encoded hash string
 *
 * @example
 * ```typescript
 * const file = // ... File object from input
 * const hash = await hashFile(file);
 * console.log(`File hash: ${hash}`);
 * // File hash: a1b2c3d4e5f6...
 * ```
 */
export async function hashFile(
  file: File,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Hash multiple files and return a map of filename to hash
 *
 * @param files - Array of files to hash
 * @param algorithm - The hashing algorithm to use
 * @returns Promise<Map<string, string>> - Map of filename to hash
 *
 * @example
 * ```typescript
 * const files = [file1, file2, file3];
 * const hashes = await hashFiles(files);
 * hashes.forEach((hash, filename) => {
 *   console.log(`${filename}: ${hash}`);
 * });
 * ```
 */
export async function hashFiles(
  files: File[],
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<Map<string, string>> {
  const hashMap = new Map<string, string>();

  for (const file of files) {
    const hash = await hashFile(file, algorithm);
    hashMap.set(file.name, hash);
  }

  return hashMap;
}

/**
 * Create a file proof record with hash and metadata
 *
 * @param file - The file to create a proof for
 * @returns Promise<FileProof> - Proof record with hash and metadata
 *
 * @example
 * ```typescript
 * const proof = await createFileProof(uploadedFile);
 * console.log(proof);
 * // {
 * //   filename: "document.docx",
 * //   size: 45678,
 * //   type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 * //   hash: "a1b2c3...",
 * //   algorithm: "SHA-256",
 * //   timestamp: "2025-10-26T12:34:56.789Z"
 * // }
 * ```
 */
export interface FileProof {
  filename: string;
  size: number;
  type: string;
  hash: string;
  algorithm: string;
  timestamp: string;
  lastModified?: Date;
}

export async function createFileProof(
  file: File,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<FileProof> {
  const hash = await hashFile(file, algorithm);

  return {
    filename: file.name,
    size: file.size,
    type: file.type,
    hash,
    algorithm,
    timestamp: new Date().toISOString(),
    lastModified: file.lastModified ? new Date(file.lastModified) : undefined,
  };
}

/**
 * Verify a file against a known hash
 *
 * @param file - The file to verify
 * @param expectedHash - The expected hash value
 * @param algorithm - The hashing algorithm used
 * @returns Promise<boolean> - True if hashes match
 *
 * @example
 * ```typescript
 * const isValid = await verifyFileHash(file, knownHash);
 * if (isValid) {
 *   console.log('File integrity verified!');
 * } else {
 *   console.error('File has been modified!');
 * }
 * ```
 */
export async function verifyFileHash(
  file: File,
  expectedHash: string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<boolean> {
  const actualHash = await hashFile(file, algorithm);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Create a batch proof for multiple files
 *
 * @param files - Array of files to create proofs for
 * @returns Promise<BatchProof> - Batch proof with all file proofs
 */
export interface BatchProof {
  files: FileProof[];
  batchHash: string;
  timestamp: string;
  totalSize: number;
  fileCount: number;
}

export async function createBatchProof(
  files: File[],
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<BatchProof> {
  const fileProofs: FileProof[] = [];
  let totalSize = 0;

  for (const file of files) {
    const proof = await createFileProof(file, algorithm);
    fileProofs.push(proof);
    totalSize += file.size;
  }

  // Create a combined hash of all file hashes
  const combinedHashes = fileProofs.map((p) => p.hash).join('');
  const encoder = new TextEncoder();
  const combinedBuffer = encoder.encode(combinedHashes);
  const batchHashBuffer = await crypto.subtle.digest(algorithm, combinedBuffer);
  const batchHashArray = Array.from(new Uint8Array(batchHashBuffer));
  const batchHash = batchHashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    files: fileProofs,
    batchHash,
    timestamp: new Date().toISOString(),
    totalSize,
    fileCount: files.length,
  };
}
