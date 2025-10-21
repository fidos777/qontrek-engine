import { describe, it, expect } from "vitest";
import type { DocsResponse } from "@/types/gates";
import s from "@/tests/fixtures/docs.summary.json";

describe("Docs Summary - Fixture Contract", () => {
  it("fixture validates as DocsResponse", () => {
    const typed = s as unknown as DocsResponse;
    expect(typed.ok).toBe(true);
    expect(typed.data).toBeDefined();
  });

  it("data.items is array", () => {
    const typed = s as unknown as DocsResponse;
    expect(Array.isArray(typed.data.items)).toBe(true);
  });

  it("extended lineage data validates", () => {
    const raw = s.data as any;
    expect(typeof raw.total_proofs).toBe("number");
    expect(typeof raw.sealed).toBe("number");
    expect(typeof raw.unsealed).toBe("number");
    expect(raw.lineage.length).toBeGreaterThan(0);

    // Validate lineage item structure
    const firstItem = raw.lineage[0];
    expect(firstItem.gate).toBeDefined();
    expect(firstItem.phase).toBeDefined();
    expect(firstItem.proof).toBeDefined();
    expect(firstItem.status).toBeDefined();
  });
});
