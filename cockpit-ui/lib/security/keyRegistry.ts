/**
 * Key Lifecycle Registry
 *
 * Manages signing key lifecycle, rotation tracking, and attestation.
 * Stores key metadata (not secrets) for governance and audit.
 */

import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export interface KeyMetadata {
  kid: string;
  algorithm: 'HMAC-SHA256' | 'RSA-SHA256' | 'ECDSA-P256';
  createdAt: string;
  rotatesAt: string;
  rotatedAt?: string;
  status: 'active' | 'rotating' | 'retired';
  usage: 'signing' | 'verification';
  scope: 'factory' | 'tower' | 'federation';
}

export interface KeyRegistry {
  version: 'v1.0';
  lastUpdated: string;
  keys: KeyMetadata[];
  rotationPolicy: {
    maxAgeDays: number;
    warningDays: number;
    gracePeriodDays: number;
  };
}

const DEFAULT_REGISTRY: KeyRegistry = {
  version: 'v1.0',
  lastUpdated: new Date().toISOString(),
  keys: [],
  rotationPolicy: {
    maxAgeDays: 90,
    warningDays: 14,
    gracePeriodDays: 7,
  },
};

/**
 * Load key registry from disk
 */
export async function loadKeyRegistry(): Promise<KeyRegistry> {
  try {
    const registryPath = join(process.cwd(), '..', 'config', 'key_registry.json');
    const content = await readFile(registryPath, 'utf-8');
    return JSON.parse(content) as KeyRegistry;
  } catch (error) {
    // Initialize with default if not exists
    return DEFAULT_REGISTRY;
  }
}

/**
 * Save key registry to disk
 */
export async function saveKeyRegistry(registry: KeyRegistry): Promise<void> {
  const registryPath = join(process.cwd(), '..', 'config', 'key_registry.json');
  registry.lastUpdated = new Date().toISOString();
  await writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Register new key
 */
export async function registerKey(key: Omit<KeyMetadata, 'createdAt' | 'rotatesAt'>): Promise<KeyMetadata> {
  const registry = await loadKeyRegistry();

  const now = new Date();
  const rotatesAt = new Date(now);
  rotatesAt.setDate(rotatesAt.getDate() + registry.rotationPolicy.maxAgeDays);

  const keyMetadata: KeyMetadata = {
    ...key,
    createdAt: now.toISOString(),
    rotatesAt: rotatesAt.toISOString(),
  };

  registry.keys.push(keyMetadata);
  await saveKeyRegistry(registry);

  return keyMetadata;
}

/**
 * Get active key for scope
 */
export async function getActiveKey(scope: KeyMetadata['scope']): Promise<KeyMetadata | null> {
  const registry = await loadKeyRegistry();
  return registry.keys.find(k => k.scope === scope && k.status === 'active') || null;
}

/**
 * Check if key needs rotation
 */
export function needsRotation(key: KeyMetadata, policy: KeyRegistry['rotationPolicy']): {
  needsRotation: boolean;
  daysUntilRotation: number;
  urgency: 'ok' | 'warning' | 'critical' | 'overdue';
} {
  const now = new Date();
  const rotatesAt = new Date(key.rotatesAt);
  const daysUntilRotation = Math.floor((rotatesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let urgency: 'ok' | 'warning' | 'critical' | 'overdue' = 'ok';

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
 * Get rotation status for all keys
 */
export async function getRotationStatus(): Promise<Array<{
  key: KeyMetadata;
  rotation: ReturnType<typeof needsRotation>;
}>> {
  const registry = await loadKeyRegistry();

  return registry.keys
    .filter(k => k.status === 'active')
    .map(key => ({
      key,
      rotation: needsRotation(key, registry.rotationPolicy),
    }));
}

/**
 * Mark key for rotation
 */
export async function markKeyForRotation(kid: string): Promise<void> {
  const registry = await loadKeyRegistry();
  const key = registry.keys.find(k => k.kid === kid);

  if (!key) {
    throw new Error(`Key not found: ${kid}`);
  }

  key.status = 'rotating';
  await saveKeyRegistry(registry);
}

/**
 * Complete key rotation
 */
export async function completeKeyRotation(
  oldKid: string,
  newKey: Omit<KeyMetadata, 'createdAt' | 'rotatesAt'>
): Promise<KeyMetadata> {
  const registry = await loadKeyRegistry();
  const oldKey = registry.keys.find(k => k.kid === oldKid);

  if (!oldKey) {
    throw new Error(`Old key not found: ${oldKid}`);
  }

  // Retire old key
  oldKey.status = 'retired';
  oldKey.rotatedAt = new Date().toISOString();

  // Register new key
  const newKeyMetadata = await registerKey(newKey);

  return newKeyMetadata;
}

/**
 * Emit security_key_rotation_v1.json proof
 */
export async function emitKeyRotationProof(): Promise<void> {
  const registry = await loadKeyRegistry();
  const rotationStatus = await getRotationStatus();

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

  const proofPath = join(process.cwd(), '..', 'proof', 'security_key_rotation_v1.json');
  await writeFile(proofPath, JSON.stringify(proof, null, 2), 'utf-8');
}
