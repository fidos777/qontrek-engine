// app/jobs/telemetry_sync.ts
// Telemetry Federation - Batch upload to Tower audit API

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { signEvent } from "@/lib/security/signEvent";

const TELEMETRY_LOG_PATH = join(process.cwd(), "public", "mcp", "telemetry.log.jsonl");
const RECEIPTS_PATH = join(process.cwd(), "public", "mcp", "telemetry.receipts.json");
const TOWER_URL = process.env.TOWER_WEBHOOK_URL || "http://localhost:4000";

interface TelemetryReceipt {
  batch_id: string;
  timestamp: number;
  count: number;
  tower_signature: string;
  tower_receipt_id?: string;
}

/**
 * Load telemetry receipts from disk
 */
function loadReceipts(): TelemetryReceipt[] {
  if (!existsSync(RECEIPTS_PATH)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(RECEIPTS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Save telemetry receipt
 */
function saveReceipt(receipt: TelemetryReceipt): void {
  const receipts = loadReceipts();
  receipts.push(receipt);

  // Keep only last 100 receipts
  if (receipts.length > 100) {
    receipts.splice(0, receipts.length - 100);
  }

  writeFileSync(RECEIPTS_PATH, JSON.stringify(receipts, null, 2));
}

/**
 * Read pending telemetry events
 */
function readPendingTelemetry(): any[] {
  if (!existsSync(TELEMETRY_LOG_PATH)) {
    return [];
  }

  try {
    const log = readFileSync(TELEMETRY_LOG_PATH, "utf-8");
    return log
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Upload telemetry batch to Tower
 */
async function uploadToTower(events: any[]): Promise<{
  success: boolean;
  receipt?: TelemetryReceipt;
  error?: string;
}> {
  if (events.length === 0) {
    return { success: true };
  }

  try {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Sign the batch
    const signed = signEvent("telemetry.batch", {
      batch_id: batchId,
      events,
      count: events.length,
    });

    const response = await fetch(`${TOWER_URL}/api/audit/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Atlas-Key": process.env.TOWER_SHARED_KEY || "",
      },
      body: JSON.stringify(signed),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      return {
        success: false,
        error: `tower_upload_failed: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    const receipt: TelemetryReceipt = {
      batch_id: batchId,
      timestamp: Date.now(),
      count: events.length,
      tower_signature: result.signature || signed.signature,
      tower_receipt_id: result.receipt_id,
    };

    saveReceipt(receipt);

    return { success: true, receipt };
  } catch (error) {
    return {
      success: false,
      error: `tower_upload_error: ${String(error)}`,
    };
  }
}

/**
 * Clear processed telemetry events
 */
function clearTelemetryLog(): void {
  if (existsSync(TELEMETRY_LOG_PATH)) {
    writeFileSync(TELEMETRY_LOG_PATH, "");
  }
}

/**
 * Run telemetry sync cycle
 */
export async function runTelemetrySync(): Promise<{
  success: boolean;
  uploaded: number;
  error?: string;
}> {
  try {
    console.log("📊 Starting telemetry sync...");

    const events = readPendingTelemetry();

    if (events.length === 0) {
      console.log("✅ Telemetry sync: no pending events");
      return { success: true, uploaded: 0 };
    }

    const result = await uploadToTower(events);

    if (!result.success) {
      console.error(`❌ Telemetry upload failed: ${result.error}`);
      return { success: false, uploaded: 0, error: result.error };
    }

    // Clear log after successful upload
    clearTelemetryLog();

    console.log(`✅ Telemetry sync complete: ${events.length} events uploaded`);
    console.log(`   Receipt: ${result.receipt?.batch_id}`);

    return { success: true, uploaded: events.length };
  } catch (error) {
    console.error("Telemetry sync error:", error);
    return { success: false, uploaded: 0, error: String(error) };
  }
}

/**
 * Start periodic telemetry sync (60s interval)
 */
export function startTelemetrySyncJob(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`🚀 Telemetry sync job started (interval: ${intervalMs}ms)`);

  // Run immediately
  runTelemetrySync();

  // Then on interval
  return setInterval(() => {
    runTelemetrySync();
  }, intervalMs);
}

// Export types
export type { TelemetryReceipt };
