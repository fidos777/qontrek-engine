/**
 * MCP Governance Logging
 *
 * Provides G13 lineage tracking, request logging, and audit trail
 * for all MCP tool invocations.
 */

import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { scrubObject } from '@/lib/security/scrubber';

export interface GovernanceContext {
  tenant_id: string;
  request_id: string;
  timestamp: string;
  gate: string;
  lineage: string[];
}

export interface MCPLogEntry {
  request_id: string;
  tenant_id: string;
  tool_name: string;
  timestamp: string;
  input_hash: string;
  output_hash: string | null;
  success: boolean;
  error_code: string | null;
  latency_ms: number;
  gate: string;
  lineage: string[];
}

const LOG_DIR = join(process.cwd(), '..', 'logs', 'mcp');
const PROOF_DIR = join(process.cwd(), '..', 'proof');

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `mcp_${timestamp}_${random}`;
}

/**
 * Create governance context for MCP request
 */
export function createGovernanceContext(
  tenantId: string,
  gate: string = 'G13',
  parentLineage: string[] = []
): GovernanceContext {
  const requestId = generateRequestId();
  return {
    tenant_id: tenantId,
    request_id: requestId,
    timestamp: new Date().toISOString(),
    gate,
    lineage: [...parentLineage, requestId],
  };
}

/**
 * Hash payload for integrity tracking
 */
export function hashPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys(payload as object).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

/**
 * Build standard MCP response envelope
 */
export function buildEnvelope<T>(
  success: boolean,
  data: T | null,
  error: { code: string; message: string; details?: Record<string, unknown> } | null,
  governance: GovernanceContext
): {
  success: boolean;
  data: T | null;
  error: typeof error;
  governance: GovernanceContext;
} {
  return {
    success,
    data,
    error,
    governance,
  };
}

/**
 * Build success envelope
 */
export function successEnvelope<T>(data: T, governance: GovernanceContext) {
  return buildEnvelope(true, data, null, governance);
}

/**
 * Build error envelope
 */
export function errorEnvelope(
  code: string,
  message: string,
  governance: GovernanceContext,
  details?: Record<string, unknown>
) {
  return buildEnvelope(null, null, { code, message, details }, governance);
}

/**
 * Log MCP tool invocation
 */
export async function logMCPInvocation(entry: MCPLogEntry): Promise<void> {
  try {
    // Ensure log directory exists
    await mkdir(LOG_DIR, { recursive: true });

    const logFile = join(LOG_DIR, 'invocations.jsonl');
    const scrubbedEntry = scrubObject(entry);
    await appendFile(logFile, JSON.stringify(scrubbedEntry) + '\n', 'utf-8');
  } catch (error) {
    console.error('Failed to log MCP invocation:', error);
  }
}

/**
 * Create MCP log entry
 */
export function createLogEntry(
  toolName: string,
  input: unknown,
  output: unknown | null,
  success: boolean,
  errorCode: string | null,
  governance: GovernanceContext,
  latencyMs: number
): MCPLogEntry {
  return {
    request_id: governance.request_id,
    tenant_id: governance.tenant_id,
    tool_name: toolName,
    timestamp: governance.timestamp,
    input_hash: hashPayload(input),
    output_hash: output ? hashPayload(output) : null,
    success,
    error_code: errorCode,
    latency_ms: latencyMs,
    gate: governance.gate,
    lineage: governance.lineage,
  };
}

/**
 * Emit MCP tool lineage proof
 */
export async function emitToolLineageProof(entries: MCPLogEntry[]): Promise<string> {
  await mkdir(PROOF_DIR, { recursive: true });

  const proof = {
    schema: 'mcp_tool_lineage_v1',
    version: 'v1.0',
    generated_at: new Date().toISOString(),
    total_invocations: entries.length,
    tools_used: [...new Set(entries.map(e => e.tool_name))],
    tenants: [...new Set(entries.map(e => e.tenant_id))],
    success_rate: entries.filter(e => e.success).length / entries.length * 100,
    entries: entries.map(e => ({
      request_id: e.request_id,
      tool_name: e.tool_name,
      timestamp: e.timestamp,
      success: e.success,
      latency_ms: e.latency_ms,
    })),
    merkle_root: computeLineageMerkle(entries),
  };

  const proofPath = join(PROOF_DIR, 'mcp_tool_lineage_v1.json');
  await writeFile(proofPath, JSON.stringify(proof, null, 2), 'utf-8');

  return proof.merkle_root;
}

/**
 * Compute merkle root from lineage entries
 */
function computeLineageMerkle(entries: MCPLogEntry[]): string {
  if (entries.length === 0) return '0'.repeat(64);

  const hashes = entries.map(e =>
    crypto.createHash('sha256')
      .update(`${e.request_id}:${e.tool_name}:${e.timestamp}:${e.success}`)
      .digest('hex')
  );

  // Simple merkle computation
  let level = hashes;
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      const combined = crypto.createHash('sha256')
        .update(left + right)
        .digest('hex');
      nextLevel.push(combined);
    }
    level = nextLevel;
  }

  return level[0];
}

/**
 * Extract tenant ID from JWT token
 */
export function extractTenantFromJWT(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.tenant_id || payload.tid || null;
  } catch {
    return null;
  }
}

/**
 * Get default tenant for development
 */
export function getDefaultTenant(): string {
  return process.env.DEFAULT_TENANT_ID || 'dev_tenant_001';
}

/**
 * Validate tenant access
 */
export function validateTenantAccess(
  requestTenantId: string,
  resourceTenantId: string
): boolean {
  // In production, implement proper tenant isolation
  // For now, allow same tenant or admin access
  if (requestTenantId === resourceTenantId) return true;
  if (requestTenantId.startsWith('admin_')) return true;
  return false;
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  INVALID_INPUT: 'E001',
  UNAUTHORIZED: 'E002',
  FORBIDDEN: 'E003',
  NOT_FOUND: 'E004',
  RATE_LIMITED: 'E005',
  INTERNAL_ERROR: 'E006',
  GOVERNANCE_VIOLATION: 'E007',
  TENANT_MISMATCH: 'E008',
  PROOF_GENERATION_FAILED: 'E009',
  WORKFLOW_FAILED: 'E010',
} as const;

/**
 * MCP tool wrapper with governance logging
 */
export async function withGovernance<TInput, TOutput>(
  toolName: string,
  input: TInput,
  governance: GovernanceContext,
  handler: (input: TInput, governance: GovernanceContext) => Promise<TOutput>
): Promise<{
  success: boolean;
  data: TOutput | null;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
  governance: GovernanceContext;
}> {
  const startTime = Date.now();

  try {
    const result = await handler(input, governance);
    const latencyMs = Date.now() - startTime;

    // Log successful invocation
    const logEntry = createLogEntry(
      toolName,
      input,
      result,
      true,
      null,
      governance,
      latencyMs
    );
    await logMCPInvocation(logEntry);

    return successEnvelope(result, governance);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any).code || ErrorCodes.INTERNAL_ERROR;

    // Log failed invocation
    const logEntry = createLogEntry(
      toolName,
      input,
      null,
      false,
      errorCode,
      governance,
      latencyMs
    );
    await logMCPInvocation(logEntry);

    return errorEnvelope(errorCode, errorMessage, governance);
  }
}
