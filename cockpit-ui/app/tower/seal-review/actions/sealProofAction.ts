"use server";

import fs from "fs";
import path from "path";

export async function runSealProof() {
  const proofPath = path.join(process.cwd(), "proof", "lineage.json");

  // Ensure file exists
  if (!fs.existsSync(proofPath)) {
    fs.writeFileSync(proofPath, "[]", "utf8");
  }

  const lineage = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  lineage.push({
    gate: "G19.1",
    proof: "proof/v19_1_frontend_certification.json",
    sealed_at: new Date().toISOString(),
    sealed_by: "Commander",
  });

  fs.writeFileSync(proofPath, JSON.stringify(lineage, null, 2));
  console.log("✅ Proof lineage sealed and updated:", proofPath);
}
