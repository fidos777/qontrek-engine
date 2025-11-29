/**
 * POST /api/tower/uploadProof
 *
 * CORRECTED VERSION - Implements proper governance enforcement
 *
 * Changes:
 * 1. Added actor identity validation
 * 2. Added governance pre-checks before execution
 * 3. Added ledger event emission for state mutations
 * 4. Added input schema validation
 * 5. Added vertical archetype bounding
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeMerkleRoot, computeManifestDigest } from '@/lib/tower/merkle';
import { getActiveSigningKey, coSign } from '@/lib/tower/signing';
import {
  generateReceiptId,
  storeReceipt,
  emitTowerReceiptProof,
  TowerReceipt,
} from '@/lib/tower/receipts';
import {
  enforceGovernance,
  createGovernanceErrorResponse,
  generateRequestId,
} from '@/lib/governance/middleware';
import { appendToLedger, emitStateMutation, generateEventId } from '@/lib/governance/ledger';
import {
  UploadProofRequestSchema,
  createResponseEnvelope,
  isVerticalAllowed,
  VerticalArchetype,
} from '@/lib/governance/schemas';

const SCHEMA_VERSION = '1.0.0';
const TOOL_NAME = '/api/tower/uploadProof';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  // =========================================================================
  // GOVERNANCE ENFORCEMENT (BEFORE EXECUTION)
  // =========================================================================
  const governance = await enforceGovernance(request, TOOL_NAME, {
    requireAuth: true,                  // Require actor identity
    requireNonce: true,                 // Require nonce for anti-replay
    requireSignature: true,             // Require signature for mutations
    allowedActorTypes: ['service', 'system', 'federation'],  // Only automated actors
    allowedScopes: ['write', 'admin'],  // Write scope required
    vertical: 'federation',
  });

  if (!governance.allowed) {
    return createGovernanceErrorResponse(governance.error!, requestId);
  }

  const context = governance.context!;

  // =========================================================================
  // VERTICAL ARCHETYPE BOUNDING
  // =========================================================================
  const actorVertical = request.headers.get('x-vertical') as VerticalArchetype | null;
  if (!isVerticalAllowed(TOOL_NAME, actorVertical || undefined)) {
    await appendToLedger({
      eventId: generateEventId(),
      eventType: 'access_denied',
      timestamp: new Date().toISOString(),
      actorId: context.actor.actorId,
      actorType: context.actor.actorType,
      toolName: TOOL_NAME,
      vertical: actorVertical || undefined,
    });

    return NextResponse.json(
      {
        error: 'Vertical archetype not permitted for this tool',
        requestId,
        allowedVerticals: ['federation'],
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // =========================================================================
    // INPUT SCHEMA VALIDATION
    // =========================================================================
    const validation = UploadProofRequestSchema.safeParse(body);
    if (!validation.success) {
      await appendToLedger({
        eventId: generateEventId(),
        eventType: 'error',
        timestamp: new Date().toISOString(),
        actorId: context.actor.actorId,
        actorType: context.actor.actorType,
        toolName: TOOL_NAME,
      });

      return NextResponse.json(
        {
          error: 'Invalid request body',
          requestId,
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { manifest } = validation.data;

    // =========================================================================
    // EXECUTE TOOL LOGIC
    // =========================================================================

    // Extract file hashes
    const fileHashes = manifest.files.map((f) => f.sha256);

    // Recompute Merkle root to verify
    const echoRoot = computeMerkleRoot(fileHashes);

    // Check if echo root matches claimed root
    if (echoRoot !== manifest.merkleRoot) {
      await appendToLedger({
        eventId: generateEventId(),
        eventType: 'error',
        timestamp: new Date().toISOString(),
        actorId: context.actor.actorId,
        actorType: context.actor.actorType,
        toolName: TOOL_NAME,
      });

      return NextResponse.json(
        {
          error: 'Merkle root mismatch',
          requestId,
          expected: manifest.merkleRoot,
          computed: echoRoot,
        },
        { status: 400 }
      );
    }

    // Compute manifest hash
    const manifestClone = { ...manifest };
    delete (manifestClone as any).signature;
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

    // =========================================================================
    // EMIT STATE MUTATION LEDGER EVENT (BEFORE DB WRITE)
    // =========================================================================
    await emitStateMutation({
      actorId: context.actor.actorId,
      actorType: context.actor.actorType,
      resource: 'tower_receipt',
      resourceId: receiptId,
      operation: 'create',
      newState: receipt as unknown as Record<string, unknown>,
      toolName: TOOL_NAME,
      vertical: actorVertical || undefined,
    });

    // Persist receipt (now has ledger event)
    await storeReceipt(receipt);

    // Emit proof for CI consumption
    await emitTowerReceiptProof(receipt);

    // =========================================================================
    // EMIT SUCCESS LEDGER EVENT
    // =========================================================================
    await appendToLedger({
      eventId: generateEventId(),
      eventType: 'receipt_created',
      timestamp: new Date().toISOString(),
      actorId: context.actor.actorId,
      actorType: context.actor.actorType,
      toolName: TOOL_NAME,
      vertical: actorVertical || undefined,
    });

    // =========================================================================
    // RETURN RESPONSE WITH GOVERNANCE ENVELOPE
    // =========================================================================
    const responseData = {
      receiptId: receipt.receiptId,
      echoRoot: receipt.echoRoot,
      status: receipt.status,
      uploadedAt: receipt.uploadedAt,
    };

    return NextResponse.json(
      createResponseEnvelope(responseData, requestId, SCHEMA_VERSION, {
        actorId: context.actor.actorId,
        checks: context.governanceChecks.map((c) => ({
          check: c.check,
          passed: c.passed,
          message: c.message,
        })),
      })
    );

  } catch (error) {
    // =========================================================================
    // ERROR HANDLING WITH LEDGER
    // =========================================================================
    await appendToLedger({
      eventId: generateEventId(),
      eventType: 'error',
      timestamp: new Date().toISOString(),
      actorId: context.actor.actorId,
      actorType: context.actor.actorType,
      toolName: TOOL_NAME,
    });

    console.error('Tower uploadProof error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message, requestId },
      { status: 500 }
    );
  }
}
