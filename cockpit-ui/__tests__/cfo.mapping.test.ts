import { describe, it, expect } from "vitest";
import type { CFOResponse } from "@/types/gates";
import sample from "@/tests/fixtures/cfo.summary.json";

describe("CFO mapping contract", () => {
  const s = sample as unknown as CFOResponse;

  it("envelope integrity", () => {
    expect(s.ok).toBe(true);
    expect(s.rel).toBe("cfo_fulltabs_v19.1.json");
    expect(["real", "fallback"]).toContain(s.source);
    expect(s.schemaVersion).toBe("1.0.0");
    expect(s.data).toBeTruthy();
  });

  it("tabs structure present", () => {
    expect(Array.isArray(s.data.tabs)).toBe(true);
    expect(s.data.tabs.length).toBeGreaterThan(0);

    // Verify each tab has required fields
    s.data.tabs.forEach((tab) => {
      expect(tab.id).toBeDefined();
      expect(tab.title).toBeDefined();
      expect(tab.metrics).toBeDefined();
      expect(typeof tab.metrics).toBe("object");
    });
  });

  it("expected tabs present", () => {
    const tabIds = s.data.tabs.map((t) => t.id);
    expect(tabIds).toContain("cashflow");
    expect(tabIds).toContain("recovery");
    expect(tabIds).toContain("margin");
    expect(tabIds).toContain("forecast");
    expect(tabIds).toContain("variance");
  });
});
