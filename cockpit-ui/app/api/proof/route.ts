// cockpit-ui/app/api/proof/route.ts
import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { createHash } from "node:crypto";

const BASE = join(process.cwd(), "..", "proof");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap
const RL = new Map<string, {tokens:number, ts:number}>(); // naive per-IP token bucket
const BUCKET_MAX = 60;            // 60 requests
const REFILL_MS = 60_000;         // per minute
let GLOBAL_COUNT = 0;              // durable fallback counter

// ETag cache for event detection
const ETAG_CACHE = new Map<string, string>();

// Emit MCP event (non-blocking)
async function emitMCPEvent(type: string, payload: Record<string, any>) {
  try {
    const event = { type, ...payload, timestamp: Date.now() };

    // Non-blocking event emission
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/mcp/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {}); // Silently fail

    // Optional: Tower webhook integration
    if (process.env.TOWER_WEBHOOK_URL) {
      fetch(process.env.TOWER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => {}); // Silently fail
    }
  } catch {
    // Non-blocking, ignore errors
  }
}

function ipKey(req: Request) {
  // Next.js in dev: use x-forwarded-for or fallback to remote addr (opaque)
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  return ip || "local";
}
function allowRate(req: Request) {
  const k = ipKey(req);
  const now = Date.now();
  const entry = RL.get(k) || { tokens: BUCKET_MAX, ts: now };
  const refill = Math.floor((now - entry.ts) / REFILL_MS) * BUCKET_MAX;
  entry.tokens = Math.min(BUCKET_MAX, entry.tokens + (refill > 0 ? refill : 0));
  entry.ts = (refill > 0) ? now : entry.ts;

  GLOBAL_COUNT++;
  if (GLOBAL_COUNT > BUCKET_MAX * 10) return false; // global durable limit

  if (entry.tokens <= 0) { RL.set(k, entry); return false; }
  entry.tokens -= 1; RL.set(k, entry); return true;
}

function safePath(ref: string) {
  // Allow ONLY proof/*.json under BASE
  const cleaned = ref.replace(/^(\.?\/)+/, "");
  if (!/\.json$/i.test(cleaned)) return null;
  const path = normalize(join(BASE, cleaned));
  if (!path.startsWith(BASE)) return null;
  return path;
}

async function etagFor(buf: Buffer) {
  const h = createHash("sha256").update(buf).digest("hex"); // full 64 hex
  return `W/"${h}"`;
}

async function headersFor(path: string, etag: string, origin: string) {
  const s = await stat(path);
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(s.size),
    "Cache-Control": "private, max-age=60",
    "ETag": etag,
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
  };
}

async function handle(req: Request, headOnly = false) {
  if (!allowRate(req)) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const ref = url.searchParams.get("ref") || "";

  // Enforce .json MIME type
  if (!/\.json$/i.test(ref)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }

  const path = safePath(ref);
  if (!path) return NextResponse.json({ error: "invalid_ref" }, { status: 400 });

  const s = await stat(path).catch(()=>null);
  if (!s) return NextResponse.json({ error: "not_found", ref }, { status: 404 });
  if (s.size > MAX_BYTES) return NextResponse.json({ error: "too_large", limit: MAX_BYTES }, { status: 413 });

  // Compute ETag from full content (small files). For bigger files, keep as is up to 5MB cap.
  const buf = await readFile(path);
  const etag = await etagFor(buf);

  const inm = req.headers.get("if-none-match");
  if (inm && inm === etag) {
    return new NextResponse(null, { status: 304, headers: await headersFor(path, etag, origin) });
  }

  // Detect ETag changes and emit proof.updated event
  const cachedETag = ETAG_CACHE.get(ref);
  if (cachedETag && cachedETag !== etag) {
    // ETag changed - emit event
    emitMCPEvent("proof.updated", {
      ref,
      etag,
      previous_etag: cachedETag,
    });
  }
  ETAG_CACHE.set(ref, etag);

  const headers = await headersFor(path, etag, origin);
  if (headOnly) {
    return new NextResponse(null, { status: 200, headers });
  }

  // Emit proof.loaded event
  emitMCPEvent("proof.loaded", {
    ref,
    etag,
    method: "GET",
  });

  // Stream response (avoid buffering twice on big files)
  const stream = createReadStream(path);
  return new NextResponse(stream as any, { status: 200, headers });
}

export async function GET(req: Request) {
  return handle(req, false);
}

export async function HEAD(req: Request) {
  return handle(req, true);
}

// Guard unsupported methods
export async function POST() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "GET, HEAD" } });
}
export async function PUT() { return POST(); }
export async function DELETE() { return POST(); }
export async function PATCH() { return POST(); }
