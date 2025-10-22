// cockpit-ui/app/components/Telemetry.ts
// Atlas-compatible telemetry with MCP event format

type Meta = Record<string, unknown>;

interface AtlasEvent {
  event: string;
  ref: string;
  route: string;
  source: string;
  timestamp: number;
  lang?: string;
  schema_version?: string;
  etag?: string;
  meta?: Meta;
}

const seen = new Map<string, number>();
const WINDOW_MS = 60_000;

// Detect locale (client-side safe)
function detectLocale(): string {
  if (typeof navigator === "undefined") return "ms-MY";
  const lang = navigator.language || "ms-MY";
  return lang.startsWith("ms") || lang.startsWith("bm") ? "ms-MY" : "en-US";
}

export function logProofLoad(proofRef: string, route: string, meta?: Meta) {
  const key = `${proofRef}:${route}`;
  const now = Date.now();
  if (now - (seen.get(key) || 0) < WINDOW_MS) return;
  seen.set(key, now);

  // Build Atlas-compatible event
  const atlasEvent: AtlasEvent = {
    event: "proof.load",
    ref: proofRef,
    route,
    source: "cockpit-ui",
    timestamp: now,
    lang: detectLocale(),
    schema_version: meta?.schema as string | undefined,
    etag: meta?.etag as string | undefined,
  };

  // If additional meta provided, include it
  if (meta) {
    atlasEvent.meta = meta;
  }

  // Console log in Atlas format
  console.log(`📈 ${JSON.stringify(atlasEvent)}`);

  // Optional: Emit to MCP events endpoint
  if (typeof window !== "undefined" && (window as any).MCP_EVENTS_ENABLED) {
    fetch("/api/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "proof.loaded",
        ref: proofRef,
        route,
        timestamp: now,
        ...meta,
      }),
    }).catch(() => {}); // Non-blocking
  }
}
