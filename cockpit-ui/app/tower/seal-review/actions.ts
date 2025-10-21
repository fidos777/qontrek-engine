'use server'

import fs from "fs";
import path from "path";

export async function sealProof() {
  const proofPath = path.join(process.cwd(), "proof", "v19_1_frontend_certification.json");
  const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  // Duplicate guard
  if (proof.status === "sealed" && proof.seal_hash) {
    return { sealed: true, duplicate: true, sealed_at: proof.sealed_at, sealed_by: proof.sealed_by, seal_hash: proof.seal_hash };
  }

  const now = new Date().toISOString();
  const hash = Buffer.from(`${proof.manifest_path}|${proof.gate}|${proof.generated_at}`).toString("base64");

  proof.status = "sealed";
  proof.sealed_at = now;
  proof.sealed_by = "commander@tower";
  proof.seal_hash = hash;

  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));

  return { sealed: true, duplicate: false, sealed_at: now, sealed_by: "commander@tower", seal_hash: hash };
}

