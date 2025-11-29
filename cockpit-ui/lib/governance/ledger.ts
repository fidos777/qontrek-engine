/**
 * Governance Ledger Store
 *
 * Provides durable storage for governance events and state mutations.
 * Ensures all DB writes go through ledger events for audit trail.
 *
 * @module lib/governance/ledger
 */

import { writeFile, appendFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

/**
 * Ledger Event Types
 */
export type LedgerEventType =
  | 'state_mutation'      // Any state change (DB write, file update)
  | 'tool_invocation'     // MCP tool was called
  | 'governance_check'    // Governance validation performed
  | 'access_granted'      // Authorization succeeded
  | 'access_denied'       // Authorization failed
  | 'error'               // Error occurred
  | 'receipt_created'     // Tower receipt created
  | 'receipt_verified'    // Tower receipt verified
  | 'key_rotated'         // Security key rotated
  | 'nonce_stored'        // Anti-replay nonce stored
  | 'alert_triggered';    // SLO alert triggered

/**
 * Base Ledger Event structure
 */
export interface BaseLedgerEvent {
  eventId: string;
  eventType: LedgerEventType;
  timestamp: string;
  actorId: string;
  actorType: string;
  toolName?: string;
  vertical?: string;
  gateId?: string;
}

/**
 * State Mutation Event
 */
export interface StateMutationEvent extends BaseLedgerEvent {
  eventType: 'state_mutation';
  resource: string;         // e.g., 'receipt', 'key', 'nonce'
  resourceId: string;
  operation: 'create' | 'update' | 'delete';
  previousState?: Record<string, unknown>;
  newState: Record<string, unknown>;
  checksum: string;         // Hash of new state for verification
}

/**
 * Ledger Event (union type)
 */
export type LedgerEvent = BaseLedgerEvent | StateMutationEvent;

// SQLite database instance
let ledgerDb: Database | null = null;

/**
 * Initialize ledger database
 */
async function initLedgerDb(): Promise<Database> {
  if (ledgerDb) {
    return ledgerDb;
  }

  const dbPath = join(process.cwd(), '..', 'data', 'governance_ledger.db');

  // Ensure data directory exists
  await mkdir(join(process.cwd(), '..', 'data'), { recursive: true }).catch(() => {});

  ledgerDb = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize schema
  await ledgerDb.exec(`
    CREATE TABLE IF NOT EXISTS ledger_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      tool_name TEXT,
      vertical TEXT,
      gate_id TEXT,
      resource TEXT,
      resource_id TEXT,
      operation TEXT,
      previous_state TEXT,
      new_state TEXT,
      checksum TEXT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ledger_timestamp ON ledger_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_ledger_event_type ON ledger_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_ledger_actor ON ledger_events(actor_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_resource ON ledger_events(resource, resource_id);
  `);

  return ledgerDb;
}

/**
 * Generate unique event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Compute checksum for state verification
 */
export function computeStateChecksum(state: Record<string, unknown>): string {
  const canonical = JSON.stringify(state, Object.keys(state).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Append event to ledger (durable storage)
 */
export async function appendToLedger(event: LedgerEvent): Promise<void> {
  const db = await initLedgerDb();

  const isMutation = event.eventType === 'state_mutation';
  const mutationEvent = isMutation ? (event as StateMutationEvent) : null;

  await db.run(
    `INSERT INTO ledger_events (
      event_id, event_type, timestamp, actor_id, actor_type,
      tool_name, vertical, gate_id,
      resource, resource_id, operation,
      previous_state, new_state, checksum,
      payload, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.eventId,
      event.eventType,
      event.timestamp,
      event.actorId,
      event.actorType,
      event.toolName || null,
      event.vertical || null,
      event.gateId || null,
      mutationEvent?.resource || null,
      mutationEvent?.resourceId || null,
      mutationEvent?.operation || null,
      mutationEvent?.previousState ? JSON.stringify(mutationEvent.previousState) : null,
      mutationEvent?.newState ? JSON.stringify(mutationEvent.newState) : null,
      mutationEvent?.checksum || null,
      JSON.stringify(event),
      Date.now(),
    ]
  );

  // Also append to JSONL file for external consumption
  const logPath = join(process.cwd(), '..', 'logs', 'governance_ledger.jsonl');
  await appendFile(logPath, JSON.stringify(event) + '\n', 'utf-8').catch(() => {});
}

/**
 * Query ledger events
 */
export async function queryLedger(options: {
  eventTypes?: LedgerEventType[];
  actorId?: string;
  resource?: string;
  resourceId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}): Promise<LedgerEvent[]> {
  const db = await initLedgerDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.eventTypes?.length) {
    conditions.push(`event_type IN (${options.eventTypes.map(() => '?').join(', ')})`);
    params.push(...options.eventTypes);
  }

  if (options.actorId) {
    conditions.push('actor_id = ?');
    params.push(options.actorId);
  }

  if (options.resource) {
    conditions.push('resource = ?');
    params.push(options.resource);
  }

  if (options.resourceId) {
    conditions.push('resource_id = ?');
    params.push(options.resourceId);
  }

  if (options.startTime) {
    conditions.push('timestamp >= ?');
    params.push(options.startTime);
  }

  if (options.endTime) {
    conditions.push('timestamp <= ?');
    params.push(options.endTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const rows = await db.all(
    `SELECT payload FROM ledger_events ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows.map((row) => JSON.parse(row.payload as string));
}

/**
 * Get ledger statistics
 */
export async function getLedgerStats(): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: number;
  oldestEvent?: string;
  newestEvent?: string;
}> {
  const db = await initLedgerDb();

  const total = await db.get('SELECT COUNT(*) as count FROM ledger_events');
  const byType = await db.all(
    'SELECT event_type, COUNT(*) as count FROM ledger_events GROUP BY event_type'
  );
  const recent = await db.get(
    'SELECT COUNT(*) as count FROM ledger_events WHERE created_at > ?',
    [Date.now() - 24 * 60 * 60 * 1000]
  );
  const oldest = await db.get('SELECT MIN(timestamp) as ts FROM ledger_events');
  const newest = await db.get('SELECT MAX(timestamp) as ts FROM ledger_events');

  const eventsByType: Record<string, number> = {};
  for (const row of byType) {
    eventsByType[row.event_type as string] = row.count as number;
  }

  return {
    totalEvents: (total?.count as number) || 0,
    eventsByType,
    recentEvents: (recent?.count as number) || 0,
    oldestEvent: oldest?.ts as string | undefined,
    newestEvent: newest?.ts as string | undefined,
  };
}

/**
 * Emit state mutation event (wrapper for DB writes)
 */
export async function emitStateMutation(params: {
  actorId: string;
  actorType: string;
  resource: string;
  resourceId: string;
  operation: 'create' | 'update' | 'delete';
  previousState?: Record<string, unknown>;
  newState: Record<string, unknown>;
  toolName?: string;
  vertical?: string;
  gateId?: string;
}): Promise<string> {
  const eventId = generateEventId();
  const checksum = computeStateChecksum(params.newState);

  const event: StateMutationEvent = {
    eventId,
    eventType: 'state_mutation',
    timestamp: new Date().toISOString(),
    actorId: params.actorId,
    actorType: params.actorType,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    previousState: params.previousState,
    newState: params.newState,
    checksum,
    toolName: params.toolName,
    vertical: params.vertical,
    gateId: params.gateId,
  };

  await appendToLedger(event);

  return eventId;
}

/**
 * Verify state integrity using ledger
 */
export async function verifyStateIntegrity(
  resource: string,
  resourceId: string,
  currentState: Record<string, unknown>
): Promise<{
  valid: boolean;
  expectedChecksum?: string;
  actualChecksum: string;
  lastMutation?: LedgerEvent;
}> {
  const actualChecksum = computeStateChecksum(currentState);

  // Get latest mutation for this resource
  const events = await queryLedger({
    eventTypes: ['state_mutation'],
    resource,
    resourceId,
    limit: 1,
  });

  if (events.length === 0) {
    // No recorded mutations - can't verify
    return { valid: true, actualChecksum };
  }

  const lastMutation = events[0] as StateMutationEvent;
  const expectedChecksum = lastMutation.checksum;

  return {
    valid: actualChecksum === expectedChecksum,
    expectedChecksum,
    actualChecksum,
    lastMutation,
  };
}

/**
 * Close ledger database
 */
export async function closeLedger(): Promise<void> {
  if (ledgerDb) {
    await ledgerDb.close();
    ledgerDb = null;
  }
}
