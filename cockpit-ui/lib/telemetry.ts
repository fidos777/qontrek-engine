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
// Client-side safe: No secrets exposed, server handles authentication
export const atlasTelemetry = {
  emit: async (name: string, payload: Record<string, any>) => {
    // Client-side telemetry - no authentication headers
    // Server-side middleware handles key validation
    try {
      await fetch("/api/mcp/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: name,
          ...payload,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      // Silent fail for telemetry - never break UI
      if (typeof window !== "undefined") {
        console.log("[TELEMETRY]", name, payload);
      }
    }
  },
};
