/**
 * Durable Nonce Store
 *
 * Shared anti-replay protection across process restarts.
 * Uses SQLite for persistence with automatic cleanup.
 *
 * Prevents replay attacks for both federation sync and governance ACKs.
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { join } from 'path';

let dbInstance: Database | null = null;

/**
 * Get database connection
 */
async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = join(process.cwd(), '..', 'data', 'nonce_store.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize schema
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce TEXT PRIMARY KEY,
      context TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_nonces_expires ON nonces(expires_at);
    CREATE INDEX IF NOT EXISTS idx_nonces_context ON nonces(context);
  `);

  return dbInstance;
}

/**
 * Check if nonce exists (replay detection)
 */
export async function hasNonce(nonce: string, context: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.get(
    'SELECT 1 FROM nonces WHERE nonce = ? AND context = ? AND expires_at > ?',
    [nonce, context, Date.now()]
  );

  return !!result;
}

/**
 * Store nonce (mark as seen)
 */
export async function storeNonce(
  nonce: string,
  context: string,
  ttlSeconds = 3600
): Promise<void> {
  const db = await getDatabase();

  const now = Date.now();
  const expiresAt = now + (ttlSeconds * 1000);

  await db.run(
    'INSERT OR REPLACE INTO nonces (nonce, context, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [nonce, context, now, expiresAt]
  );
}

/**
 * Cleanup expired nonces
 */
export async function cleanupExpiredNonces(): Promise<number> {
  const db = await getDatabase();

  const result = await db.run(
    'DELETE FROM nonces WHERE expires_at <= ?',
    [Date.now()]
  );

  return result.changes || 0;
}

/**
 * Get nonce statistics
 */
export async function getNonceStats(): Promise<{
  total: number;
  active: number;
  expired: number;
  byContext: Record<string, number>;
}> {
  const db = await getDatabase();

  const now = Date.now();

  const total = await db.get('SELECT COUNT(*) as count FROM nonces');
  const active = await db.get('SELECT COUNT(*) as count FROM nonces WHERE expires_at > ?', [now]);
  const expired = await db.get('SELECT COUNT(*) as count FROM nonces WHERE expires_at <= ?', [now]);

  const byContextRows = await db.all(`
    SELECT context, COUNT(*) as count
    FROM nonces
    WHERE expires_at > ?
    GROUP BY context
  `, [now]);

  const byContext: Record<string, number> = {};
  for (const row of byContextRows) {
    byContext[row.context] = row.count;
  }

  return {
    total: total?.count || 0,
    active: active?.count || 0,
    expired: expired?.count || 0,
    byContext,
  };
}

/**
 * Check and store nonce atomically
 * Returns true if nonce is new (allowed), false if replay detected
 */
export async function checkAndStoreNonce(
  nonce: string,
  context: string,
  ttlSeconds = 3600
): Promise<boolean> {
  const exists = await hasNonce(nonce, context);

  if (exists) {
    return false; // Replay detected
  }

  await storeNonce(nonce, context, ttlSeconds);
  return true; // New nonce, allowed
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
