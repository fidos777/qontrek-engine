import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "client_uploads");

export async function POST(req: Request) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ ok: false, error: "No file" });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, file.name);
  await fs.writeFile(filePath, buffer);

  console.log("📦 Uploaded:", filePath);

  // Trigger Python proof rebuild asynchronously
  const rebuild = "python3 convert_voltek_fixtures.py";
  console.log("🚀 Triggering:", rebuild);

  return NextResponse.json({ ok: true, file: file.name });
}
