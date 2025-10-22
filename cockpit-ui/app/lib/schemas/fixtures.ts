// cockpit-ui/app/lib/schemas/fixtures.ts
import { z } from "zod";

/** Common meta (all fixtures) */
export const MetaV1 = z.object({
  schema_version: z.literal("v1"),
  generated_at: z.string(),         // ISO
  proof_ref: z.string().optional(), // path like "proof/…json"
});

/** 1) G1 Confidence */
export const ConfidenceV1 = MetaV1.extend({
  install_success_rate: z.number(),   // 0..1 or 0..100 ? -> use 0..100 as per tiles
  refund_sla_days: z.number().int().nonnegative(),
});

/** 2) G1 Triggers */
export const TriggerItemV1 = z.object({
  type: z.string(),                   // e.g., "no_reply_48h"
  last_seen_at: z.string(),           // ISO
  severity: z.enum(["ok","warn","pending","fail"]),
});
export const TriggersV1 = MetaV1.extend({
  items: z.array(TriggerItemV1).default([]),
});

/** 3) CFO Forecast (v1: horizon buckets) */
const Horizon = z.enum(["0d","30d","60d","90d"]);
export const ForecastRowV1 = z.object({
  horizon: Horizon,                   // "30d"|"60d"|"90d"
  inflow_rm: z.number(),              // expected inflow for bucket
  proof_ref: z.string().min(1),       // required for lineage
});
export const ForecastV1 = MetaV1.extend({
  series: z.array(ForecastRowV1).min(1),
  milestones: z.array(z.object({ label: z.string(), day: z.number().int() })).optional(),
});

/** 4) Credit Burn */
export const CreditBurnRowV1 = z.object({
  project_id: z.string(),
  credits: z.number().int().nonnegative(),
  rm_value: z.number(),               // monetary value represented by credits/action
  proof_ref: z.string().min(1),       // required for lineage
});
export const CreditBurnV1 = MetaV1.extend({
  rows: z.array(CreditBurnRowV1).default([]),
});

/** 5) Credit Packs */
export const CreditPackRowV1 = z.object({
  tier: z.enum(["A","B","C"]),
  credits_total: z.number().int().nonnegative(),
  credits_used: z.number().int().nonnegative(),
  rm_value: z.number(),
  proof_ref: z.string().min(1),       // required for lineage
});
export const CreditPacksV1 = MetaV1.extend({
  packs: z.array(CreditPackRowV1).default([]),
});

/** 6) Leaderboard */
export const LeaderboardRowV1 = z.object({
  name: z.string(),
  response_quality: z.number(),         // 0..1
  referral_yield: z.number(),           // 0..1
  t_first_reply_min: z.number().int(),  // minutes
  proof_ref: z.string().min(1),         // required for lineage
});
export const LeaderboardV1 = MetaV1.extend({
  rows: z.array(LeaderboardRowV1).default([]),
});

/** 7) Reflex metrics (Learning Lens) */
export const ReflexV1 = MetaV1.extend({
  PLS: z.number(), CFI: z.number(), LGE: z.number(),
  TTE: z.number(),                     // days
  window: z.string().default("7d"),
});

/* ------------------------------------------------------------------ */
/* v0 → v1 adapters (non-throwing). Keep backward compatibility.      */
/* ------------------------------------------------------------------ */

type AnyJson = unknown;

/** Helpers to coerce/guard values */
const num = (v:any, d=0)=> (typeof v === "number" ? v : d);

export function upgradeForecastToV1(v0: AnyJson): z.infer<typeof ForecastV1> | null {
  // Accept either v1 shape or legacy {series:[{day,pipeline_rm,expected_in_rm}], milestones?}
  try {
    const maybeV1 = ForecastV1.safeParse(v0);
    if (maybeV1.success) return maybeV1.data;
  } catch {}
  try {
    const data = v0 as any;
    const series: Array<{day:number; expected_in_rm:number; proof_ref?:string}> = Array.isArray(data?.series) ? data.series : [];
    const mapDayToHorizon = (d:number): z.infer<typeof Horizon> => (d===0?"0d": d===30?"30d": d===60?"60d":"90d");
    const upgraded = {
      schema_version: "v1" as const,
      generated_at: new Date().toISOString(),
      proof_ref: data?.proof_ref,
      milestones: Array.isArray(data?.milestones) ? data.milestones : undefined,
      series: series
        .filter(r => typeof r?.day === "number")
        .map(r => ({
          horizon: mapDayToHorizon(r.day),
          inflow_rm: num(r?.expected_in_rm, 0),
          proof_ref: r?.proof_ref ?? data?.proof_ref ?? "proof/ui_build_v19_9.json"
        })),
    };
    const checked = ForecastV1.parse(upgraded);
    return checked;
  } catch { return null; }
}

export function upgradeLeaderboardToV1(v0: AnyJson) {
  const data = v0 as any;
  const v1 = {
    schema_version: "v1" as const,
    generated_at: new Date().toISOString(),
    rows: Array.isArray(data?.rows) ? data.rows.map((r:any)=>({
      name: r?.name ?? r?.entity ?? "—",
      response_quality: num(r?.response_quality ?? r?.score, 0),
      referral_yield: num(r?.referral_yield, 0),
      t_first_reply_min: Math.round(num(r?.t_first_reply_min, 0)),
      proof_ref: r?.proof_ref ?? data?.proof_ref ?? "proof/ui_build_v19_9.json",
    })) : [],
  };
  return LeaderboardV1.parse(v1);
}

// Similar "safe-coerce" adapters can be added as needed:
export const upgradeTriggersToV1 = (v0: AnyJson) => TriggersV1.parse({
  schema_version: "v1" as const,
  generated_at: new Date().toISOString(),
  items: Array.isArray((v0 as any)?.items ?? (v0 as any)?.triggers)
    ? ((v0 as any).items ?? (v0 as any).triggers)
    : [],
});
export const upgradeConfidenceToV1 = (v0: AnyJson) => ConfidenceV1.parse({
  schema_version: "v1" as const,
  generated_at: new Date().toISOString(),
  install_success_rate: num((v0 as any)?.install_success_rate ?? (v0 as any)?.install_success_pct, 0),
  refund_sla_days: Math.round(num((v0 as any)?.refund_sla_days, 7)),
  proof_ref: (v0 as any)?.proof_ref,
});

export const upgradeCreditBurnToV1 = (v0: AnyJson) => {
  const data = v0 as any;
  return CreditBurnV1.parse({
    schema_version: "v1" as const,
    generated_at: new Date().toISOString(),
    rows: Array.isArray(data?.rows) ? data.rows.map((r:any)=>({
      project_id: String(r?.project_id ?? r?.id ?? "—"),
      credits: Math.round(num(r?.credits, 0)),
      rm_value: num(r?.rm_value, 0),
      proof_ref: r?.proof_ref ?? data?.proof_ref ?? "proof/ui_build_v19_9.json",
    })) : [],
  });
};

export const upgradeCreditPacksToV1 = (v0: AnyJson) => {
  const data = v0 as any;
  return CreditPacksV1.parse({
    schema_version: "v1" as const,
    generated_at: new Date().toISOString(),
    packs: Array.isArray(data?.packs) ? data.packs.map((p:any)=>({
      tier: (["A","B","C"].includes(p?.tier) ? p.tier : "A") as "A"|"B"|"C",
      credits_total: Math.round(num(p?.credits_total ?? p?.credits, 0)),
      credits_used: Math.round(num(p?.credits_used ?? 0)),
      rm_value: num(p?.rm_value, 0),
      proof_ref: p?.proof_ref ?? data?.proof_ref ?? "proof/ui_build_v19_9.json",
    })) : [],
  });
};

/** Export a single v1 contract surface */
export const fixturesV1 = {
  ConfidenceV1, TriggersV1, ForecastV1, CreditBurnV1, CreditPacksV1, LeaderboardV1, ReflexV1,
  upgrade: {
    forecast: upgradeForecastToV1,
    leaderboard: upgradeLeaderboardToV1,
    triggers: upgradeTriggersToV1,
    confidence: upgradeConfidenceToV1,
    credit_burn: upgradeCreditBurnToV1,
    credit_packs: upgradeCreditPacksToV1,
  }
};
