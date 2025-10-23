// __tests__/import-modal.test.tsx
// Tests for Import Data Modal functionality

import { describe, it, expect, beforeEach } from "vitest";
import { proofStore } from "@/lib/proofStore";
import {
  detectVoltekColumns,
  applyColumnMapping,
  buildG2Fixture,
} from "@/lib/import/voltekProfile";
import { validateAllRows, VoltekLeadSchema } from "@/lib/import/validators";
import { maskName, maskPhone, computeScore } from "@/lib/import/types";
import type { ParsedData, ColumnMapping } from "@/lib/import/types";

describe("Import Modal - Column Mapping", () => {
  it("should auto-detect Voltek columns from headers", () => {
    const headers = [
      "client_name",
      "payment_stage",
      "outstanding",
      "overdue_days",
      "last_contact_date",
    ];

    const mappings = detectVoltekColumns(headers);

    expect(mappings).toContainEqual({ source: "client_name", target: "name" });
    expect(mappings).toContainEqual({ source: "payment_stage", target: "stage" });
    expect(mappings).toContainEqual({ source: "outstanding", target: "amount" });
    expect(mappings).toContainEqual({
      source: "overdue_days",
      target: "days_overdue",
    });
  });

  it("should apply column mappings to data rows", () => {
    const data: ParsedData = {
      rows: [
        {
          client_name: "John Doe",
          payment_stage: "80%",
          outstanding: "15000",
          overdue_days: "45",
        },
      ],
      columns: ["client_name", "payment_stage", "outstanding", "overdue_days"],
      profile: "voltek_v19_9",
    };

    const mappings: ColumnMapping[] = [
      { source: "client_name", target: "name" },
      { source: "payment_stage", target: "stage" },
      { source: "outstanding", target: "amount" },
      { source: "overdue_days", target: "days_overdue" },
    ];

    const result = applyColumnMapping(data, mappings);

    expect(result[0]).toEqual({
      name: "John Doe",
      stage: "80%",
      amount: 15000,
      days_overdue: 45,
    });
  });

  it("should handle unmapped columns gracefully", () => {
    const data: ParsedData = {
      rows: [{ name: "Test", unknown_col: "value" }],
      columns: ["name", "unknown_col"],
      profile: "voltek_v19_9",
    };

    const mappings: ColumnMapping[] = [{ source: "name", target: "name" }];

    const result = applyColumnMapping(data, mappings);

    expect(result[0]).toHaveProperty("name", "Test");
    expect(result[0]).toHaveProperty("unknown_col", "value");
  });
});

describe("Import Modal - Validation", () => {
  it("should validate rows against schema", () => {
    const validRow = {
      name: "John Doe",
      stage: "80%",
      amount: 15000,
      days_overdue: 45,
    };

    const errors = validateAllRows([validRow], VoltekLeadSchema);

    expect(errors).toHaveLength(0);
  });

  it("should detect missing required fields", () => {
    const invalidRow = {
      name: "",
      stage: "80%",
      amount: 15000,
    };

    const errors = validateAllRows([invalidRow], VoltekLeadSchema);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Name is required");
  });

  it("should detect invalid amount values", () => {
    const invalidRow = {
      name: "John Doe",
      stage: "80%",
      amount: -100,
    };

    const errors = validateAllRows([invalidRow], VoltekLeadSchema);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("positive");
  });

  it("should report row number in errors (1-indexed)", () => {
    const rows = [
      { name: "Valid", stage: "80%", amount: 100 },
      { name: "", stage: "20%", amount: 200 }, // Invalid
    ];

    const errors = validateAllRows(rows, VoltekLeadSchema);

    expect(errors[0].row).toBe(2); // 1-indexed
  });
});

describe("Import Modal - Preview Masking (Safe-Mode)", () => {
  it("should mask names in Safe-Mode", () => {
    const name = "John Doe";
    const masked = maskName(name);

    expect(masked).toBe("J. D.");
  });

  it("should mask phone numbers in Safe-Mode", () => {
    const phone = "60123456789";
    const masked = maskPhone(phone);

    expect(masked).toBe("60•• ••89");
  });

  it("should preserve unmasked data when Safe-Mode is off", () => {
    const fixture = buildG2Fixture([
      {
        name: "John Doe",
        stage: "80%",
        amount: 15000,
        days_overdue: 45,
      },
    ]);

    expect(fixture.critical_leads[0].name).toBe("John Doe");
  });
});

describe("Import Modal - Seal & Apply", () => {
  beforeEach(() => {
    proofStore.clearFixture();
  });

  it("should build G2Fixture from mapped rows", () => {
    const rows = [
      {
        name: "Critical Lead",
        stage: "80%",
        amount: 15000,
        days_overdue: 45,
        next_action: "Call customer",
      },
      {
        name: "Success Case",
        stage: "Paid",
        amount: 12000,
        paid_at: "2025-10-18",
        days_to_pay: 25,
      },
    ];

    const fixture = buildG2Fixture(rows);

    expect(fixture.summary.total_recoverable).toBeGreaterThan(0);
    expect(fixture.critical_leads.length).toBeGreaterThan(0);
    expect(fixture.recent_success.length).toBeGreaterThan(0);
  });

  it("should update proofStore when sealing fixture", () => {
    const fixture = buildG2Fixture([
      {
        name: "Test Lead",
        stage: "80%",
        amount: 10000,
        days_overdue: 30,
      },
    ]);

    proofStore.setFixture(fixture, { mode: "demo" });

    const state = proofStore.getState();

    expect(state.fixture).not.toBeNull();
    expect(state.signals.etag).toBeDefined();
    expect(state.signals.schema_pass).toBe(true);
    expect(state.signals.freshness_ms).toBe(0);
    expect(state.signals.mode).toBe("demo");
  });

  it("should compute signals and score after seal", () => {
    const fixture = buildG2Fixture([
      {
        name: "Test",
        stage: "80%",
        amount: 5000,
      },
    ]);

    proofStore.setFixture(fixture, { mode: "demo" });

    const state = proofStore.getState();

    expect(state.score).toBeGreaterThan(0);
    expect(state.score).toBeLessThanOrEqual(100);
  });

  it("should emit proof.updated event", () => {
    return new Promise<void>((done) => {
      const fixture = buildG2Fixture([
        {
          name: "Event Test",
          stage: "20%",
          amount: 3000,
        },
      ]);

      const unsubscribe = proofStore.subscribe((state) => {
        expect(state.fixture).not.toBeNull();
        expect(state.lastUpdated).not.toBeNull();
        unsubscribe();
        done();
      });

      proofStore.setFixture(fixture);
    });
  });

  it("should recompute freshness over time", async () => {
    const fixture = buildG2Fixture([
      {
        name: "Freshness Test",
        stage: "80%",
        amount: 1000,
      },
    ]);

    proofStore.setFixture(fixture);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    proofStore.recomputeFreshness();

    const state = proofStore.getState();

    expect(state.signals.freshness_ms).toBeGreaterThan(0);
  });
});

describe("Import Modal - Signal Computation", () => {
  it("should compute score correctly with all signals", () => {
    const signals = {
      etag: "test-etag",
      ack_age_ms: 30000, // 30s
      schema_pass: true,
      freshness_ms: 5000, // 5s
      mode: "live" as const,
    };

    const score = computeScore(signals);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should give higher score to fresh data", () => {
    const freshSignals = {
      etag: "test",
      ack_age_ms: 1000,
      schema_pass: true,
      freshness_ms: 1000,
    };

    const staleSignals = {
      etag: "test",
      ack_age_ms: 50000,
      schema_pass: true,
      freshness_ms: 50000,
    };

    const freshScore = computeScore(freshSignals);
    const staleScore = computeScore(staleSignals);

    expect(freshScore).toBeGreaterThan(staleScore);
  });

  it("should penalize missing etag", () => {
    const withEtag = {
      etag: "test",
      schema_pass: true,
      freshness_ms: 0,
    };

    const withoutEtag = {
      schema_pass: true,
      freshness_ms: 0,
    };

    const scoreWithEtag = computeScore(withEtag);
    const scoreWithoutEtag = computeScore(withoutEtag);

    expect(scoreWithEtag).toBeGreaterThan(scoreWithoutEtag);
  });

  it("should fail validation when schema_pass is false", () => {
    const signals = {
      etag: "test",
      schema_pass: false,
      freshness_ms: 0,
    };

    const score = computeScore(signals);

    // Score should be lower due to schema_pass: false (0 * 0.2 weight)
    expect(score).toBeLessThan(100);
  });
});

describe("Import Modal - G2Fixture Building", () => {
  it("should categorize leads correctly", () => {
    const rows = [
      {
        name: "Critical 1",
        stage: "80%",
        amount: 10000,
        days_overdue: 35,
      },
      {
        name: "Recent Success",
        stage: "Paid",
        amount: 5000,
        paid_at: "2025-10-20",
        days_to_pay: 15,
      },
      {
        name: "Reminder",
        stage: "20%",
        amount: 3000,
        next_action: "Email follow-up",
      },
    ];

    const fixture = buildG2Fixture(rows);

    expect(fixture.critical_leads.length).toBeGreaterThan(0);
    expect(fixture.recent_success.length).toBeGreaterThan(0);
    expect(fixture.active_reminders?.length).toBeGreaterThan(0);
  });

  it("should calculate KPIs correctly", () => {
    const rows = [
      {
        name: "Success 1",
        stage: "Paid",
        amount: 10000,
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        days_to_pay: 20,
      },
      {
        name: "Pending",
        stage: "80%",
        amount: 5000,
      },
    ];

    const fixture = buildG2Fixture(rows);

    expect(fixture.kpi.recovery_rate_7d).toBeGreaterThan(0);
    expect(fixture.kpi.average_days_to_payment).toBe(20);
    expect(fixture.summary.total_recoverable).toBe(5000); // Only pending
  });

  it("should calculate summary values", () => {
    const rows = [
      {
        name: "80% Case",
        stage: "80% - Final",
        amount: 10000,
      },
      {
        name: "20% Case",
        stage: "20% - Initial",
        amount: 5000,
      },
      {
        name: "Handover",
        stage: "handover",
        amount: 3000,
      },
    ];

    const fixture = buildG2Fixture(rows);

    expect(fixture.summary.pending_80_value).toBe(10000);
    expect(fixture.summary.pending_20_value).toBe(5000);
    expect(fixture.summary.pending_handover_value).toBe(3000);
    expect(fixture.summary.total_recoverable).toBe(18000);
  });
});
