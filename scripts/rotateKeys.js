#!/usr/bin/env node
/**
 * Key Rotation Job
 *
 * Checks active keys for rotation requirements and emits rotation proof.
 * Run this as a scheduled job (e.g., daily cron).
 *
 * Usage: node scripts/rotateKeys.js [--force]
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Load key registry
 */
async function loadKeyRegistry() {
  try {
    const registryPath = path.join(__dirname, '..', 'config', 'key_registry.json');
    const content = await fs.readFile(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Initialize with defaults
    return {
      version: 'v1.0',
      lastUpdated: new Date().toISOString(),
      keys: [],
      rotationPolicy: {
        maxAgeDays: 90,
        warningDays: 14,
        gracePeriodDays: 7,
      },
    };
  }
}

/**
 * Save key registry
 */
async function saveKeyRegistry(registry) {
  const registryPath = path.join(__dirname, '..', 'config', 'key_registry.json');
  registry.lastUpdated = new Date().toISOString();
  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Check if key needs rotation
 */
function needsRotation(key, policy) {
  const now = new Date();
  const rotatesAt = new Date(key.rotatesAt);
  const daysUntilRotation = Math.floor((rotatesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let urgency = 'ok';

  if (daysUntilRotation < 0) {
    urgency = 'overdue';
  } else if (daysUntilRotation <= policy.gracePeriodDays) {
    urgency = 'critical';
  } else if (daysUntilRotation <= policy.warningDays) {
    urgency = 'warning';
  }

  return {
    needsRotation: daysUntilRotation <= policy.warningDays,
    daysUntilRotation,
    urgency,
  };
}

/**
 * Initialize default keys if registry is empty
 */
async function initializeKeys(registry) {
  if (registry.keys.length > 0) {
    return;
  }

  console.log('Initializing default keys...');

  const now = new Date();
  const rotatesAt = new Date(now);
  rotatesAt.setDate(rotatesAt.getDate() + registry.rotationPolicy.maxAgeDays);

  const defaultKeys = [
    {
      kid: process.env.FACTORY_KEY_ID || 'factory-key-001',
      algorithm: 'HMAC-SHA256',
      status: 'active',
      usage: 'signing',
      scope: 'factory',
      createdAt: now.toISOString(),
      rotatesAt: rotatesAt.toISOString(),
    },
    {
      kid: process.env.TOWER_KEY_ID || 'tower-key-001',
      algorithm: 'HMAC-SHA256',
      status: 'active',
      usage: 'signing',
      scope: 'tower',
      createdAt: now.toISOString(),
      rotatesAt: rotatesAt.toISOString(),
    },
  ];

  registry.keys.push(...defaultKeys);
  await saveKeyRegistry(registry);

  console.log(`Initialized ${defaultKeys.length} default keys`);
}

/**
 * Emit rotation proof
 */
async function emitRotationProof(registry, rotationStatus) {
  const proof = {
    schema: 'security_key_rotation_v1',
    version: 'v1.0',
    generatedAt: new Date().toISOString(),
    rotationPolicy: registry.rotationPolicy,
    activeKeys: rotationStatus.map(({ key, rotation }) => ({
      kid: key.kid,
      scope: key.scope,
      algorithm: key.algorithm,
      createdAt: key.createdAt,
      rotatesAt: key.rotatesAt,
      daysUntilRotation: rotation.daysUntilRotation,
      urgency: rotation.urgency,
    })),
    retiredKeys: registry.keys
      .filter(k => k.status === 'retired')
      .map(k => ({
        kid: k.kid,
        scope: k.scope,
        retiredAt: k.rotatedAt,
      })),
  };

  const proofPath = path.join(__dirname, '..', 'proof', 'security_key_rotation_v1.json');
  await fs.mkdir(path.dirname(proofPath), { recursive: true });
  await fs.writeFile(proofPath, JSON.stringify(proof, null, 2), 'utf-8');

  console.log(`\nRotation proof emitted: ${proofPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Key Rotation Job ===');

  const forceRotation = process.argv.includes('--force');
  if (forceRotation) {
    console.log('Force rotation mode enabled');
  }

  // Load registry
  const registry = await loadKeyRegistry();
  console.log(`Loaded key registry (version ${registry.version})`);

  // Initialize keys if needed
  await initializeKeys(registry);

  // Check active keys
  const activeKeys = registry.keys.filter(k => k.status === 'active');
  console.log(`\nChecking ${activeKeys.length} active keys...`);

  const rotationStatus = activeKeys.map(key => ({
    key,
    rotation: needsRotation(key, registry.rotationPolicy),
  }));

  // Report status
  console.log('\nRotation Status:');
  console.log('─'.repeat(80));

  for (const { key, rotation } of rotationStatus) {
    const indicator = {
      ok: '✅',
      warning: '⚠️ ',
      critical: '🔴',
      overdue: '❌',
    }[rotation.urgency];

    console.log(`${indicator} ${key.kid} (${key.scope})`);
    console.log(`   Days until rotation: ${rotation.daysUntilRotation}`);
    console.log(`   Rotates at: ${key.rotatesAt}`);
    console.log();
  }

  // Emit proof
  await emitRotationProof(registry, rotationStatus);

  // Check for critical rotations
  const criticalKeys = rotationStatus.filter(
    ({ rotation }) => rotation.urgency === 'critical' || rotation.urgency === 'overdue'
  );

  if (criticalKeys.length > 0) {
    console.log(`\n⚠️  WARNING: ${criticalKeys.length} key(s) need immediate rotation!`);
    console.log('Please rotate keys manually using the key rotation procedure.');
    process.exit(1);
  }

  console.log('\n✅ Key rotation check complete');
}

// Execute
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
