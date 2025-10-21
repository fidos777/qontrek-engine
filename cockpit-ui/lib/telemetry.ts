// lib/telemetry.ts
// ⚠️ FROZEN - DO NOT MODIFY
// This file contains the telemetry utility for proof load tracking.
// Changes must be approved by Commander (GPT-5).

export function logProofLoad(
  rel: string,
  source: "real" | "fallback"
): void {
  const timestamp = new Date().toISOString();
  const entry = {
    event: "proof_load",
    rel,
    source,
    timestamp,
  };

  console.log("[TELEMETRY]", JSON.stringify(entry));

  // In production, this would write to proof/logs/trace.jsonl
  // For now, console logging is sufficient
}
