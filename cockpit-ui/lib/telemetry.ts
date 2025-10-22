// lib/telemetry.ts
// Telemetry utility for proof tracking and UI events
// Extended for R1.4.2 UI Trust Fabric

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

// Atlas Telemetry Bridge for UI Trust Fabric
export const atlasTelemetry = {
  emit: async (name: string, payload: Record<string, any>) => {
    const atlasKey = process.env.NEXT_PUBLIC_ATLAS_KEY;

    // Skip telemetry in client-side if no key
    if (typeof window !== "undefined" && !atlasKey) {
      console.log("[TELEMETRY]", name, payload);
      return;
    }

    try {
      await fetch("/api/mcp/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(atlasKey && { "x-atlas-key": atlasKey }),
        },
        body: JSON.stringify({
          event: name,
          ...payload,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      // Silent fail for telemetry
      console.error("[TELEMETRY] Error:", error);
    }
  },
};
