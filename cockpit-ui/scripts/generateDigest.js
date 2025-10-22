// scripts/generateDigest.js
// Generate Merkle digest of proof files

const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Proof Digest Generation ===");
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Dynamically import ESM modules
    const { computeDigest, verifyReproducibility } = await import(
      "../lib/audit/digest.ts"
    );

    // 1. Compute digest
    console.log("[1/2] Computing Merkle digest...");

    const proofDir = path.join(__dirname, "../../proof");
    const digest = computeDigest(proofDir);

    console.log("\n✅ Digest computed:");
    console.log(`   Merkle Root: ${digest.merkle_root}`);
    console.log(`   Previous Root: ${digest.prev_root || "(none)"}`);
    console.log(`   File Count: ${digest.file_count}`);
    console.log(`   Algorithm: ${digest.algorithm}`);
    console.log(`   Spec: ${digest.spec}`);

    // Save digest
    const digestPath = path.join(proofDir, "proof_digest_v1.json");
    fs.writeFileSync(digestPath, JSON.stringify(digest, null, 2));
    console.log(`\n📄 Saved to: ${digestPath}`);

    // 2. Verify reproducibility
    console.log("\n[2/2] Verifying reproducibility...");

    const verification = verifyReproducibility(proofDir);

    if (verification.reproducible) {
      console.log("✅ Digest is reproducible (byte-identical)");
    } else {
      console.error("❌ Digest is NOT reproducible!");
      console.error("   Differences:", verification.differences);
      process.exit(1);
    }

    console.log("\n✅ Digest generation complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Digest generation failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
