import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import crypto from "crypto";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "client_uploads");
const ALLOWED = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.UPLOAD_TOKEN}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return NextResponse.json({ ok: false, error: "No file" });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, error: "Invalid type" });
  if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, error: "File too large" });

  const buf = Buffer.from(await file.arrayBuffer());
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const name = `voltek_${sha.slice(0,10)}${path.extname(file.name)}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);

  return NextResponse.json({ ok: true, file: name, sha256: sha, request_id: crypto.randomUUID() });
}
