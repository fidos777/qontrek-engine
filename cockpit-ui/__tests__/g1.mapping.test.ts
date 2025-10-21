import { describe, it, expect } from "vitest";
import type { G1Response } from "@/types/gates";
import sample from "@/tests/fixtures/g1.summary.json";

describe("G1 mapping contract", () => {
  const s = sample as unknown as G1Response;

  it("envelope integrity", () => {
    expect(s.ok).toBe(true);
    expect(s.rel).toBe("g1_decision_v19_5.json");
    expect(["real", "fallback"]).toContain(s.source);
    expect(s.schemaVersion).toBe("1.0.0");
    expect(s.data).toBeTruthy();
  });

  it("summary & top_items present", () => {
    expect(s.data.summary).toBeDefined();
    expect(Array.isArray(s.data.top_items)).toBe(true);
  });

  it("summary has expected keys", () => {
    expect(s.data.summary.total_decisions).toBeDefined();
    expect(s.data.summary.approved).toBeDefined();
    expect(s.data.summary.rejected).toBeDefined();
    expect(s.data.summary.pending).toBeDefined();
    expect(s.data.summary.approval_rate).toBeDefined();
  });
});
