import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const ENV_DIR = process.env.PROOF_REAL_DIR;
const FALLBACK_ROOT = path.join(process.cwd(), "proof");

async function readJson(relPath: string) {
  if (ENV_DIR) {
    try {
      const p = path.join(ENV_DIR, relPath);
      const raw = await fs.readFile(p, "utf8");
      return { data: JSON.parse(raw), source: "real", path: p };
    } catch {}
  }
  try {
    const p = path.join(FALLBACK_ROOT, relPath);
    const raw = await fs.readFile(p, "utf8");
    return { data: JSON.parse(raw), source: "fallback", path: p };
  } catch (err) {
    return { error: String(err), source: "none" };
  }
}

export async function GET() {
  const rel = "dashboard/docs_tracker_v19.1.json";
  const res = await readJson(rel);
  if ((res as any).error) {
    return NextResponse.json(
      { ok: false, error: (res as any).error, rel },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, rel, ...res });
}
