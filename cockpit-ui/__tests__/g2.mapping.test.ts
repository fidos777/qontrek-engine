import type { G2Response } from "@/types/gates";
import sample from "@/tests/fixtures/g2.summary.json";

describe("G2 mapping contract", () => {
  const s = sample as G2Response;

  it("envelope integrity", () => {
    expect(s.ok).toBe(true);
    expect(s.rel).toBe("g2_dashboard_v19.1.json");
    expect(["real","fallback"]).toContain(s.source);
    expect(s.schemaVersion).toBe("1.0.0");
    expect(s.data).toBeTruthy();
  });

  it("summary & lists present", () => {
    expect(s.data.summary).toBeDefined();
    expect(Array.isArray(s.data.critical_leads)).toBe(true);
    expect(Array.isArray(s.data.active_reminders)).toBe(true);
    expect(Array.isArray(s.data.recent_success)).toBe(true);
  });
});
