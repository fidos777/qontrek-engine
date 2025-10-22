// cockpit-ui/app/components/Telemetry.ts
// Keep existing throttle-by (proofRef:route), add optional meta passthrough.
type Meta = Record<string, unknown>;

const seen = new Map<string, number>();
const WINDOW_MS = 60_000;

export function logProofLoad(proofRef: string, route: string, meta?: Meta) {
  const key = `${proofRef}:${route}`;
  const now = Date.now();
  if (now - (seen.get(key) || 0) < WINDOW_MS) return;
  seen.set(key, now);
  // If your /api/proof returns ETag/x-forwarded-for and the caller provides them, pass here:
  const suffix = meta ? ` meta=${JSON.stringify(meta)}` : "";
  // Throttled console log (Tower can scrape dev logs if needed)
  console.log(`📈 logProofLoad(ref=${proofRef}, route=${route})${suffix}`);
}
