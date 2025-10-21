import { describe, it, expect } from "vitest";
import type { G1Response } from "@/types/gates";
import data from "@/tests/fixtures/g1.summary.json";

describe("G1 Fixture Contract", () => {
  // Compile-time type check: ensures fixture satisfies G1Response
  const typed = data as unknown as G1Response;

  it("fixture satisfies G1Response type contract", () => {
    expect(typed.ok).toBe(true);
    expect(typed.rel).toBe("g1_decision_v19_5.json");
    expect(typed.source).toBe("real");
    expect(typed.schemaVersion).toBe("1.0.0");
  });

  it("fixture has required data structure", () => {
    expect(typed.data).toBeDefined();
    expect(typed.data.summary).toBeDefined();
    expect(Array.isArray(typed.data.top_items)).toBe(true);
  });

  it("fixture has decision metrics", () => {
    expect(typed.data.summary.total_decisions).toBe(2847);
    expect(typed.data.summary.approval_rate).toBeGreaterThan(0);
    expect(typed.data.top_items.length).toBeGreaterThan(0);
  });
});
