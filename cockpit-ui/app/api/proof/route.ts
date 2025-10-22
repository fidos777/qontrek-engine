import { NextResponse } from "next/server";
import { join, normalize } from "node:path";
import { readFile } from "node:fs/promises";
import crypto from "crypto";

const MAX_SIZE = 1_000_000; // 1 MB

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") || "";
  const base = join(process.cwd(), "..", "proof");
  const safe = normalize(join(base, ref.replace(/^(\.?\/)+/, "")));
  if (!safe.startsWith(base)) {
    console.warn(`[proof-api] invalid_ref attempted: ${ref}`);
    return NextResponse.json({ error: "invalid_ref" }, { status: 400 });
  }

  try {
    const buf = await readFile(safe);

    // Size limit enforcement
    if (buf.byteLength > MAX_SIZE) {
      console.warn(`[proof-api] file_too_large: ${ref} (${buf.byteLength} bytes)`);
      return NextResponse.json({ error: "file_too_large", max_size: MAX_SIZE }, { status: 413 });
    }

    // ETag generation
    const etag = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    const clientEtag = req.headers.get("if-none-match");

    if (clientEtag === etag) {
      console.log(`[proof-api] 304 cache hit: ${ref}`);
      return new NextResponse(null, { status: 304 });
    }

    const isJson = /\.json$/i.test(ref);
    console.log(`[proof-api] 200 serving: ${ref} (${buf.byteLength} bytes, etag=${etag})`);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
        "ETag": etag,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    console.warn(`[proof-api] not_found: ${ref}`);
    return NextResponse.json({ error: "not_found", ref }, { status: 404 });
  }
}
