// scripts/auditMirror.js
// Daily audit mirror + digest generation job

const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Audit Mirror Job Started ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Dynamically import ESM modules
    const { mirrorLogsToSupabase } = await import("../lib/audit/mirror.ts");
    const { computeDigest } = await import("../lib/audit/digest.ts");

    // 1. Mirror logs to Supabase
    console.log("\n[1/2] Mirroring logs to Supabase...");

    const mirrorConfig = {
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      tenantId: process.env.ATLAS_TENANT_ID || "atlas-demo",
      batchSize: 100,
      maxRetries: 3,
      retryDelayMs: 2000,
    };

    if (!mirrorConfig.supabaseUrl || !mirrorConfig.supabaseKey) {
      console.warn(
        "⚠️  Supabase credentials not configured. Skipping mirror step."
      );
      console.warn(
        "   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    } else {
      const mirrorStats = await mirrorLogsToSupabase(mirrorConfig);

      console.log("\n✅ Mirror completed:");
      console.log(`   Run ID: ${mirrorStats.mirror_run_id}`);
      console.log(`   Duration: ${mirrorStats.duration_ms}ms`);
      console.log(`   Processed: ${mirrorStats.events_processed}`);
      console.log(`   Inserted: ${mirrorStats.events_inserted}`);
      console.log(`   Skipped: ${mirrorStats.events_skipped}`);
      console.log(`   Errors: ${mirrorStats.errors}`);

      // Save mirror stats to proof artifact
      const mirrorProofPath = path.join(
        __dirname,
        "../../proof/audit_mirror_v1.json"
      );

      const mirrorProof = {
        proof_id: "audit_mirror_v1",
        version: "1.0.0",
        release: "G19.9.2-R1.4.4",
        title: "Audit Log Mirror to Supabase",
        type: "audit_mirror",
        timestamp: new Date().toISOString(),
        run_stats: mirrorStats,
        config: {
          tenant_id: mirrorConfig.tenantId,
          batch_size: mirrorConfig.batchSize,
          max_retries: mirrorConfig.maxRetries,
        },
        signature: {
          method: "Supabase mirror with idempotency",
          attestation: `Mirrored ${mirrorStats.events_inserted} events to offsite audit log`,
          verifiable_by: "Supabase audit_log table query",
        },
      };

      fs.writeFileSync(mirrorProofPath, JSON.stringify(mirrorProof, null, 2));
      console.log(`\n📄 Proof saved: ${mirrorProofPath}`);
    }

    // 2. Compute digest of all proof files
    console.log("\n[2/2] Computing Merkle digest of proof files...");

    const proofDir = path.join(__dirname, "../../proof");
    const digest = computeDigest(proofDir);

    console.log("\n✅ Digest computed:");
    console.log(`   Merkle Root: ${digest.merkle_root}`);
    console.log(`   Previous Root: ${digest.prev_root || "(none)"}`);
    console.log(`   File Count: ${digest.file_count}`);
    console.log(`   Algorithm: ${digest.algorithm}`);

    // Save digest to proof artifact
    const digestPath = path.join(proofDir, "proof_digest_v1.json");
    fs.writeFileSync(digestPath, JSON.stringify(digest, null, 2));
    console.log(`\n📄 Digest saved: ${digestPath}`);

    // 3. Verify reproducibility
    console.log("\n[3/3] Verifying digest reproducibility...");

    const { verifyReproducibility } = await import("../lib/audit/digest.ts");
    const verification = verifyReproducibility(proofDir);

    if (verification.reproducible) {
      console.log("✅ Digest is reproducible (byte-identical on regeneration)");
    } else {
      console.error("❌ Digest is NOT reproducible!");
      console.error("   Differences:", verification.differences);
      process.exit(1);
    }

    console.log("\n=== Audit Mirror Job Completed Successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Audit Mirror Job Failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
