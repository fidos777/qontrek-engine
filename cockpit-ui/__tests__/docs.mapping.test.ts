import { describe, it, expect } from "vitest";
import s from "@/tests/fixtures/docs.summary.json";

describe("Docs Summary - Mapping Contract", () => {
  it("envelope integrity", () => {
    expect(s.ok).toBe(true);
    expect(s.rel).toBe("docs_tracker_v19_6.json");
    expect(s.source).toBe("fallback");
    expect(s.schemaVersion).toBe("1.0.0");
  });

  it("data structure", () => {
    expect(s.data).toBeDefined();
    expect(s.data.items).toBeDefined();
    expect(Array.isArray(s.data.items)).toBe(true);
  });

  it("extended properties", () => {
    const raw = s.data as any;
    expect(raw.total_proofs).toBeDefined();
    expect(raw.sealed).toBeDefined();
    expect(raw.unsealed).toBeDefined();
    expect(raw.lineage).toBeDefined();
    expect(Array.isArray(raw.lineage)).toBe(true);
    expect(raw.integrity).toBeDefined();
    expect(raw.timeline).toBeDefined();
    expect(Array.isArray(raw.timeline)).toBe(true);
  });
});
