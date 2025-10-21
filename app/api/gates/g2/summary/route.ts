import { NextResponse } from "next/server"
import fs from "fs/promises"

export async function GET() {
  const proofPath = `${process.env.PROOF_REAL_DIR}/g2_dashboard_v19.1.json`
  const fallback = "./proof/g2_dashboard_v19.1.json"

  try {
    const data = JSON.parse(await fs.readFile(proofPath, "utf-8"))
    return NextResponse.json({ source: "real", data })
  } catch {
    const data = JSON.parse(await fs.readFile(fallback, "utf-8"))
    return NextResponse.json({ source: "fallback", data })
  }
}

