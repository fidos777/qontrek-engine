// lib/security/keyRegistry.ts
// HMAC key lifecycle management with rotation tracking

import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

export interface KeyMetadata {
  kid: string; // Key ID (e.g., "key-2025-01-22-001")
  created_at: number; // Unix timestamp (ms)
  rotates_at: number; // Unix timestamp (ms)
  status: "active" | "rotated" | "revoked"; // Key status
  key_hex: string; // Hex-encoded HMAC key (64 chars = 32 bytes)
}

const REGISTRY_PATH = path.join(process.cwd(), ".keys", "registry.json");
const DEFAULT_ROTATION_DAYS = 90; // Rotate every 90 days

/**
 * Ensure .keys directory exists
 */
function ensureKeysDir() {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load key registry from disk
 */
function loadRegistry(): KeyMetadata[] {
  ensureKeysDir();

  if (!fs.existsSync(REGISTRY_PATH)) {
    return [];
  }

  try {
    const data = fs.readFileSync(REGISTRY_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load key registry:", error);
    return [];
  }
}

/**
 * Save key registry to disk
 */
function saveRegistry(keys: KeyMetadata[]) {
  ensureKeysDir();

  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(keys, null, 2));
  } catch (error) {
    console.error("Failed to save key registry:", error);
  }
}

/**
 * Generate a new HMAC key with metadata
 */
export function generateKey(rotationDays: number = DEFAULT_ROTATION_DAYS): KeyMetadata {
  const now = Date.now();
  const kid = `key-${new Date(now).toISOString().split("T")[0]}-${randomBytes(4).toString("hex")}`;
  const key_hex = randomBytes(32).toString("hex"); // 256-bit key

  return {
    kid,
    created_at: now,
    rotates_at: now + rotationDays * 24 * 60 * 60 * 1000,
    status: "active",
    key_hex,
  };
}

/**
 * Get the active key (returns env key if no registry exists)
 */
export function getActiveKey(): { kid: string; key: string } {
  const registry = loadRegistry();
  const activeKey = registry.find((k) => k.status === "active");

  if (activeKey) {
    return { kid: activeKey.kid, key: activeKey.key_hex };
  }

  // Fallback to environment variable
  const envKey = process.env.TOWER_SHARED_KEY || "dev-shared-key";
  return { kid: "env-key", key: envKey };
}

/**
 * Get a specific key by kid
 */
export function getKeyById(kid: string): KeyMetadata | null {
  const registry = loadRegistry();
  return registry.find((k) => k.kid === kid) || null;
}

/**
 * Check if active key should be rotated
 */
export function shouldRotate(): {
  should_rotate: boolean;
  days_until_rotation: number;
  active_kid: string;
} {
  const registry = loadRegistry();
  const activeKey = registry.find((k) => k.status === "active");

  if (!activeKey) {
    return {
      should_rotate: true,
      days_until_rotation: 0,
      active_kid: "env-key",
    };
  }

  const now = Date.now();
  const daysUntil = Math.ceil((activeKey.rotates_at - now) / (24 * 60 * 60 * 1000));

  return {
    should_rotate: now >= activeKey.rotates_at,
    days_until_rotation: daysUntil,
    active_kid: activeKey.kid,
  };
}

/**
 * List all keys in registry
 */
export function listKeys(): KeyMetadata[] {
  return loadRegistry();
}

/**
 * Rotate the active key (mark as rotated, generate new active key)
 */
export function rotateKey(): KeyMetadata {
  const registry = loadRegistry();

  // Mark current active key as rotated
  registry.forEach((k) => {
    if (k.status === "active") {
      k.status = "rotated";
    }
  });

  // Generate new active key
  const newKey = generateKey();
  registry.push(newKey);

  saveRegistry(registry);
  return newKey;
}

/**
 * Revoke a key by kid (prevents it from being used for verification)
 */
export function revokeKey(kid: string): boolean {
  const registry = loadRegistry();
  const key = registry.find((k) => k.kid === kid);

  if (!key) {
    return false;
  }

  key.status = "revoked";
  saveRegistry(registry);
  return true;
}

/**
 * Initialize registry with first key if empty
 */
export function initializeRegistry() {
  const registry = loadRegistry();

  if (registry.length === 0) {
    const firstKey = generateKey();
    saveRegistry([firstKey]);
    console.log(`[KeyRegistry] Initialized with first key: ${firstKey.kid}`);
    return firstKey;
  }

  return null;
}

/**
 * Get rotation status for governance reporting
 */
export function getRotationStatus(): {
  activeKid: string;
  rotationStatus: "ok" | "warn" | "due";
  rotationDueInDays: number;
  totalKeys: number;
} {
  const rotation = shouldRotate();
  let status: "ok" | "warn" | "due" = "ok";

  if (rotation.should_rotate) {
    status = "due";
  } else if (rotation.days_until_rotation <= 7) {
    status = "warn";
  }

  return {
    activeKid: rotation.active_kid,
    rotationStatus: status,
    rotationDueInDays: rotation.days_until_rotation,
    totalKeys: listKeys().length,
  };
}
