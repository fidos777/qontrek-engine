import { NextResponse } from "next/server";
import crypto from "crypto";

let registry: Record<string, string> = {};

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.TOWER_TOKEN}`) {
    return NextResponse.json({ sealed: false, error: "Unauthorized" }, { status: 401 });
  }
  const { gate, manifest_path, generated_at } = await req.json();
  const key = `${gate}:${manifest_path}:${generated_at}`;
  const seal_hash = crypto.createHash("sha256").update(key).digest("hex");

  if (registry[key]) return NextResponse.json({ sealed: true, duplicate: true, seal_hash });
  registry[key] = seal_hash;
  return NextResponse.json({
    sealed: true,
    duplicate: false,
    sealed_at: new Date().toISOString(),
    sealed_by: "auditor@tower",
    seal_hash,
  });
}
