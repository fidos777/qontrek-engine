// app/jobs/tower_sync.ts
// Bi-Directional Tower Event Sync Job
// Polls Tower for new events and merges locally, emits proof.updated triggers

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { verifyEvent, SignedEvent } from "@/lib/security";

const EVENTS_LOG_PATH = join(process.cwd(), "public", "mcp", "events.log.jsonl");
const SYNC_STATE_PATH = join(process.cwd(), "public", "mcp", "sync_state.json");
const TOWER_URL = process.env.TOWER_WEBHOOK_URL || "http://localhost:4000";

interface SyncState {
  last_sync_id?: string;
  last_sync_timestamp: number;
  total_synced: number;
  errors: number;
}

/**
 * Load sync state from disk
 */
function loadSyncState(): SyncState {
  if (!existsSync(SYNC_STATE_PATH)) {
    return {
      last_sync_timestamp: 0,
      total_synced: 0,
      errors: 0,
    };
  }

  try {
    return JSON.parse(readFileSync(SYNC_STATE_PATH, "utf-8"));
  } catch {
    return {
      last_sync_timestamp: 0,
      total_synced: 0,
      errors: 0,
    };
  }
}

/**
 * Save sync state to disk
 */
function saveSyncState(state: SyncState): void {
  writeFileSync(SYNC_STATE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Fetch new events from Tower
 */
async function fetchTowerEvents(since?: string): Promise<SignedEvent[]> {
  try {
    const url = since
      ? `${TOWER_URL}/api/mcp/events?stream=true&since=${since}`
      : `${TOWER_URL}/api/mcp/events?stream=true`;

    const response = await fetch(url, {
      headers: {
        "X-Atlas-Key": process.env.TOWER_SHARED_KEY || "",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error(`Tower sync failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch (error) {
    console.error("Tower fetch error:", error);
    return [];
  }
}

/**
 * Merge remote events into local log
 * Verifies HMAC signatures and deduplicates
 */
function mergeEvents(remoteEvents: SignedEvent[]): number {
  const localEvents = new Set<string>();

  // Load existing local events
  if (existsSync(EVENTS_LOG_PATH)) {
    const lines = readFileSync(EVENTS_LOG_PATH, "utf-8").trim().split("\n");
    for (const line of lines) {
      if (!line) continue;
      try {
        const event = JSON.parse(line);
        localEvents.add(event.signature || event.timestamp);
      } catch {
        continue;
      }
    }
  }

  let merged = 0;

  for (const event of remoteEvents) {
    // Skip if already exists
    const eventKey = (event as any).signature || event.timestamp;
    if (localEvents.has(eventKey)) continue;

    // Verify HMAC signature (optional - trust Tower)
    if ((event as any).signature) {
      const verification = verifyEvent(event as SignedEvent, {
        maxAgeSec: 86400, // 24 hours for batch sync
      });
      if (!verification.valid) {
        console.warn(`Skipping invalid event: ${verification.error}`);
        continue;
      }
    }

    // Append to log
    writeFileSync(EVENTS_LOG_PATH, JSON.stringify(event) + "\n", { flag: "a" });
    merged++;

    // Emit local proof.updated if this is a proof event
    if (event.type === "proof.updated") {
      emitLocalProofUpdate(event.payload);
    }
  }

  return merged;
}

/**
 * Emit local proof.updated event
 * Triggers UI refresh and other local listeners
 */
function emitLocalProofUpdate(payload: Record<string, any>): void {
  try {
    // In real implementation, this would trigger:
    // - WebSocket broadcast
    // - Server-Sent Events
    // - Next.js revalidation
    console.log(`📡 Proof updated from Tower: ${payload.ref}`);

    // Optional: Trigger local MCP event emission
    if (typeof fetch !== "undefined") {
      fetch("http://localhost:3000/api/mcp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "proof.updated.remote",
          ...payload,
          timestamp: Date.now(),
          source: "tower-sync",
        }),
      }).catch(() => {}); // Non-blocking
    }
  } catch (error) {
    console.error("Local proof update emission failed:", error);
  }
}

/**
 * Run Tower sync cycle
 */
export async function runTowerSync(): Promise<{
  success: boolean;
  merged: number;
  errors: number;
}> {
  const state = loadSyncState();

  try {
    console.log("🔄 Starting Tower sync...");

    const remoteEvents = await fetchTowerEvents(state.last_sync_id);

    if (remoteEvents.length === 0) {
      console.log("✅ Tower sync: no new events");
      return { success: true, merged: 0, errors: state.errors };
    }

    const merged = mergeEvents(remoteEvents);

    // Update sync state
    const lastEvent = remoteEvents[remoteEvents.length - 1];
    state.last_sync_id = (lastEvent as any).id || (lastEvent as any).signature;
    state.last_sync_timestamp = Date.now();
    state.total_synced += merged;
    saveSyncState(state);

    console.log(`✅ Tower sync complete: ${merged} events merged`);

    return { success: true, merged, errors: state.errors };
  } catch (error) {
    console.error("Tower sync error:", error);
    state.errors += 1;
    saveSyncState(state);
    return { success: false, merged: 0, errors: state.errors };
  }
}

/**
 * Start periodic Tower sync (60s interval)
 */
export function startTowerSyncJob(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`🚀 Tower sync job started (interval: ${intervalMs}ms)`);

  // Run immediately
  runTowerSync();

  // Then on interval
  return setInterval(() => {
    runTowerSync();
  }, intervalMs);
}

// Export types
export type { SyncState, SignedEvent };
