/**
 * MCP Tool Schema Contracts
 *
 * Defines input/output schemas for all MCP tools using Zod.
 * Enforces runtime validation and generates OpenAPI-compatible schemas.
 *
 * @module lib/governance/schemas
 */

import { z } from 'zod';

/**
 * Standard MCP Response Envelope
 */
export const MCPResponseEnvelopeSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    ok: z.boolean(),
    requestId: z.string(),
    timestamp: z.string().datetime(),
    schemaVersion: z.string(),
    data: dataSchema,
    governance: z
      .object({
        actorId: z.string(),
        checks: z.array(
          z.object({
            check: z.string(),
            passed: z.boolean(),
            message: z.string().optional(),
          })
        ),
      })
      .optional(),
  });

/**
 * Standard MCP Error Response
 */
export const MCPErrorResponseSchema = z.object({
  ok: z.literal(false),
  requestId: z.string(),
  timestamp: z.string().datetime(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

// ============================================================================
// TOOL: /api/mcp/governance
// ============================================================================

export const GovernanceGateSchema = z.object({
  name: z.string(),
  status: z.enum(['pass', 'pending', 'partial', 'failed']),
  evidence: z.record(z.union([z.boolean(), z.string(), z.array(z.string())])),
  kpis: z.record(z.number()),
});

export const GovernanceResponseDataSchema = z.object({
  version: z.string(),
  generatedAt: z.string().datetime(),
  gates: z.record(GovernanceGateSchema),
  summary: z.object({
    totalGates: z.number(),
    passed: z.number(),
    pending: z.number(),
    partial: z.number(),
    failed: z.number(),
  }),
});

export const GovernanceResponseSchema = MCPResponseEnvelopeSchema(GovernanceResponseDataSchema);

// ============================================================================
// TOOL: /api/mcp/healthz
// ============================================================================

export const SLOMetricSchema = z.object({
  current: z.number().optional(),
  p50Ms: z.number().optional(),
  p95Ms: z.number().optional(),
  targetP50Ms: z.number().optional(),
  targetP95Ms: z.number().optional(),
  targetPercent: z.number().optional(),
  healthy: z.boolean(),
});

export const HealthzResponseDataSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'error']),
  timestamp: z.string().datetime(),
  slo: z.object({
    ackLatency: SLOMetricSchema,
    clockSkew: SLOMetricSchema,
    errorRate: SLOMetricSchema,
    coverage: SLOMetricSchema,
  }),
  panicMode: z.object({
    active: z.boolean(),
    triggers: z.array(z.string()),
  }),
  antiReplay: z.object({
    activeNonces: z.number(),
    expiredNonces: z.number(),
    byContext: z.record(z.number()),
    replayRate: z.number(),
  }),
  keyRotation: z.object({
    activeKeys: z.number(),
    needsRotation: z.number(),
    critical: z.number(),
    minDaysUntilRotation: z.number().nullable(),
  }),
  receipts: z.object({
    total: z.number(),
    verified: z.number(),
    pending: z.number(),
    rejected: z.number(),
  }),
});

export const HealthzResponseSchema = MCPResponseEnvelopeSchema(HealthzResponseDataSchema);

// ============================================================================
// TOOL: /api/mcp/tail
// ============================================================================

export const TailRequestQuerySchema = z.object({
  lines: z.coerce.number().min(1).max(1000).default(100),
  filter: z.string().optional(),
});

export const LogEntrySchema = z.record(z.unknown());

export const TailResponseDataSchema = z.object({
  logs: z.array(LogEntrySchema),
  meta: z.object({
    total: z.number(),
    returned: z.number(),
    filtered: z.boolean(),
  }),
});

export const TailResponseSchema = MCPResponseEnvelopeSchema(TailResponseDataSchema);

// ============================================================================
// TOOL: /api/tower/uploadProof
// ============================================================================

export const ManifestFileSchema = z.object({
  path: z.string(),
  sha256: z.string().length(64),
});

export const UploadProofRequestSchema = z.object({
  manifest: z.object({
    version: z.string().default('v1.0'),
    files: z.array(ManifestFileSchema).min(1),
    merkleRoot: z.string().length(64),
    signature: z.string(),
    kid: z.string(),
  }),
});

export const UploadProofResponseDataSchema = z.object({
  receiptId: z.string().startsWith('rcpt_'),
  echoRoot: z.string().length(64),
  status: z.enum(['pending', 'received', 'verified', 'rejected']),
  uploadedAt: z.string().datetime(),
});

export const UploadProofResponseSchema = MCPResponseEnvelopeSchema(UploadProofResponseDataSchema);

// ============================================================================
// TOOL: /api/tower/verifyDigest
// ============================================================================

export const VerifyDigestRequestSchema = z.object({
  digest: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    merkleRoot: z.string().length(64),
    recordCount: z.number().int().min(0).optional(),
    signature: z.string().optional(),
  }),
});

export const VerifyDigestResponseDataSchema = z.object({
  verified: z.boolean(),
  digestHash: z.string().length(64),
  towerSignature: z.string(),
  towerKid: z.string(),
  verifiedAt: z.string().datetime(),
  digest: z.object({
    date: z.string(),
    merkleRoot: z.string(),
    recordCount: z.number().optional(),
  }),
});

export const VerifyDigestResponseSchema = MCPResponseEnvelopeSchema(VerifyDigestResponseDataSchema);

// ============================================================================
// TOOL: /api/tower/ack/{receipt_id}
// ============================================================================

export const AckReceiptParamsSchema = z.object({
  receipt_id: z.string().startsWith('rcpt_'),
});

export const AckReceiptResponseDataSchema = z.object({
  receiptId: z.string(),
  status: z.enum(['pending', 'received', 'verified', 'rejected']),
  echoRoot: z.string(),
  uploadedAt: z.string().datetime(),
  verifiedAt: z.string().datetime().optional(),
  manifestHash: z.string(),
  errors: z.array(z.string()).optional(),
});

export const AckReceiptResponseSchema = MCPResponseEnvelopeSchema(AckReceiptResponseDataSchema);

// ============================================================================
// VERTICAL ARCHETYPE BOUNDING RULES
// ============================================================================

export const VerticalArchetypeSchema = z.enum([
  'sales',          // Gates 0-1: Lead qualification, decision engine
  'finance',        // Gate 2, CFO: Payment recovery, profitability
  'operations',     // Document tracker, SLA monitoring
  'executive',      // CFO lens, risk dashboard
  'federation',     // Tower sync, governance checks
  'clinical',       // Clinic-specific vertical (Zeyti persona)
  'commercial',     // Commercial/ROI vertical (Danish persona)
]);

export type VerticalArchetype = z.infer<typeof VerticalArchetypeSchema>;

/**
 * Tool-to-Vertical mapping for bounding rules
 */
export const TOOL_VERTICAL_MAP: Record<string, VerticalArchetype[]> = {
  '/api/mcp/governance': ['federation', 'executive'],
  '/api/mcp/healthz': ['federation', 'executive', 'operations'],
  '/api/mcp/tail': ['operations', 'federation'],
  '/api/tower/uploadProof': ['federation'],
  '/api/tower/verifyDigest': ['federation'],
  '/api/tower/ack': ['federation'],
  '/api/gates/g0': ['sales'],
  '/api/gates/g1': ['sales'],
  '/api/gates/g2': ['finance', 'sales'],
  '/api/cfo': ['executive', 'finance'],
  '/api/docs': ['operations'],
};

/**
 * Check if actor's vertical is allowed for tool
 */
export function isVerticalAllowed(
  toolPath: string,
  actorVertical: VerticalArchetype | undefined
): boolean {
  // Find matching tool pattern
  const toolKey = Object.keys(TOOL_VERTICAL_MAP).find((key) =>
    toolPath.startsWith(key)
  );

  if (!toolKey) {
    // Unknown tool - deny by default
    return false;
  }

  const allowedVerticals = TOOL_VERTICAL_MAP[toolKey];

  // If no vertical specified, allow (backwards compatibility)
  if (!actorVertical) {
    return true;
  }

  return allowedVerticals.includes(actorVertical);
}

/**
 * Validate request body against schema
 */
export function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Create validated response envelope
 */
export function createResponseEnvelope<T>(
  data: T,
  requestId: string,
  schemaVersion: string,
  governanceInfo?: { actorId: string; checks: Array<{ check: string; passed: boolean; message?: string }> }
): z.infer<ReturnType<typeof MCPResponseEnvelopeSchema<z.ZodType<T>>>> {
  return {
    ok: true,
    requestId,
    timestamp: new Date().toISOString(),
    schemaVersion,
    data,
    governance: governanceInfo,
  };
}
