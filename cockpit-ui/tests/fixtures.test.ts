import { describe, it, expect } from "vitest";
import {
  ConfidenceSchema,
  TriggerSchema,
  ForecastSchema,
  CreditBurnSchema,
  LeaderboardSchema,
  ReflexMetricsSchema,
} from "@/app/lib/schemas/fixtures";

describe("Fixture Schema Validation", () => {
  describe("ConfidenceSchema", () => {
    it("should validate valid confidence data", () => {
      const valid = {
        install_success_rate: 0.95,
        refund_sla_days: 30,
        proof_ref: "proof/confidence_v1.json",
      };
      const result = ConfidenceSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schema_version).toBe("v1");
        expect(result.data.generated_at).toBeTruthy();
      }
    });

    it("should reject invalid install_success_rate (out of range)", () => {
      const invalid = {
        install_success_rate: 1.5,
        refund_sla_days: 30,
        proof_ref: "proof/confidence_v1.json",
      };
      const result = ConfidenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject negative refund_sla_days", () => {
      const invalid = {
        install_success_rate: 0.95,
        refund_sla_days: -5,
        proof_ref: "proof/confidence_v1.json",
      };
      const result = ConfidenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("TriggerSchema", () => {
    it("should validate valid trigger data", () => {
      const valid = {
        event: "user_signup",
        condition: "email_verified",
        action: "send_welcome_email",
        proof_ref: "proof/trigger_v1.json",
      };
      const result = TriggerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("ForecastSchema", () => {
    it("should validate valid forecast data", () => {
      const valid = {
        period: "2025-Q1",
        predicted_value: 150000,
        confidence_interval: [140000, 160000] as [number, number],
        proof_ref: "proof/forecast_v1.json",
      };
      const result = ForecastSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid confidence_interval (not tuple)", () => {
      const invalid = {
        period: "2025-Q1",
        predicted_value: 150000,
        confidence_interval: [140000],
        proof_ref: "proof/forecast_v1.json",
      };
      const result = ForecastSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CreditBurnSchema", () => {
    it("should validate valid credit burn data", () => {
      const valid = {
        credit_used: 5000,
        credit_remaining: 15000,
        burn_rate_per_day: 250,
        estimated_depletion_date: "2025-03-15",
        proof_ref: "proof/credit_burn_v1.json",
      };
      const result = CreditBurnSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow null estimated_depletion_date", () => {
      const valid = {
        credit_used: 5000,
        credit_remaining: 15000,
        burn_rate_per_day: 250,
        estimated_depletion_date: null,
        proof_ref: "proof/credit_burn_v1.json",
      };
      const result = CreditBurnSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative credit values", () => {
      const invalid = {
        credit_used: -100,
        credit_remaining: 15000,
        burn_rate_per_day: 250,
        estimated_depletion_date: null,
        proof_ref: "proof/credit_burn_v1.json",
      };
      const result = CreditBurnSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("LeaderboardSchema", () => {
    it("should validate valid leaderboard data", () => {
      const valid = {
        rank: 1,
        entity: "Team Alpha",
        score: 9500,
        metric: "total_revenue",
        proof_ref: "proof/leaderboard_v1.json",
      };
      const result = LeaderboardSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject non-positive rank", () => {
      const invalid = {
        rank: 0,
        entity: "Team Alpha",
        score: 9500,
        metric: "total_revenue",
        proof_ref: "proof/leaderboard_v1.json",
      };
      const result = LeaderboardSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("ReflexMetricsSchema", () => {
    it("should validate valid reflex metrics data", () => {
      const valid = {
        response_time_ms: 125,
        success_count: 1500,
        failure_count: 25,
        avg_latency_ms: 87.5,
        proof_ref: "proof/reflex_v1.json",
      };
      const result = ReflexMetricsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative response_time_ms", () => {
      const invalid = {
        response_time_ms: -10,
        success_count: 1500,
        failure_count: 25,
        avg_latency_ms: 87.5,
        proof_ref: "proof/reflex_v1.json",
      };
      const result = ReflexMetricsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer counts", () => {
      const invalid = {
        response_time_ms: 125,
        success_count: 1500.5,
        failure_count: 25,
        avg_latency_ms: 87.5,
        proof_ref: "proof/reflex_v1.json",
      };
      const result = ReflexMetricsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
