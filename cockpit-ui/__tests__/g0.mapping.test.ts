import { describe, it, expect } from "vitest";
import type { G0Response } from "@/types/gates";
import sample from "@/tests/fixtures/g0.summary.json";

describe("G0 mapping contract", () => {
  const s = sample as unknown as G0Response;

  it("envelope integrity", () => {
    expect(s.ok).toBe(true);
    expect(s.rel).toBe("g0_dashboard_v19.1.json");
    expect(["real", "fallback"]).toContain(s.source);
    expect(s.schemaVersion).toBe("1.0.0");
    expect(s.data).toBeTruthy();
  });

  it("summary & activity present", () => {
    expect(s.data.summary).toBeDefined();
    expect(Array.isArray(s.data.activity)).toBe(true);
  });

  it("summary has expected keys", () => {
    expect(s.data.summary.total_leads).toBeDefined();
    expect(s.data.summary.hot_leads).toBeDefined();
    expect(s.data.summary.warm_leads).toBeDefined();
    expect(s.data.summary.cold_leads).toBeDefined();
  });
});
