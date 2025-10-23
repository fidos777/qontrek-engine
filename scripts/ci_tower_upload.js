#!/usr/bin/env node
/**
 * CI Tower Upload Script
 *
 * Computes file hashes, builds manifest with Merkle root,
 * signs with factory key, uploads to Tower, and verifies ACK.
 *
 * Usage: node scripts/ci_tower_upload.js [--tower-url URL]
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TOWER_URL = process.env.TOWER_URL || 'http://localhost:3000';
const FACTORY_SECRET = process.env.FACTORY_SIGNING_SECRET || 'dev-factory-secret-change-in-production';
const FACTORY_KID = process.env.FACTORY_KEY_ID || 'factory-key-001';

/**
 * Compute SHA-256 hash of file
 */
async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compute SHA-256 hash of data
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute Merkle root from file hashes
 */
function computeMerkleRoot(fileHashes) {
  if (fileHashes.length === 0) {
    throw new Error('Cannot compute Merkle root from empty file list');
  }

  if (fileHashes.length === 1) {
    return fileHashes[0];
  }

  const sorted = [...fileHashes].sort();
  let currentLevel = sorted;

  while (currentLevel.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(sha256(combined));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Sign payload with HMAC-SHA256
 */
function signPayload(payload, secret) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex');
}

/**
 * Scan proof directory and compute hashes
 */
async function scanProofFiles(proofDir) {
  const files = [];
  const entries = await fs.readdir(proofDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(proofDir, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await scanProofFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const hash = await hashFile(fullPath);
      const relativePath = path.relative(proofDir, fullPath);
      files.push({ path: relativePath, sha256: hash });
    }
  }

  return files;
}

/**
 * Upload manifest to Tower
 */
async function uploadToTower(manifest) {
  const fetch = (await import('node-fetch')).default;
  const uploadUrl = `${TOWER_URL}/api/tower/uploadProof`;

  console.log(`Uploading to Tower: ${uploadUrl}`);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifest }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tower upload failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Verify Tower acknowledgment
 */
async function verifyAck(receiptId, maxRetries = 3) {
  const fetch = (await import('node-fetch')).default;
  const ackUrl = `${TOWER_URL}/api/tower/ack/${receiptId}`;

  for (let i = 0; i < maxRetries; i++) {
    console.log(`Verifying ACK (attempt ${i + 1}/${maxRetries}): ${ackUrl}`);

    const response = await fetch(ackUrl);

    if (!response.ok) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw new Error(`Tower ACK verification failed: ${response.status}`);
    }

    const ack = await response.json();

    if (ack.status === 'verified') {
      return ack;
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Tower ACK not verified after retries');
}

/**
 * Main execution
 */
async function main() {
  console.log('=== CI Tower Upload ===');
  console.log(`Tower URL: ${TOWER_URL}`);
  console.log(`Factory Key ID: ${FACTORY_KID}`);

  // Scan proof directory
  const proofDir = path.join(__dirname, '..', 'proof');
  console.log(`\nScanning proof directory: ${proofDir}`);

  const files = await scanProofFiles(proofDir);
  console.log(`Found ${files.length} proof files`);

  if (files.length === 0) {
    console.log('No proof files to upload');
    process.exit(0);
  }

  // Compute Merkle root
  const fileHashes = files.map(f => f.sha256);
  const merkleRoot = computeMerkleRoot(fileHashes);
  console.log(`\nMerkle root: ${merkleRoot}`);

  // Build manifest
  const manifest = {
    version: 'v1.0',
    files,
    merkleRoot,
    kid: FACTORY_KID,
    createdAt: new Date().toISOString(),
  };

  // Sign manifest
  const signature = signPayload(manifest, FACTORY_SECRET);
  manifest.signature = signature;
  console.log(`Manifest signed with kid: ${FACTORY_KID}`);

  // Save manifest locally
  const manifestPath = path.join(proofDir, 'factory_runtime_seal.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest saved: ${manifestPath}`);

  // Upload to Tower
  console.log('\nUploading to Tower...');
  const uploadResponse = await uploadToTower(manifest);
  console.log('Tower upload successful:');
  console.log(JSON.stringify(uploadResponse, null, 2));

  // Verify ACK
  console.log('\nVerifying Tower acknowledgment...');
  const ack = await verifyAck(uploadResponse.receiptId);
  console.log('Tower ACK verified:');
  console.log(JSON.stringify(ack, null, 2));

  // Verify echo root matches
  if (ack.echoRoot !== merkleRoot) {
    throw new Error(`Echo root mismatch: expected ${merkleRoot}, got ${ack.echoRoot}`);
  }

  console.log('\n✅ CI Tower upload complete');
  console.log(`Receipt ID: ${uploadResponse.receiptId}`);
  console.log(`Status: ${ack.status}`);
  console.log(`Echo root: ${ack.echoRoot}`);
}

// Execute
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
