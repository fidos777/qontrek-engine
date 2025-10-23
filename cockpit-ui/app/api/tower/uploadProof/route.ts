import { NextRequest, NextResponse } from 'next/server';
import { computeMerkleRoot, sha256, computeManifestDigest } from '@/lib/tower/merkle';
import { getActiveSigningKey, coSign, verifySignature } from '@/lib/tower/signing';
import {
  generateReceiptId,
  storeReceipt,
  emitTowerReceiptProof,
  TowerReceipt,
} from '@/lib/tower/receipts';
import { createTelemetry } from '@/lib/telemetryClient';

// Server-side telemetry uses console-only sink
const serverSink = {
  emit: async (name: string, payload: any) => {
    const timestamp = new Date().toISOString();
    const entry = { event: name, payload, timestamp };
    console.log("[TELEMETRY]", JSON.stringify(entry));
  },
};
const telemetry = createTelemetry(serverSink);

/**
 * POST /api/tower/uploadProof
 *
 * Validates factory runtime manifest, recomputes Merkle root,
 * co-signs with Tower key, and returns receipt.
 *
 * Request body:
 * {
 *   "manifest": {
 *     "version": "v1.0",
 *     "files": [{ "path": "...", "sha256": "..." }],
 *     "merkleRoot": "...",
 *     "signature": "...",
 *     "kid": "..."
 *   }
 * }
 *
 * Response:
 * {
 *   "receiptId": "rcpt_...",
 *   "echoRoot": "...",
 *   "status": "received",
 *   "uploadedAt": "..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await telemetry.emit("ui.import.open", { timestamp: new Date().toISOString() });

    const body = await request.json();
    const { manifest } = body;

    // Validate manifest structure
    if (!manifest || !manifest.files || !Array.isArray(manifest.files)) {
      await telemetry.emit("ui.import.error", { error: "missing or invalid files array" });
      return NextResponse.json(
        { error: 'Invalid manifest: missing or invalid files array' },
        { status: 400 }
      );
    }

    if (!manifest.merkleRoot) {
      await telemetry.emit("ui.import.error", { error: "missing merkleRoot" });
      return NextResponse.json(
        { error: 'Invalid manifest: missing merkleRoot' },
        { status: 400 }
      );
    }

    if (!manifest.signature || !manifest.kid) {
      await telemetry.emit("ui.import.error", { error: "missing signature or kid" });
      return NextResponse.json(
        { error: 'Invalid manifest: missing signature or kid' },
        { status: 400 }
      );
    }

    await telemetry.emit("ui.import.validate", { fileCount: manifest.files.length });

    // Extract file hashes
    const fileHashes = manifest.files.map((f: any) => f.sha256);

    // Recompute Merkle root to verify
    const echoRoot = computeMerkleRoot(fileHashes);

    // Check if echo root matches claimed root
    if (echoRoot !== manifest.merkleRoot) {
      await telemetry.emit("ui.import.error", { error: "Merkle root mismatch" });
      return NextResponse.json(
        {
          error: 'Merkle root mismatch',
          expected: manifest.merkleRoot,
          computed: echoRoot,
        },
        { status: 400 }
      );
    }

    // Compute manifest hash
    const manifestClone = { ...manifest };
    delete manifestClone.signature;
    const manifestHash = computeManifestDigest(manifestClone);

    // Get Tower signing key and co-sign
    const towerKey = getActiveSigningKey();
    const signatures = coSign(
      manifestClone,
      manifest.signature,
      towerKey
    );

    // Generate receipt
    const receiptId = generateReceiptId();
    const receipt: TowerReceipt = {
      receiptId,
      manifestHash,
      echoRoot,
      uploadedAt: new Date().toISOString(),
      status: 'received',
      manifest: {
        version: manifest.version || 'v1.0',
        files: manifest.files,
        merkleRoot: manifest.merkleRoot,
      },
      signatures: {
        factorySignature: manifest.signature,
        towerSignature: signatures.towerSignature,
        towerKid: signatures.towerKid,
      },
    };

    // Persist receipt
    await storeReceipt(receipt);

    // Emit proof for CI consumption
    await emitTowerReceiptProof(receipt);

    await telemetry.emit("ui.import.apply", {
      receiptId: receipt.receiptId,
      fileCount: manifest.files.length,
      merkleRoot: echoRoot,
    });

    // Return acknowledgment
    return NextResponse.json({
      receiptId: receipt.receiptId,
      echoRoot: receipt.echoRoot,
      status: receipt.status,
      uploadedAt: receipt.uploadedAt,
    });

  } catch (error) {
    console.error('Tower uploadProof error:', error);
    await telemetry.emit("ui.import.error", { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
