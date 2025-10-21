export function logProofLoad(rel: string, source: "real" | "fallback") {
  if (typeof window !== "undefined") {
    console.info("[telemetry] proof_load", { rel, source, ts: new Date().toISOString() });
  }
}
