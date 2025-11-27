/**
 * MCP Tool: logProofEvent
 *
 * Logs governance and compliance events with proof generation.
 * Maintains audit trail for G13 lineage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { LogProofEventInputSchema, type LogProofEventOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
  hashPayload,
} from '@/lib/mcp/governance';
import { scrubObject } from '@/lib/security/scrubber';

export const runtime = 'nodejs';

const PROOF_DIR = join(process.cwd(), '..', 'proof');
const LOG_DIR = join(process.cwd(), '..', 'logs', 'governance');

interface ProofEvent {
  event_id: string;
  event_type: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
  tenant_id: string;
  logged_at: string;
  proof_hash: string;
}

async function loadLineageState(): Promise<{ events: string[]; merkleRoot: string }> {
  try {
    const lineagePath = join(PROOF_DIR, 'lineage_state.json');
    const content = await readFile(lineagePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { events: [], merkleRoot: '0'.repeat(64) };
  }
}

async function saveLineageState(state: { events: string[]; merkleRoot: string }): Promise<void> {
  await mkdir(PROOF_DIR, { recursive: true });
  const lineagePath = join(PROOF_DIR, 'lineage_state.json');
  await writeFile(lineagePath, JSON.stringify(state, null, 2), 'utf-8');
}

function computeEventHash(event: ProofEvent, previousRoot: string): string {
  const payload = JSON.stringify({
    event_id: event.event_id,
    event_type: event.event_type,
    severity: event.severity,
    message: event.message,
    tenant_id: event.tenant_id,
    logged_at: event.logged_at,
    previous_root: previousRoot,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function computeNewMerkleRoot(previousRoot: string, eventHash: string): string {
  return crypto.createHash('sha256').update(previousRoot + eventHash).digest('hex');
}

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = LogProofEventInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: 'Invalid input parameters',
            details: { errors: parseResult.error.flatten() },
          },
          governance,
        },
        { status: 400 }
      );
    }

    const result = await withGovernance<typeof parseResult.data, LogProofEventOutput>(
      'logProofEvent',
      parseResult.data,
      governance,
      async (input) => {
        const { event_type, severity, message, metadata } = input;

        // Generate event ID
        const eventId = `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
        const loggedAt = new Date().toISOString();

        // Load current lineage state
        const lineageState = await loadLineageState();

        // Create event record
        const event: ProofEvent = {
          event_id: eventId,
          event_type,
          severity,
          message,
          metadata: scrubObject(metadata || {}),
          tenant_id: tenantId,
          logged_at: loggedAt,
          proof_hash: '', // Will be computed
        };

        // Compute proof hash
        event.proof_hash = computeEventHash(event, lineageState.merkleRoot);

        // Update lineage state
        const newMerkleRoot = computeNewMerkleRoot(lineageState.merkleRoot, event.proof_hash);
        lineageState.events.push(eventId);
        lineageState.merkleRoot = newMerkleRoot;

        // Ensure directories exist
        await mkdir(LOG_DIR, { recursive: true });
        await mkdir(PROOF_DIR, { recursive: true });

        // Append to event log
        const logPath = join(LOG_DIR, 'events.jsonl');
        await appendFile(logPath, JSON.stringify(event) + '\n', 'utf-8');

        // Save updated lineage state
        await saveLineageState(lineageState);

        // Emit proof digest if this is a significant event
        if (severity === 'critical' || event_type === 'compliance_event') {
          const proofPath = join(PROOF_DIR, 'proof_event_latest.json');
          await writeFile(proofPath, JSON.stringify({
            schema: 'proof_event_v1',
            event_id: eventId,
            event_type,
            severity,
            proof_hash: event.proof_hash,
            merkle_root: newMerkleRoot,
            lineage_depth: lineageState.events.length,
            generated_at: loggedAt,
          }, null, 2), 'utf-8');
        }

        return {
          event_id: eventId,
          logged_at: loggedAt,
          proof_hash: event.proof_hash,
          lineage_updated: true,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: (error as Error).message,
        },
        governance,
      },
      { status: 500 }
    );
  }
}
