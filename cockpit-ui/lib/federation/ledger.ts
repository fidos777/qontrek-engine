// lib/federation/ledger.ts
// SQLite-backed federation ACK ledger with JSONL export

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { FederationACK } from "./signer";

const DB_PATH = path.join(process.cwd(), ".logs", "federation", "ack_ledger.db");
const JSONL_PATH = path.join(process.cwd(), ".logs", "federation", "ack_ledger.jsonl");
const MAX_JSONL_SIZE_MB = 5;

let db: Database.Database | null = null;

export interface LedgerEntry extends FederationACK {
  batch_id: string;
  created_at: number;
}

export interface LedgerStats {
  total_acks: number;
  unique_batches: number;
  unique_nodes: number;
  oldest_ack_timestamp: number;
  newest_ack_timestamp: number;
  db_size_bytes: number;
  jsonl_size_bytes: number;
}

/**
 * Initialize SQLite database and schema
 */
function initLedgerDB(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure .logs/federation directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open database connection
  db = new Database(DB_PATH);

  // Create ack_ledger table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ack_ledger (
      event_id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      nonce TEXT NOT NULL,
      payload TEXT NOT NULL,
      signature TEXT NOT NULL,
      prev_signature TEXT,
      created_at BIGINT NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // Create indexes for query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ack_ledger_batch_id ON ack_ledger(batch_id);
    CREATE INDEX IF NOT EXISTS idx_ack_ledger_node_id ON ack_ledger(node_id);
    CREATE INDEX IF NOT EXISTS idx_ack_ledger_timestamp ON ack_ledger(timestamp);
    CREATE INDEX IF NOT EXISTS idx_ack_ledger_created_at ON ack_ledger(created_at);
  `);

  console.log(`[Ledger] Initialized SQLite database at ${DB_PATH}`);

  return db;
}

/**
 * Insert ACK into ledger
 * @returns true if inserted, false if duplicate (idempotent)
 */
export function insertAck(ack: FederationACK, batchId: string): boolean {
  const database = initLedgerDB();

  try {
    const stmt = database.prepare(`
      INSERT INTO ack_ledger (
        event_id, batch_id, node_id, event_type, timestamp,
        nonce, payload, signature, prev_signature, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      ack.event_id,
      batchId,
      ack.node_id,
      ack.event_type,
      ack.timestamp,
      ack.nonce,
      JSON.stringify(ack.payload),
      ack.signature,
      ack.prev_signature || null,
      Date.now()
    );

    return true;
  } catch (error: any) {
    // Unique constraint violation = duplicate event_id
    if (error.code === "SQLITE_CONSTRAINT") {
      return false;
    }
    throw error;
  }
}

/**
 * Check if event_id exists in ledger
 */
export function hasAck(eventId: string): boolean {
  const database = initLedgerDB();

  const stmt = database.prepare("SELECT event_id FROM ack_ledger WHERE event_id = ?");
  const result = stmt.get(eventId);

  return result !== undefined;
}

/**
 * Get ACK by event_id
 */
export function getAck(eventId: string): LedgerEntry | null {
  const database = initLedgerDB();

  const stmt = database.prepare("SELECT * FROM ack_ledger WHERE event_id = ?");
  const row = stmt.get(eventId) as any;

  if (!row) {
    return null;
  }

  return {
    event_id: row.event_id,
    batch_id: row.batch_id,
    node_id: row.node_id,
    event_type: row.event_type,
    timestamp: row.timestamp,
    nonce: row.nonce,
    payload: JSON.parse(row.payload),
    signature: row.signature,
    prev_signature: row.prev_signature,
    created_at: row.created_at,
  };
}

/**
 * Get recent ACKs (last N entries)
 */
export function getRecentAcks(limit: number = 100): LedgerEntry[] {
  const database = initLedgerDB();

  const stmt = database.prepare(`
    SELECT * FROM ack_ledger
    ORDER BY timestamp DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as any[];

  return rows.map((row) => ({
    event_id: row.event_id,
    batch_id: row.batch_id,
    node_id: row.node_id,
    event_type: row.event_type,
    timestamp: row.timestamp,
    nonce: row.nonce,
    payload: JSON.parse(row.payload),
    signature: row.signature,
    prev_signature: row.prev_signature,
    created_at: row.created_at,
  }));
}

/**
 * Get ACKs by batch_id
 */
export function getAcksByBatch(batchId: string): LedgerEntry[] {
  const database = initLedgerDB();

  const stmt = database.prepare(`
    SELECT * FROM ack_ledger
    WHERE batch_id = ?
    ORDER BY timestamp
  `);

  const rows = stmt.all(batchId) as any[];

  return rows.map((row) => ({
    event_id: row.event_id,
    batch_id: row.batch_id,
    node_id: row.node_id,
    event_type: row.event_type,
    timestamp: row.timestamp,
    nonce: row.nonce,
    payload: JSON.parse(row.payload),
    signature: row.signature,
    prev_signature: row.prev_signature,
    created_at: row.created_at,
  }));
}

/**
 * Get ACKs within time window
 */
export function getAcksSince(sinceTimestamp: number, limit: number = 100): LedgerEntry[] {
  const database = initLedgerDB();

  const stmt = database.prepare(`
    SELECT * FROM ack_ledger
    WHERE timestamp > ?
    ORDER BY timestamp
    LIMIT ?
  `);

  const rows = stmt.all(sinceTimestamp, limit) as any[];

  return rows.map((row) => ({
    event_id: row.event_id,
    batch_id: row.batch_id,
    node_id: row.node_id,
    event_type: row.event_type,
    timestamp: row.timestamp,
    nonce: row.nonce,
    payload: JSON.parse(row.payload),
    signature: row.signature,
    prev_signature: row.prev_signature,
    created_at: row.created_at,
  }));
}

/**
 * Get ledger statistics for governance
 */
export function getLedgerStats(): LedgerStats {
  const database = initLedgerDB();

  // Total ACKs
  const countStmt = database.prepare("SELECT COUNT(*) as count FROM ack_ledger");
  const countResult = countStmt.get() as { count: number };

  // Unique batches
  const batchesStmt = database.prepare("SELECT COUNT(DISTINCT batch_id) as count FROM ack_ledger");
  const batchesResult = batchesStmt.get() as { count: number };

  // Unique nodes
  const nodesStmt = database.prepare("SELECT COUNT(DISTINCT node_id) as count FROM ack_ledger");
  const nodesResult = nodesStmt.get() as { count: number };

  // Timestamp range
  const rangeStmt = database.prepare(`
    SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest
    FROM ack_ledger
  `);
  const rangeResult = rangeStmt.get() as { oldest: number; newest: number };

  // Database size
  const dbSize = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0;

  // JSONL size
  const jsonlSize = fs.existsSync(JSONL_PATH) ? fs.statSync(JSONL_PATH).size : 0;

  return {
    total_acks: countResult.count,
    unique_batches: batchesResult.count,
    unique_nodes: nodesResult.count,
    oldest_ack_timestamp: rangeResult.oldest || 0,
    newest_ack_timestamp: rangeResult.newest || 0,
    db_size_bytes: dbSize,
    jsonl_size_bytes: jsonlSize,
  };
}

/**
 * Export ledger to JSONL format
 * Rotates file if exceeds MAX_JSONL_SIZE_MB
 */
export function exportLedgerToJSONL(): void {
  const database = initLedgerDB();

  // Check if rotation needed
  if (fs.existsSync(JSONL_PATH)) {
    const currentSize = fs.statSync(JSONL_PATH).size;
    const maxSizeBytes = MAX_JSONL_SIZE_MB * 1024 * 1024;

    if (currentSize > maxSizeBytes) {
      const backupPath = `${JSONL_PATH}.${Date.now()}.bak`;
      fs.renameSync(JSONL_PATH, backupPath);
      console.log(`[Ledger] Rotated JSONL to ${backupPath}`);
    }
  }

  // Export all rows
  const stmt = database.prepare("SELECT * FROM ack_ledger ORDER BY timestamp");
  const rows = stmt.all() as any[];

  const jsonl = rows
    .map((row) => {
      const entry: LedgerEntry = {
        event_id: row.event_id,
        batch_id: row.batch_id,
        node_id: row.node_id,
        event_type: row.event_type,
        timestamp: row.timestamp,
        nonce: row.nonce,
        payload: JSON.parse(row.payload),
        signature: row.signature,
        prev_signature: row.prev_signature,
        created_at: row.created_at,
      };
      return JSON.stringify(entry);
    })
    .join("\n");

  // Ensure directory exists
  const dir = path.dirname(JSONL_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(JSONL_PATH, jsonl + "\n");
  console.log(`[Ledger] Exported ${rows.length} ACKs to ${JSONL_PATH}`);
}

/**
 * Get most recent ACK verification timestamp
 * Used for governance G18 check
 */
export function getLastVerifiedAckAge(): number | null {
  const database = initLedgerDB();

  const stmt = database.prepare(`
    SELECT MAX(created_at) as last_created
    FROM ack_ledger
  `);

  const result = stmt.get() as { last_created: number | null };

  if (!result.last_created) {
    return null;
  }

  const ageMs = Date.now() - result.last_created;
  return Math.floor(ageMs / 1000); // Return age in seconds
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeLedger() {
  if (db) {
    db.close();
    db = null;
    console.log("[Ledger] Closed database connection");
  }
}

/**
 * Clear all ACKs (for testing)
 */
export function clearLedger() {
  const database = initLedgerDB();
  database.exec("DELETE FROM ack_ledger");
  console.log("[Ledger] Cleared all ACKs");
}

/**
 * Vacuum database (optimize storage)
 */
export function vacuumLedger() {
  const database = initLedgerDB();
  database.exec("VACUUM");
  console.log("[Ledger] Vacuumed database");
}
