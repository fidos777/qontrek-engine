import { describe, it, expect } from "vitest";
import type { G2Response } from "@/types/gates";
import data from "@/tests/fixtures/g2.summary.json";

describe("G2 Fixture Contract", () => {
  // Compile-time type check: ensures fixture satisfies G2Response
  const typed = data as G2Response;

  it("fixture satisfies G2Response type contract", () => {
    expect(typed.ok).toBe(true);
    expect(typed.rel).toBe("g2_dashboard_v19.1.json");
    expect(typed.source).toBe("real");
    expect(typed.schemaVersion).toBe("1.0.0");
  });

  it("fixture has required data structure", () => {
    expect(typed.data).toBeDefined();
    expect(typed.data.summary).toBeDefined();
    expect(typed.data.summary.total_recoverable).toBe(152500);
  });
});
