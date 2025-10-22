import { NextResponse } from "next/server";
import { join, normalize } from "node:path";
import { readFile } from "node:fs/promises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") || "";
  const base = join(process.cwd(), "..", "proof");
  const safe = normalize(join(base, ref.replace(/^(\.?\/)+/, "")));
  if (!safe.startsWith(base)) return NextResponse.json({ error: "invalid_ref" }, { status: 400 });
  try {
    const buf = await readFile(safe);
    const isJson = /\.json$/i.test(ref);
    return new NextResponse(buf, { status: 200, headers: { "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8" }});
  } catch {
    return NextResponse.json({ error: "not_found", ref }, { status: 404 });
  }
}
