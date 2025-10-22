// app/lib/loaders/proof.ts
// Centralized proof loaders with resilient error handling, timeout guard, and telemetry
import { fixturesV1 } from "@/app/lib/schemas/fixtures";
import { z } from "zod";

type AnyJson = unknown;

interface LoadResult<T> {
  __error?: string;
  data?: T;
}

async function loadProof<T>(
  ref: string,
  parse: (data: any) => T,
  upgrade: (v0: AnyJson) => T | null
): Promise<T | LoadResult<T>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`/api/proof?ref=${encodeURIComponent(ref)}`, {
      cache: "no-store",
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error(`proof_fetch_${r.status}`);

    const etag = r.headers.get("etag") ?? undefined;
    const raw = await r.json();
    const v1 = "schema_version" in raw ? raw : upgrade(raw);
    const data = parse(v1);

    // Telemetry handoff (non-blocking)
    queueMicrotask(() => {
      if (typeof window !== "undefined" && (window as any).logProofLoad) {
        (window as any).logProofLoad(ref, location.pathname, { etag, schema: (v1 as any).schema_version });
      }
    });

    return data;
  } catch (e) {
    return { __error: String(e) };
  } finally {
    clearTimeout(t);
  }
}

export const loadForecast = () =>
  loadProof("cfo_forecast.json", fixturesV1.ForecastV1.parse, fixturesV1.upgrade.forecast);

export const loadCreditBurn = () =>
  loadProof("credit_burn.json", fixturesV1.CreditBurnV1.parse, fixturesV1.upgrade.credit_burn);

export const loadCreditPacks = () =>
  loadProof("credit_packs.json", fixturesV1.CreditPacksV1.parse, fixturesV1.upgrade.credit_packs);

export const loadLeaderboard = () =>
  loadProof("leaderboard.json", fixturesV1.LeaderboardV1.parse, fixturesV1.upgrade.leaderboard);

export const loadReflex = () =>
  loadProof("reflex_metrics.json", fixturesV1.ReflexV1.parse, (v) => v as z.infer<typeof fixturesV1.ReflexV1>);

export const loadConfidence = () =>
  loadProof("g1_confidence.json", fixturesV1.ConfidenceV1.parse, fixturesV1.upgrade.confidence);

export const loadTriggers = () =>
  loadProof("g1_triggers.json", fixturesV1.TriggersV1.parse, fixturesV1.upgrade.triggers);
