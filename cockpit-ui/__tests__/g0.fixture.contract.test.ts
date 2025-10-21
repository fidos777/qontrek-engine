import { describe, it, expect } from "vitest";
import type { G0Response } from "@/types/gates";
import data from "@/tests/fixtures/g0.summary.json";

describe("G0 Fixture Contract", () => {
  // Compile-time type check: ensures fixture satisfies G0Response
  const typed = data as unknown as G0Response;

  it("fixture satisfies G0Response type contract", () => {
    expect(typed.ok).toBe(true);
    expect(typed.rel).toBe("g0_dashboard_v19.1.json");
    expect(typed.source).toBe("real");
    expect(typed.schemaVersion).toBe("1.0.0");
  });

  it("fixture has required data structure", () => {
    expect(typed.data).toBeDefined();
    expect(typed.data.summary).toBeDefined();
    expect(Array.isArray(typed.data.activity)).toBe(true);
  });

  it("fixture activity has correct structure", () => {
    expect(typed.data.activity.length).toBeGreaterThan(0);
    const firstActivity = typed.data.activity[0];
    expect(firstActivity).toBeDefined();
  });
});
