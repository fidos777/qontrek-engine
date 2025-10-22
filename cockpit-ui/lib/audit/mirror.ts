// lib/audit/mirror.ts
// Supabase audit log mirroring with idempotency and retry logic

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readLogTail } from "@/lib/logs/logger";
import { redact } from "@/lib/logs/scrub";
import { randomBytes } from "crypto";

export interface MirrorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface AuditLogEntry {
  tenant_id: string;
  timestamp: number;
  event_type: string;
  event_hash: string; // Idempotency key
  panic_mode: boolean;
  payload: any;
}

export interface MirrorRunStats {
  mirror_run_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  events_processed: number;
  events_inserted: number;
  events_skipped: number;
  errors: number;
  merkle_root?: string;
}

/**
 * Create Supabase client
 */
function createSupabaseClient(config: MirrorConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseKey);
}

/**
 * Compute SHA-256 hash of event for idempotency
 */
function computeEventHash(event: any): string {
  // Canonical representation: sorted keys, no whitespace
  const canonical = JSON.stringify(event, Object.keys(event).sort());
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Transform log entry to audit log format
 */
function transformToAuditLog(
  entry: any,
  tenantId: string
): AuditLogEntry | null {
  // Skip entries without required fields
  if (!entry.event || !entry.timestamp) {
    return null;
  }

  // Scrub PII from payload
  const scrubbed = redact(entry);

  // Compute idempotency hash
  const eventHash = computeEventHash({
    tenant_id: tenantId,
    timestamp: entry.timestamp,
    event: entry.event,
  });

  return {
    tenant_id: tenantId,
    timestamp: entry.timestamp,
    event_type: entry.event,
    event_hash: eventHash,
    panic_mode: entry.panic_mode || false,
    payload: scrubbed,
  };
}

/**
 * Exponential backoff delay
 */
function exponentialBackoff(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * Math.pow(2, attempt);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Insert audit logs with idempotency and retry
 */
async function insertAuditLogs(
  client: SupabaseClient,
  entries: AuditLogEntry[],
  config: MirrorConfig
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const maxRetries = config.maxRetries || 3;
  const baseDelay = config.retryDelayMs || 2000;

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of entries) {
    let attempt = 0;
    let success = false;

    while (attempt <= maxRetries && !success) {
      try {
        // Insert with ON CONFLICT DO NOTHING via upsert with onConflict: 'event_hash'
        const { data, error } = await client
          .from("audit_log")
          .upsert(entry, {
            onConflict: "event_hash",
            ignoreDuplicates: true,
          })
          .select();

        if (error) {
          throw error;
        }

        // Check if row was inserted (data present) or skipped (empty)
        if (data && data.length > 0) {
          inserted++;
        } else {
          skipped++;
        }

        success = true;
      } catch (error: any) {
        attempt++;

        if (attempt > maxRetries) {
          console.error(
            `Failed to insert audit log after ${maxRetries} retries:`,
            error
          );
          errors++;
          break;
        }

        // Exponential backoff
        const delay = exponentialBackoff(attempt - 1, baseDelay);
        console.warn(
          `Insert failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  return { inserted, skipped, errors };
}

/**
 * Mirror logs to Supabase with idempotency and retry
 */
export async function mirrorLogsToSupabase(
  config: MirrorConfig
): Promise<MirrorRunStats> {
  const runId = randomBytes(8).toString("hex");
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  console.log(`[Mirror] Starting run ${runId}`);

  try {
    // 1. Create Supabase client
    const client = createSupabaseClient(config);

    // 2. Read recent logs
    const batchSize = config.batchSize || 100;
    const logEntries = readLogTail(batchSize);

    console.log(`[Mirror] Read ${logEntries.length} log entries`);

    // 3. Transform to audit log format
    const auditLogs = logEntries
      .map((entry) => transformToAuditLog(entry, config.tenantId))
      .filter((entry): entry is AuditLogEntry => entry !== null);

    console.log(`[Mirror] Transformed ${auditLogs.length} audit logs`);

    // 4. Insert with idempotency and retry
    const { inserted, skipped, errors } = await insertAuditLogs(
      client,
      auditLogs,
      config
    );

    console.log(
      `[Mirror] Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`
    );

    // 5. Return run stats
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    const stats: MirrorRunStats = {
      mirror_run_id: runId,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      events_processed: logEntries.length,
      events_inserted: inserted,
      events_skipped: skipped,
      errors,
    };

    console.log(
      `[Mirror] Run ${runId} completed in ${durationMs}ms (${inserted} inserted, ${skipped} skipped, ${errors} errors)`
    );

    return stats;
  } catch (error) {
    console.error(`[Mirror] Run ${runId} failed:`, error);

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    return {
      mirror_run_id: runId,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      events_processed: 0,
      events_inserted: 0,
      events_skipped: 0,
      errors: 1,
    };
  }
}

/**
 * Get Supabase audit log count for verification
 */
export async function getAuditLogCount(
  config: MirrorConfig,
  tenantId: string
): Promise<number> {
  try {
    const client = createSupabaseClient(config);

    const { count, error } = await client
      .from("audit_log")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Failed to get audit log count:", error);
    return 0;
  }
}

/**
 * Verify mirror integrity (local count vs Supabase count)
 */
export async function verifyMirrorIntegrity(
  config: MirrorConfig
): Promise<{
  local_count: number;
  remote_count: number;
  delta: number;
  in_sync: boolean;
}> {
  const localCount = readLogTail(1000).length; // Sample size
  const remoteCount = await getAuditLogCount(config, config.tenantId);

  const delta = Math.abs(localCount - remoteCount);
  const inSync = delta <= localCount * 0.1; // Within 10% tolerance

  return {
    local_count: localCount,
    remote_count: remoteCount,
    delta,
    in_sync: inSync,
  };
}
