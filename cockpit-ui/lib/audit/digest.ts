// lib/audit/digest.ts
// Deterministic Merkle digest generator for proof artifacts
// Implements digest_spec_v1 (RFC-like specification)

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

const CHAIN_FILE = path.join(process.cwd(), ".logs", "mcp", "digest_chain.json");

export interface DigestTree {
  file: string;
  hash: string;
  size: number;
}

export interface DigestOutput {
  version: string;
  spec: string;
  computed_at: string;
  merkle_root: string;
  prev_root: string | null;
  file_count: number;
  algorithm: string;
  tree: DigestTree[];
  signature: {
    method: string;
    attestation: string;
    verifiable_by: string;
  };
}

export interface ChainState {
  current_root: string;
  previous_root: string | null;
  updated_at: number;
}

/**
 * Check if a file should be excluded from digest
 */
function isExcluded(filename: string): boolean {
  const basename = path.basename(filename);

  // Exclude digest files themselves
  if (basename.startsWith("proof_digest_")) {
    return true;
  }

  // Exclude OS metadata
  if ([".DS_Store", "Thumbs.db"].includes(basename)) {
    return true;
  }

  // Exclude temporary/backup files
  if (basename.endsWith(".tmp") || basename.endsWith(".bak")) {
    return true;
  }

  // Exclude git files
  if (basename.startsWith(".git")) {
    return true;
  }

  return false;
}

/**
 * Canonicalize JSON for deterministic hashing
 * - Sorted keys (recursive)
 * - 2-space indentation
 * - LF newlines only
 * - Final newline
 */
function canonicalizeJSON(jsonStr: string): string {
  const obj = JSON.parse(jsonStr);

  // Sort keys recursively
  const sortedObj = sortKeys(obj);

  // Serialize with 2-space indent, ensure_ascii=false, sorted keys
  const canonical = JSON.stringify(sortedObj, null, 2);

  // Ensure LF newlines only (no CRLF)
  const normalized = canonical.replace(/\r\n/g, "\n");

  // Ensure final newline
  return normalized.endsWith("\n") ? normalized : normalized + "\n";
}

/**
 * Recursively sort object keys
 */
function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted: any = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }

  return sorted;
}

/**
 * Compute SHA-256 hash of data
 */
function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Build Merkle tree from leaf hashes
 * Returns root hash
 */
function buildMerkleTree(hashes: string[]): string {
  if (hashes.length === 0) {
    return sha256("");
  }

  if (hashes.length === 1) {
    return hashes[0];
  }

  // Pad to even count (duplicate last hash)
  let currentLevel = [...hashes];
  if (currentLevel.length % 2 === 1) {
    currentLevel.push(currentLevel[currentLevel.length - 1]);
  }

  // Build parent level
  const parents: string[] = [];
  for (let i = 0; i < currentLevel.length; i += 2) {
    const left = currentLevel[i];
    const right = currentLevel[i + 1];
    const parent = sha256(left + right);
    parents.push(parent);
  }

  // Recurse until single root
  return buildMerkleTree(parents);
}

/**
 * Discover proof files in directory
 */
function discoverProofFiles(proofDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && entry.endsWith(".json")) {
        if (!isExcluded(entry)) {
          files.push(fullPath);
        }
      }
    }
  }

  if (fs.existsSync(proofDir)) {
    walk(proofDir);
  }

  // Sort lexicographically (deterministic order)
  return files.sort();
}

/**
 * Load chain state from disk
 */
function loadChainState(): ChainState | null {
  if (!fs.existsSync(CHAIN_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(CHAIN_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load chain state:", error);
    return null;
  }
}

/**
 * Save chain state to disk
 */
function saveChainState(state: ChainState) {
  const dir = path.dirname(CHAIN_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(CHAIN_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Failed to save chain state:", error);
  }
}

/**
 * Compute deterministic digest of proof artifacts
 * Implements digest_spec_v1
 */
export function computeDigest(proofDir: string): DigestOutput {
  // 1. Discover proof files
  const files = discoverProofFiles(proofDir);

  // 2. Compute leaf hashes
  const tree: DigestTree[] = [];
  const leafHashes: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const canonical = canonicalizeJSON(content);
    const hash = sha256(canonical);

    tree.push({
      file: path.relative(path.dirname(proofDir), file),
      hash,
      size: Buffer.byteLength(canonical, "utf8"),
    });

    leafHashes.push(hash);
  }

  // 3. Build Merkle tree
  const merkleRoot = buildMerkleTree(leafHashes);

  // 4. Load previous root
  const chain = loadChainState();
  const prevRoot = chain?.current_root || null;

  // 5. Construct digest
  const digest: DigestOutput = {
    version: "1.0",
    spec: "digest_spec_v1",
    computed_at: new Date().toISOString(),
    merkle_root: merkleRoot,
    prev_root: prevRoot,
    file_count: tree.length,
    algorithm: "sha256",
    tree,
    signature: {
      method: "RFC-digest_spec_v1",
      attestation: `Deterministic digest of ${tree.length} proof files`,
      verifiable_by: "Tower /api/tower/verifyDigest",
    },
  };

  // 6. Update chain
  saveChainState({
    current_root: merkleRoot,
    previous_root: prevRoot,
    updated_at: Date.now(),
  });

  return digest;
}

/**
 * Verify digest reproducibility
 * Regenerates digest twice and compares (excluding computed_at)
 */
export function verifyReproducibility(proofDir: string): {
  reproducible: boolean;
  digest1: DigestOutput;
  digest2: DigestOutput;
  differences: string[];
} {
  const digest1 = computeDigest(proofDir);
  const digest2 = computeDigest(proofDir);

  const differences: string[] = [];

  // Compare all fields except computed_at
  if (digest1.merkle_root !== digest2.merkle_root) {
    differences.push(`merkle_root: ${digest1.merkle_root} vs ${digest2.merkle_root}`);
  }

  if (digest1.prev_root !== digest2.prev_root) {
    differences.push(`prev_root: ${digest1.prev_root} vs ${digest2.prev_root}`);
  }

  if (digest1.file_count !== digest2.file_count) {
    differences.push(`file_count: ${digest1.file_count} vs ${digest2.file_count}`);
  }

  if (JSON.stringify(digest1.tree) !== JSON.stringify(digest2.tree)) {
    differences.push("tree: Different leaf hashes");
  }

  const reproducible = differences.length === 0;

  return {
    reproducible,
    digest1,
    digest2,
    differences,
  };
}

/**
 * Get chain state for governance reporting
 */
export function getChainState(): ChainState | null {
  return loadChainState();
}
