// scripts/towerUpload.js
// Tower upload client with idempotency, retries, and verification

const fs = require("fs");
const path = require("path");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const ACK_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay
 */
function exponentialBackoff(attempt, baseDelayMs) {
  return baseDelayMs * Math.pow(2, attempt);
}

/**
 * Upload manifest to Tower with retries
 */
async function uploadManifest(manifest, options = {}) {
  const towerUrl = options.towerUrl || process.env.TOWER_API_URL;
  const atlasKey = options.atlasKey || process.env.ATLAS_KEY;

  if (!towerUrl) {
    throw new Error(
      "TOWER_API_URL not configured. Set environment variable or pass towerUrl option."
    );
  }

  if (!atlasKey) {
    throw new Error(
      "ATLAS_KEY not configured. Set environment variable or pass atlasKey option."
    );
  }

  const uploadUrl = `${towerUrl}/api/tower/uploadProof`;

  console.log(`\n[Upload] Uploading manifest ${manifest.manifest_id} to Tower...`);
  console.log(`   URL: ${uploadUrl}`);

  let attempt = 0;
  let lastError = null;

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(
        `   Attempt ${attempt + 1}/${MAX_RETRIES + 1}...`
      );

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Atlas-Key": atlasKey,
          "X-Manifest-Id": manifest.manifest_id, // Idempotency key
        },
        body: JSON.stringify(manifest),
      });

      const responseData = await response.json();

      if (response.ok || response.status === 204) {
        console.log(`   ✅ Upload successful (${response.status})`);

        return {
          success: true,
          status: response.status,
          receipt_id: responseData.receipt_id,
          echo_root: responseData.echo_root,
          message: responseData.message,
        };
      }

      // Idempotent response - manifest already uploaded
      if (response.status === 200 && responseData.already_uploaded) {
        console.log(`   ✅ Manifest already uploaded (idempotent)`);

        return {
          success: true,
          status: response.status,
          receipt_id: responseData.receipt_id,
          echo_root: responseData.echo_root,
          already_uploaded: true,
        };
      }

      // Non-retriable errors
      if (response.status === 400 || response.status === 401) {
        throw new Error(
          `Upload failed with non-retriable error (${response.status}): ${responseData.message || responseData.error}`
        );
      }

      // Retriable error
      lastError = new Error(
        `Upload failed (${response.status}): ${responseData.message || responseData.error}`
      );
      console.warn(`   ⚠️  ${lastError.message}`);
    } catch (error) {
      lastError = error;
      console.warn(`   ⚠️  Request failed: ${error.message}`);
    }

    // Retry with exponential backoff
    if (attempt < MAX_RETRIES) {
      const delay = exponentialBackoff(attempt, RETRY_DELAY_MS);
      console.log(`   Retrying in ${delay}ms...`);
      await sleep(delay);
    }

    attempt++;
  }

  // All retries failed
  throw new Error(
    `Upload failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`
  );
}

/**
 * Wait for Tower ACK with timeout
 */
async function waitForAck(receiptId, options = {}) {
  const towerUrl = options.towerUrl || process.env.TOWER_API_URL;
  const atlasKey = options.atlasKey || process.env.ATLAS_KEY;
  const timeoutMs = options.timeoutMs || ACK_TIMEOUT_MS;

  if (!towerUrl) {
    throw new Error("TOWER_API_URL not configured");
  }

  if (!atlasKey) {
    throw new Error("ATLAS_KEY not configured");
  }

  const ackUrl = `${towerUrl}/api/tower/ack/${receiptId}`;

  console.log(`\n[ACK] Waiting for Tower ACK (timeout: ${timeoutMs}ms)...`);
  console.log(`   Receipt ID: ${receiptId}`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(ackUrl, {
        method: "GET",
        headers: {
          "X-Atlas-Key": atlasKey,
        },
      });

      if (response.ok) {
        const ackData = await response.json();
        console.log(`   ✅ ACK received (${Date.now() - startTime}ms)`);

        return {
          success: true,
          receipt_id: receiptId,
          status: ackData.status,
          verified_at: ackData.verified_at,
          merkle_root: ackData.merkle_root,
        };
      }

      if (response.status === 404) {
        // Not yet processed, retry
        console.log(`   ⏳ ACK pending...`);
        await sleep(2000);
        continue;
      }

      // Error
      const errorData = await response.json();
      throw new Error(
        `ACK check failed (${response.status}): ${errorData.message || errorData.error}`
      );
    } catch (error) {
      // Network error, retry
      console.warn(`   ⚠️  ACK check failed: ${error.message}`);
      await sleep(2000);
    }
  }

  throw new Error(
    `ACK timeout: Tower did not acknowledge receipt ${receiptId} within ${timeoutMs}ms`
  );
}

/**
 * Verify echo root matches manifest root
 */
function verifyEchoRoot(manifestRoot, echoRoot) {
  console.log(`\n[Verify] Comparing Merkle roots...`);
  console.log(`   Manifest root: ${manifestRoot}`);
  console.log(`   Tower echo root: ${echoRoot}`);

  if (manifestRoot !== echoRoot) {
    throw new Error(
      `Merkle root mismatch! Manifest: ${manifestRoot}, Tower echo: ${echoRoot}`
    );
  }

  console.log(`   ✅ Merkle roots match`);
  return true;
}

/**
 * Upload manifest to Tower with full workflow
 */
async function uploadToTower(manifestPath, options = {}) {
  console.log("=== Tower Upload Client ===");
  console.log(`Manifest: ${manifestPath}\n`);

  // 1. Read manifest
  console.log("[1/4] Reading manifest...");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`   Manifest ID: ${manifest.manifest_id}`);
  console.log(`   File count: ${manifest.file_count}`);
  console.log(`   Merkle root: ${manifest.merkle_root}`);

  // 2. Upload manifest
  console.log("\n[2/4] Uploading to Tower...");
  const uploadResult = await uploadManifest(manifest, options);

  if (!uploadResult.success) {
    throw new Error("Upload failed");
  }

  console.log(`   Receipt ID: ${uploadResult.receipt_id}`);
  console.log(`   Echo root: ${uploadResult.echo_root}`);

  // 3. Verify echo root
  console.log("\n[3/4] Verifying echo root...");
  verifyEchoRoot(manifest.merkle_root, uploadResult.echo_root);

  // 4. Wait for ACK (optional, may be async)
  let ackResult = null;
  if (options.waitForAck !== false) {
    console.log("\n[4/4] Waiting for Tower ACK...");
    try {
      ackResult = await waitForAck(uploadResult.receipt_id, options);
    } catch (error) {
      console.warn(
        `   ⚠️  ACK wait failed: ${error.message} (continuing anyway)`
      );
    }
  } else {
    console.log("\n[4/4] Skipping ACK wait (async mode)");
  }

  // Generate upload receipt
  const uploadReceipt = {
    proof_id: "tower_ci_upload_v1",
    version: "1.0.0",
    release: "G19.9.2-R1.4.6",
    type: "tower_upload_receipt",
    timestamp: new Date().toISOString(),
    manifest_id: manifest.manifest_id,
    receipt_id: uploadResult.receipt_id,
    upload_status: "success",
    upload_attempt: uploadResult.already_uploaded ? "idempotent" : "new",
    merkle_root_verified: true,
    merkle_root: manifest.merkle_root,
    echo_root: uploadResult.echo_root,
    ack_status: ackResult ? "received" : "pending",
    ack_data: ackResult,
    build: manifest.build,
    file_count: manifest.file_count,
    signature: manifest.signature,
  };

  // Save receipt
  const receiptPath =
    options.receiptPath ||
    path.join(
      path.dirname(manifestPath),
      "tower_ci_upload_v1.json"
    );

  fs.writeFileSync(receiptPath, JSON.stringify(uploadReceipt, null, 2));
  console.log(`\n✅ Upload receipt saved: ${receiptPath}`);

  return uploadReceipt;
}

// Export for use as module
module.exports = {
  uploadManifest,
  waitForAck,
  verifyEchoRoot,
  uploadToTower,
};

// Run if executed directly
if (require.main === module) {
  const manifestPath =
    process.argv[2] ||
    path.join(__dirname, "../../proof/factory_runtime_seal.json");

  uploadToTower(manifestPath)
    .then(() => {
      console.log("\n✅ Tower upload complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Tower upload failed:");
      console.error(error);
      process.exit(1);
    });
}
