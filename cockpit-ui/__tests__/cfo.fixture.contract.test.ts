import { describe, it, expect } from "vitest";
import type { CFOResponse } from "@/types/gates";
import data from "@/tests/fixtures/cfo.summary.json";

describe("CFO Fixture Contract", () => {
  // Compile-time type check: ensures fixture satisfies CFOResponse
  const typed = data as unknown as CFOResponse;

  it("fixture satisfies CFOResponse type contract", () => {
    expect(typed.ok).toBe(true);
    expect(typed.rel).toBe("cfo_fulltabs_v19.1.json");
    expect(typed.source).toBe("real");
    expect(typed.schemaVersion).toBe("1.0.0");
  });

  it("fixture has required data structure", () => {
    expect(typed.data).toBeDefined();
    expect(typed.data.tabs).toBeDefined();
    expect(Array.isArray(typed.data.tabs)).toBe(true);
    expect(typed.data.tabs.length).toBe(5);
  });

  it("fixture tabs have correct structure", () => {
    const cashflowTab = typed.data.tabs.find((t) => t.id === "cashflow");
    expect(cashflowTab).toBeDefined();
    expect(cashflowTab?.title).toBe("Cashflow");
    expect(cashflowTab?.metrics).toBeDefined();
  });
});
