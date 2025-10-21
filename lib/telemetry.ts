// lib/telemetry.ts (USE THIS - Don't modify)

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
