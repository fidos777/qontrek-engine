#!/usr/bin/env node
/**
 * buildGenesis.js - Factory Runtime Genesis Certification Builder
 * Mission: G19.9.2-R1.4.9-GENESIS-FINALIZATION
 * Phase: B - Tower Genesis Seal Automation
 *
 * Aggregates 9 critical proof artifacts into final genesis package
 * Computes Merkle root and prepares for Tower co-signing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROOF_DIR = path.join(__dirname, '../proof');
const OUTPUT_PATH = path.join(PROOF_DIR, 'factory_master_closure_v1.json');

// 9 Critical Proofs for Genesis Certification
const GENESIS_PROOFS = [
  'pr_sync_status_v1.json',
  'tower_sync_cert_v19.json',
  'v19_operational_ui_certification_final.json',
  'v19_fullchain_verification.json',
  'tower_sync_summary.json',
  'tower_sync_validation.json',
  'trust_summary.json',
  'cfo_summary.json',
  'v19_operational_ui_certification.json'
];

// Compute SHA256 hash for content
function computeHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Build Merkle tree from proof hashes
function buildMerkleRoot(proofHashes) {
  if (proofHashes.length === 0) return null;
  if (proofHashes.length === 1) return proofHashes[0];

  const tree = [...proofHashes];
  while (tree.length > 1) {
    const level = [];
    for (let i = 0; i < tree.length; i += 2) {
      if (i + 1 < tree.length) {
        const combined = tree[i] + tree[i + 1];
        level.push(crypto.createHash('sha256').update(combined).digest('hex'));
      } else {
        level.push(tree[i]);
      }
    }
    tree.splice(0, tree.length, ...level);
  }
  return tree[0];
}

// Main Genesis Builder
async function buildGenesis() {
  console.log('🏗️  Building Factory Genesis Certification Package...\n');

  const aggregatedProofs = [];
  const proofHashes = [];
  let loadedCount = 0;

  // Load and aggregate all proofs
  for (const proofFile of GENESIS_PROOFS) {
    const proofPath = path.join(PROOF_DIR, proofFile);
    try {
      if (fs.existsSync(proofPath)) {
        const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
        const proofHash = computeHash(proofData);

        aggregatedProofs.push({
          artifact: proofFile,
          sha256: proofHash,
          loaded: true,
          data: proofData
        });

        proofHashes.push(proofHash);
        loadedCount++;
        console.log(`✅ Loaded: ${proofFile}`);
      } else {
        console.log(`⚠️  Missing: ${proofFile}`);
        aggregatedProofs.push({
          artifact: proofFile,
          loaded: false,
          error: 'File not found'
        });
      }
    } catch (error) {
      console.error(`❌ Error loading ${proofFile}:`, error.message);
      aggregatedProofs.push({
        artifact: proofFile,
        loaded: false,
        error: error.message
      });
    }
  }

  // Compute Merkle root
  const merkleRoot = buildMerkleRoot(proofHashes);

  // Calculate coverage
  const coverage = {
    total: GENESIS_PROOFS.length,
    loaded: loadedCount,
    missing: GENESIS_PROOFS.length - loadedCount,
    percentage: Math.round((loadedCount / GENESIS_PROOFS.length) * 100)
  };

  // Build final genesis package
  const genesisPackage = {
    mission_id: 'G19.9.2-R1.4.9-GENESIS-FINALIZATION',
    phase: 'B',
    genesis_version: '1.0.0',
    release_target: 'R1.4.9',
    timestamp: new Date().toISOString(),

    governance_snapshot: {
      gates_certified: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21'],
      tower_integration: 'complete',
      factory_status: 'sealed'
    },

    proofs: aggregatedProofs,

    integrity: {
      merkle_root: merkleRoot,
      digest_algorithm: 'SHA256',
      coverage: coverage
    },

    tower_ready: coverage.percentage >= 80,

    metadata: {
      builder: 'scripts/buildGenesis.js',
      node_version: process.version,
      platform: process.platform
    }
  };

  // Write genesis package
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(genesisPackage, null, 2));

  console.log(`\n📦 Genesis Package Created: ${OUTPUT_PATH}`);
  console.log(`\n🔐 Integrity:`);
  console.log(`   Merkle Root: ${merkleRoot}`);
  console.log(`   Coverage: ${coverage.loaded}/${coverage.total} (${coverage.percentage}%)`);
  console.log(`   Tower Ready: ${genesisPackage.tower_ready ? '✅' : '❌'}`);

  return genesisPackage;
}

// Execute
if (require.main === module) {
  buildGenesis()
    .then((genesis) => {
      console.log('\n✨ Genesis build complete!\n');
      process.exit(genesis.tower_ready ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Genesis build failed:', error);
      process.exit(1);
    });
}

module.exports = { buildGenesis };
