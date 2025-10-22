import { describe, it, expect } from "vitest";
import { fixturesV1 } from "@/app/lib/schemas/fixtures";

describe("Fixture v1 Schema Validation", () => {
  describe("ConfidenceV1", () => {
    it("should validate valid confidence data", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        install_success_rate: 95,
        refund_sla_days: 7,
        proof_ref: "proof/confidence_v1.json",
      };
      const result = fixturesV1.ConfidenceV1.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative refund_sla_days", () => {
      const invalid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        install_success_rate: 95,
        refund_sla_days: -5,
      };
      const result = fixturesV1.ConfidenceV1.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("TriggersV1", () => {
    it("should validate valid triggers data", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        items: [
          { type: "no_reply_48h", last_seen_at: "2025-10-22T10:00:00Z", severity: "warn" as const },
        ],
      };
      const result = fixturesV1.TriggersV1.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("ForecastV1", () => {
    it("should validate valid forecast data with required proof_ref", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        series: [
          { horizon: "30d" as const, inflow_rm: 120000, proof_ref: "proof/cfo_forecast_v1.json" },
          { horizon: "60d" as const, inflow_rm: 240000, proof_ref: "proof/cfo_forecast_v1.json" },
        ],
      };
      const result = fixturesV1.ForecastV1.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should require proof_ref on all series entries", () => {
      const invalid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        series: [
          { horizon: "30d" as const, inflow_rm: 120000 }, // missing proof_ref
        ],
      };
      const result = fixturesV1.ForecastV1.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should require at least one series entry", () => {
      const invalid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        series: [],
      };
      const result = fixturesV1.ForecastV1.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CreditBurnV1", () => {
    it("should validate valid credit burn data with required proof_ref", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        rows: [
          { project_id: "proj-123", credits: 1000, rm_value: 5000, proof_ref: "proof/credit_burn_v1.json" },
        ],
      };
      const result = fixturesV1.CreditBurnV1.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative credits", () => {
      const invalid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        rows: [
          { project_id: "proj-123", credits: -100, rm_value: 5000 },
        ],
      };
      const result = fixturesV1.CreditBurnV1.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("LeaderboardV1", () => {
    it("should validate valid leaderboard data with required proof_ref", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        rows: [
          { name: "Aqil", response_quality: 0.9, referral_yield: 0.4, t_first_reply_min: 12, proof_ref: "proof/leaderboard_v1.json" },
        ],
      };
      const result = fixturesV1.LeaderboardV1.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should require proof_ref on all rows", () => {
      const invalid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        rows: [
          { name: "Aqil", response_quality: 0.9, referral_yield: 0.4, t_first_reply_min: 12 }, // missing proof_ref
        ],
      };
      const result = fixturesV1.LeaderboardV1.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("ReflexV1", () => {
    it("should validate valid reflex metrics data", () => {
      const valid = {
        schema_version: "v1" as const,
        generated_at: new Date().toISOString(),
        PLS: 0.85,
        CFI: 0.92,
        LGE: 0.78,
        TTE: 14,
        window: "7d",
      };
      const result = fixturesV1.ReflexV1.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});

describe("Fixture v0→v1 Adapters", () => {
  it("upgrades forecast v0 to v1", () => {
    const v0 = { series: [{ day: 30, expected_in_rm: 120000 }] };
    const upgraded = fixturesV1.upgrade.forecast(v0);
    expect(upgraded?.series?.[0]?.horizon).toBe("30d");
    expect(upgraded?.series?.[0]?.inflow_rm).toBe(120000);
    expect(upgraded?.schema_version).toBe("v1");
    expect(upgraded?.generated_at).toBeTruthy();
  });

  it("leaderboard v0 maps entity/score → name/response_quality", () => {
    const v0 = { rows: [{ entity: "Aqil", score: 0.9, t_first_reply_min: 12, referral_yield: 0.4 }] };
    const v1 = fixturesV1.upgrade.leaderboard(v0);
    expect(v1.rows[0].name).toBe("Aqil");
    expect(v1.rows[0].response_quality).toBe(0.9);
    expect(v1.rows[0].referral_yield).toBe(0.4);
    expect(v1.rows[0].t_first_reply_min).toBe(12);
    expect(v1.schema_version).toBe("v1");
  });

  it("confidence v0 → v1 with fallback defaults", () => {
    const v0 = { install_success_pct: 95, refund_sla_days: 7 };
    const v1 = fixturesV1.upgrade.confidence(v0);
    expect(v1.install_success_rate).toBe(95);
    expect(v1.refund_sla_days).toBe(7);
    expect(v1.schema_version).toBe("v1");
  });

  it("triggers v0 → v1 with items array", () => {
    const v0 = { triggers: [{ type: "no_reply_48h", last_seen_at: "2025-10-22T10:00:00Z", severity: "warn" }] };
    const v1 = fixturesV1.upgrade.triggers(v0);
    expect(v1.items.length).toBe(1);
    expect(v1.items[0].type).toBe("no_reply_48h");
    expect(v1.items[0].severity).toBe("warn");
    expect(v1.schema_version).toBe("v1");
  });

  it("credit_burn v0 → v1 with project_id mapping", () => {
    const v0 = { rows: [{ id: "proj-123", credits: 1000, rm_value: 5000 }] };
    const v1 = fixturesV1.upgrade.credit_burn(v0);
    expect(v1.rows[0].project_id).toBe("proj-123");
    expect(v1.rows[0].credits).toBe(1000);
    expect(v1.rows[0].rm_value).toBe(5000);
    expect(v1.schema_version).toBe("v1");
  });

  it("credit_packs v0 → v1 with tier coercion", () => {
    const v0 = { packs: [{ tier: "A", credits: 5000, credits_used: 1200, rm_value: 25000 }] };
    const v1 = fixturesV1.upgrade.credit_packs(v0);
    expect(v1.packs[0].tier).toBe("A");
    expect(v1.packs[0].credits_total).toBe(5000);
    expect(v1.packs[0].credits_used).toBe(1200);
    expect(v1.packs[0].rm_value).toBe(25000);
    expect(v1.schema_version).toBe("v1");
  });
});
