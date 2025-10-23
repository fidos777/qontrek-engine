#!/usr/bin/env node
/**
 * Build Genesis Package
 *
 * Creates public genesis manifest and requests Tower co-signing.
 * This is the final step for R1.4.9 certification.
 *
 * Usage: node scripts/buildGenesis.js
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Load proof file
 */
async function loadProof(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Compute SHA-256 hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Request Tower co-signing
 */
async function requestTowerCoSign(genesisPackage) {
  const TOWER_URL = process.env.TOWER_URL || 'http://localhost:3000';

  try {
    const fetch = (await import('node-fetch')).default;

    // Upload genesis package to Tower
    const response = await fetch(`${TOWER_URL}/api/tower/uploadProof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manifest: {
          version: 'genesis_v1',
          files: [{ path: 'genesis', sha256: genesisPackage.genesisHash }],
          merkleRoot: genesisPackage.genesisHash,
          signature: genesisPackage.factorySignature,
          kid: process.env.FACTORY_KEY_ID || 'factory-key-001',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Tower co-sign failed: ${response.status}`);
    }

    const result = await response.json();

    // Fetch Tower receipt
    const ackResponse = await fetch(`${TOWER_URL}/api/tower/ack/${result.receiptId}`);
    if (!ackResponse.ok) {
      throw new Error(`Failed to fetch Tower receipt: ${ackResponse.status}`);
    }

    return await ackResponse.json();

  } catch (error) {
    console.error('Tower co-sign error:', error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Building Genesis Package ===\n');

  const proofDir = path.join(__dirname, '..', 'proof');
  const publicDir = path.join(__dirname, '..', 'public', 'mcp');

  // Load factory master closure
  console.log('Loading factory master closure...');
  const masterClosure = await loadProof(path.join(proofDir, 'factory_master_closure_v1.json'));

  if (!masterClosure) {
    console.error('❌ Factory master closure not found. Run buildMasterClosure.js first.');
    process.exit(1);
  }

  // Build genesis package
  console.log('Building genesis package...');

  const NODE_ID = process.env.NODE_ID || `factory-${Date.now()}`;

  const genesisPackage = {
    schema: 'genesis_v1',
    version: 'v1.0',
    createdAt: new Date().toISOString(),
    nodeId: NODE_ID,

    endpoints: {
      tower: process.env.TOWER_URL || 'http://localhost:3000',
      governance: `${process.env.TOWER_URL || 'http://localhost:3000'}/api/mcp/governance`,
      healthz: `${process.env.TOWER_URL || 'http://localhost:3000'}/api/mcp/healthz`,
      dashboard: `${process.env.TOWER_URL || 'http://localhost:3000'}/dashboard/governance`,
    },

    gates: {
      G13: 'Determinism & Reproducibility',
      G14: 'Privacy by Design',
      G15: 'Federation Correctness',
      G16: 'CI Evidence',
      G17: 'Key Lifecycle',
      G18: 'Federation Runtime',
      G19: 'Ledger Automation',
      G20: 'Observatory',
      G21: 'Genesis Certification',
    },

    certification: masterClosure.certification,
    coverage: masterClosure.coverage.percentage,

    closureHash: masterClosure.closureHash,
    genesisHash: '', // Will be computed after signing
    factorySignature: '',
    towerCoSign: null,
  };

  // Sign genesis package
  console.log('Signing genesis package...');

  const factorySecret = process.env.FACTORY_SIGNING_SECRET || 'dev-factory-secret';
  const canonical = JSON.stringify(genesisPackage, Object.keys(genesisPackage).sort());
  const factorySignature = crypto
    .createHmac('sha256', factorySecret)
    .update(canonical)
    .digest('hex');

  genesisPackage.factorySignature = factorySignature;

  // Compute genesis hash
  const genesisHash = sha256(canonical);
  genesisPackage.genesisHash = genesisHash;

  console.log(`  Genesis hash: ${genesisHash}`);
  console.log(`  Factory signature: ${factorySignature.substring(0, 16)}...`);

  // Request Tower co-signing
  console.log('\nRequesting Tower co-signing...');
  const towerReceipt = await requestTowerCoSign(genesisPackage);

  if (towerReceipt) {
    genesisPackage.towerCoSign = {
      receiptId: towerReceipt.receiptId,
      echoRoot: towerReceipt.echoRoot,
      status: towerReceipt.status,
      verifiedAt: towerReceipt.verifiedAt,
    };
    console.log(`  ✅ Tower co-signed: ${towerReceipt.receiptId}`);
  } else {
    console.warn('  ⚠️  Tower co-signing failed (server may not be running)');
    genesisPackage.towerCoSign = {
      status: 'pending',
      note: 'Start Tower server to complete co-signing',
    };
  }

  // Write genesis package
  await fs.mkdir(publicDir, { recursive: true });
  const genesisPath = path.join(publicDir, 'genesis.json');
  await fs.writeFile(genesisPath, JSON.stringify(genesisPackage, null, 2));

  // Also save to proof directory
  await fs.writeFile(
    path.join(proofDir, 'genesis_v1.json'),
    JSON.stringify(genesisPackage, null, 2)
  );

  console.log('\n✅ Genesis package built successfully');
  console.log(`   Public manifest: ${genesisPath}`);
  console.log(`   Node ID: ${NODE_ID}`);
  console.log(`   Coverage: ${genesisPackage.coverage}%`);

  if (towerReceipt && towerReceipt.status === 'verified') {
    console.log('\n🎉 Genesis Certified by Tower');
  } else {
    console.log('\n⚠️  Genesis pending Tower certification');
    console.log('   Start Tower server and re-run to complete certification');
  }
}

// Execute
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
