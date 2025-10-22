// lib/security/nonceStore.ts
// Durable nonce store for replay attack prevention

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), ".logs", "nonces.db");
const DEFAULT_TTL_SEC = 300; // 5 minutes
const PRUNE_INTERVAL_MS = 60000; // Prune every 60 seconds

let db: Database.Database | null = null;
let lastPruneAt = 0;

/**
 * Initialize database connection and schema
 */
function initDB(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure .logs directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open database connection
  db = new Database(DB_PATH);

  // Create nonces table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    )
  `);

  // Create index on expires_at for faster pruning
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expires_at ON nonces(expires_at)
  `);

  console.log(`[NonceStore] Initialized SQLite store at ${DB_PATH}`);

  return db;
}

/**
 * Check if a nonce has been seen before
 * @returns true if nonce was previously recorded (replay attack)
 */
export function seen(nonce: string): boolean {
  const database = initDB();

  const stmt = database.prepare("SELECT nonce FROM nonces WHERE nonce = ?");
  const result = stmt.get(nonce);

  return result !== undefined;
}

/**
 * Record a nonce with expiration TTL
 * @param nonce The nonce to record
 * @param ttlSec Time-to-live in seconds (default 300 = 5 minutes)
 * @returns true if successfully recorded, false if already exists
 */
export function record(nonce: string, ttlSec: number = DEFAULT_TTL_SEC): boolean {
  const database = initDB();

  const expiresAt = Date.now() + ttlSec * 1000;

  try {
    const stmt = database.prepare("INSERT INTO nonces (nonce, expires_at) VALUES (?, ?)");
    stmt.run(nonce, expiresAt);

    // Auto-prune on record if interval elapsed
    autoPrune();

    return true;
  } catch (error: any) {
    // Unique constraint violation = nonce already exists
    if (error.code === "SQLITE_CONSTRAINT") {
      return false;
    }
    throw error;
  }
}

/**
 * Prune expired nonces from the database
 * @returns Number of nonces pruned
 */
export function prune(): number {
  const database = initDB();

  const now = Date.now();
  const stmt = database.prepare("DELETE FROM nonces WHERE expires_at < ?");
  const result = stmt.run(now);

  lastPruneAt = now;

  return result.changes;
}

/**
 * Auto-prune expired nonces if interval has elapsed
 */
function autoPrune() {
  const now = Date.now();

  if (now - lastPruneAt > PRUNE_INTERVAL_MS) {
    const pruned = prune();
    if (pruned > 0) {
      console.log(`[NonceStore] Auto-pruned ${pruned} expired nonces`);
    }
  }
}

/**
 * Get nonce store statistics for governance reporting
 */
export function getStats(): {
  backend: string;
  size: number;
  lastPruneAt: number;
  dbPath: string;
} {
  const database = initDB();

  const stmt = database.prepare("SELECT COUNT(*) as count FROM nonces");
  const result = stmt.get() as { count: number };

  return {
    backend: "sqlite",
    size: result.count,
    lastPruneAt,
    dbPath: DB_PATH,
  };
}

/**
 * Close database connection (for graceful shutdown)
 */
export function close() {
  if (db) {
    db.close();
    db = null;
    console.log("[NonceStore] Closed database connection");
  }
}

/**
 * Clear all nonces (for testing)
 */
export function clear() {
  const database = initDB();
  database.exec("DELETE FROM nonces");
  console.log("[NonceStore] Cleared all nonces");
}
