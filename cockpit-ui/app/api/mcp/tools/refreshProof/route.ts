/**
 * MCP Tool: refreshProof
 *
 * POST /api/mcp/tools/refreshProof
 * Force refresh the proof chain for a tenant, generating a new proof hash.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  generateId,
  generateProofHash,
  getLatestProofHash,
} from '@/lib/mcp';
import { RefreshProofInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'refreshProof';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = RefreshProofInputSchema.parse(rawInput);

    // Generate new proof hash
    const previousHash = getLatestProofHash(input.tenant_id);
    const newHash = await generateProofHash(
      'proof_refresh',
      { id: authContext.user_id, type: 'user' },
      { id: input.tenant_id, type: 'tenant' },
      previousHash
    );

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      proof_id: generateId(),
      hash: newHash,
      refreshed_at: getCurrentTimestamp(),
    };

    return NextResponse.json(
      createSuccessResponse(TOOL_NAME, data, governance, startTime)
    );
  } catch (error) {
    const governance = await logToolInvocation(TOOL_NAME, authContext, {}, false);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      createErrorResponse(
        TOOL_NAME,
        'VALIDATION_ERROR',
        errorMessage,
        governance,
        startTime,
        { proof_id: '', hash: '', refreshed_at: getCurrentTimestamp() }
      ),
      { status: 400 }
    );
  }
}
