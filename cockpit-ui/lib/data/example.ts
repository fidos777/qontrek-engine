/**
 * Example usage of Voltek data model and store
 * Session 1A - Data model & store
 *
 * This file demonstrates:
 * 1. Creating and validating datasets
 * 2. Using the store to compute metrics
 * 3. Subscribing to changes
 * 4. Listening to proof.updated events
 */

import { setSnapshot, getSnapshot, subscribe } from "../state/voltekStore";
import { safeParseDataset } from "./schemas";
import type { VoltekDataset } from "./types";

// ============================================================================
// Example Dataset
// ============================================================================

/**
 * Create a mock dataset for testing
 */
export function createMockDataset(): VoltekDataset {
  return {
    version: "1.0.0",
    imported_at: new Date().toISOString(),
    source: "manual",
    leads: [
      {
        id: "lead-001",
        name: "Acme Corp",
        email: "contact@acme.com",
        phone: "+1-555-0100",
        status: "qualified",
        source: "website",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-15T14:30:00Z",
      },
      {
        id: "lead-002",
        name: "TechStart Inc",
        email: "info@techstart.io",
        status: "converted",
        source: "referral",
        created_at: "2025-09-15T09:00:00Z",
        updated_at: "2025-10-20T16:45:00Z",
      },
      {
        id: "lead-003",
        name: "Global Solutions",
        email: "hello@globalsol.com",
        status: "new",
        source: "campaign",
        created_at: "2025-10-25T08:00:00Z",
        updated_at: "2025-10-25T08:00:00Z",
      },
    ],
    projects: [
      {
        id: "proj-001",
        name: "Enterprise Platform Migration",
        description: "Migrate legacy systems to cloud infrastructure",
        status: "active",
        lead_id: "lead-002",
        start_date: "2025-10-01T00:00:00Z",
        budget: 150000,
        revenue: 125000,
        success_rate: 85,
        recovery_rate_7d: 92,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-25T00:00:00Z",
      },
      {
        id: "proj-002",
        name: "API Integration Suite",
        description: "Build REST API integration layer",
        status: "active",
        lead_id: "lead-001",
        start_date: "2025-10-15T00:00:00Z",
        budget: 75000,
        revenue: 60000,
        success_rate: 78,
        recovery_rate_7d: 88,
        created_at: "2025-10-15T00:00:00Z",
        updated_at: "2025-10-24T00:00:00Z",
      },
      {
        id: "proj-003",
        name: "Mobile App Development",
        status: "completed",
        start_date: "2025-08-01T00:00:00Z",
        end_date: "2025-09-30T00:00:00Z",
        budget: 100000,
        revenue: 110000,
        success_rate: 95,
        recovery_rate_7d: 98,
        created_at: "2025-08-01T00:00:00Z",
        updated_at: "2025-09-30T00:00:00Z",
      },
    ],
  };
}

// ============================================================================
// Example Usage Functions
// ============================================================================

/**
 * Example 1: Validate and load a dataset
 */
export async function example1_ValidateAndLoad() {
  console.log("=== Example 1: Validate and Load Dataset ===");

  const mockData = createMockDataset();

  // Validate the dataset
  const validationResult = safeParseDataset(mockData);

  if (!validationResult.ok) {
    console.error("Validation failed:", validationResult.issues);
    return;
  }

  console.log("✓ Dataset validated successfully");

  // Load into store
  await setSnapshot(validationResult.data!, "manual");
  console.log("✓ Dataset loaded into store");

  // Get computed snapshot
  const snapshot = getSnapshot();
  if (snapshot) {
    console.log("Computed metrics:", {
      total_leads: snapshot.summary.total_leads,
      total_projects: snapshot.summary.total_projects,
      success_rate: snapshot.summary.success_rate.toFixed(2) + "%",
      trust_index: snapshot.summary.trust_index.toFixed(2),
      governance_score: snapshot.governance.score,
      hash: snapshot.hash.slice(0, 8) + "...",
    });
  }
}

/**
 * Example 2: Subscribe to changes
 */
export function example2_SubscribeToChanges() {
  console.log("\n=== Example 2: Subscribe to Changes ===");

  const unsubscribe = subscribe((snapshot) => {
    console.log("Snapshot updated:", {
      source: snapshot.source,
      freshness: snapshot.freshness + " minutes",
      projects: snapshot.totals.projects,
      computed_at: snapshot.computed_at,
    });
  });

  console.log("✓ Subscribed to snapshot changes");

  // Return unsubscribe function for cleanup
  return unsubscribe;
}

/**
 * Example 3: Listen to proof.updated events
 */
export function example3_ListenToProofEvents() {
  console.log("\n=== Example 3: Listen to Proof Events ===");

  if (typeof window !== "undefined") {
    window.addEventListener("proof.updated", ((event: CustomEvent) => {
      console.log("Proof updated event received:", {
        freshness: event.detail.freshness,
        source: event.detail.source,
        hash: event.detail.hash.slice(0, 8) + "...",
        timestamp: event.detail.timestamp,
      });
    }) as EventListener);

    console.log("✓ Listening for proof.updated events");
  } else {
    console.log("⚠ Window not available (Node.js environment)");
  }
}

/**
 * Run all examples
 */
export async function runExamples() {
  console.log("🚀 Voltek Data Model & Store Examples\n");

  // Example 1: Validate and load
  await example1_ValidateAndLoad();

  // Example 2: Subscribe to changes
  const unsubscribe = example2_SubscribeToChanges();

  // Example 3: Listen to proof events
  example3_ListenToProofEvents();

  // Trigger another update to show subscription and events
  console.log("\n=== Triggering Another Update ===");
  const newMockData = createMockDataset();
  newMockData.version = "1.0.1";
  await setSnapshot(newMockData, "import");

  // Cleanup
  setTimeout(() => {
    console.log("\n=== Cleanup ===");
    unsubscribe();
    console.log("✓ Unsubscribed");
  }, 1000);
}
