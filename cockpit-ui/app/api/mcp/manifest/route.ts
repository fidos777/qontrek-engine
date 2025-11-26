import { NextResponse } from 'next/server';

/**
 * GET /api/mcp/manifest
 *
 * Returns the MCP tool manifest describing available tools,
 * their endpoints, parameters, and usage examples.
 *
 * This manifest enables AI agents to discover and invoke
 * Qontrek MCP capabilities programmatically.
 */

export interface MCPTool {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: unknown;
    description: string;
    enum?: string[];
  }>;
  returns: string;
  example?: {
    request?: Record<string, unknown>;
    response: Record<string, unknown>;
  };
}

export interface MCPManifest {
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  tools: MCPTool[];
  metadata: {
    generatedAt: string;
    toolCount: number;
  };
}

const manifest: MCPManifest = {
  name: 'Qontrek MCP',
  version: '1.0.0',
  description: 'Model Context Protocol manifest for Qontrek governance engine - 10 tools for proof verification, governance KPIs, health monitoring, and audit logging',
  baseUrl: '/api',
  tools: [
    // Tool 1: Health Check
    {
      name: 'getHealthStatus',
      endpoint: '/api/mcp/healthz',
      method: 'GET',
      description: 'Get system health status including SLO/SLI metrics, component status, and uptime',
      returns: 'Health status object with components, metrics, and overall status',
      example: {
        response: {
          status: 'healthy',
          components: { database: 'healthy', cache: 'healthy', tower: 'healthy' },
          uptime: 99.9,
        },
      },
    },
    // Tool 2: Logs/Tail
    {
      name: 'getLogs',
      endpoint: '/api/mcp/tail',
      method: 'GET',
      description: 'Retrieve recent MCP operation logs for debugging and audit',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          required: false,
          default: 50,
          description: 'Number of log entries to return',
        },
        {
          name: 'level',
          type: 'string',
          required: false,
          default: 'all',
          description: 'Filter by log level',
          enum: ['error', 'warn', 'info', 'debug', 'all'],
        },
      ],
      returns: 'Array of log entries with timestamp, level, and message',
      example: {
        request: { limit: 10, level: 'error' },
        response: {
          logs: [
            { timestamp: '2025-11-26T10:00:00Z', level: 'info', message: 'Proof generated' },
          ],
          total: 1,
        },
      },
    },
    // Tool 3: Governance KPIs
    {
      name: 'getGovernanceKPIs',
      endpoint: '/api/mcp/governance',
      method: 'GET',
      description: 'Get governance gate status and KPIs for gates G13-G21',
      returns: 'Governance snapshot with gate statuses, evidence, and KPI metrics',
      example: {
        response: {
          version: 'v1.0',
          gates: {
            G13: { name: 'Determinism & Reproducibility', status: 'pass' },
            G14: { name: 'Privacy by Design', status: 'pass' },
          },
          summary: { totalGates: 9, passed: 6, pending: 2, partial: 1 },
        },
      },
    },
    // Tool 4: Upload Proof
    {
      name: 'uploadProof',
      endpoint: '/api/tower/uploadProof',
      method: 'POST',
      description: 'Upload a factory runtime manifest for Tower verification and co-signing',
      parameters: [
        {
          name: 'manifest',
          type: 'object',
          required: true,
          description: 'Factory manifest with files, merkleRoot, signature, and kid',
        },
      ],
      returns: 'Receipt with receiptId, echoRoot, and upload status',
      example: {
        request: {
          manifest: {
            version: 'v1.0',
            files: [{ path: 'main.wasm', sha256: 'abc123...' }],
            merkleRoot: 'root123...',
            signature: 'sig123...',
            kid: 'factory-key-1',
          },
        },
        response: {
          receiptId: 'rcpt_abc123',
          echoRoot: 'root123...',
          status: 'received',
          uploadedAt: '2025-11-26T10:00:00Z',
        },
      },
    },
    // Tool 5: Verify Digest
    {
      name: 'verifyDigest',
      endpoint: '/api/tower/verifyDigest',
      method: 'POST',
      description: 'Verify R1.4.4 daily digest from audit mirror',
      parameters: [
        {
          name: 'digest',
          type: 'object',
          required: true,
          description: 'Daily digest with date, merkleRoot, recordCount, and signature',
        },
      ],
      returns: 'Verification result with digestHash and Tower signature',
      example: {
        request: {
          digest: {
            date: '2025-11-26',
            merkleRoot: 'root123...',
            recordCount: 1234,
            signature: 'sig123...',
          },
        },
        response: {
          verified: true,
          digestHash: 'hash123...',
          towerSignature: 'towersig123...',
          verifiedAt: '2025-11-26T10:00:00Z',
        },
      },
    },
    // Tool 6: Get Receipt Status
    {
      name: 'getReceiptStatus',
      endpoint: '/api/tower/ack/{receipt_id}',
      method: 'GET',
      description: 'Get verification status and details for a Tower receipt',
      parameters: [
        {
          name: 'receipt_id',
          type: 'string',
          required: true,
          description: 'The receipt ID returned from uploadProof',
        },
      ],
      returns: 'Receipt status with verification timestamp and manifest hash',
      example: {
        request: { receipt_id: 'rcpt_abc123' },
        response: {
          receiptId: 'rcpt_abc123',
          status: 'verified',
          echoRoot: 'root123...',
          uploadedAt: '2025-11-26T10:00:00Z',
          verifiedAt: '2025-11-26T10:00:05Z',
          manifestHash: 'hash123...',
        },
      },
    },
    // Tool 7: List Receipts
    {
      name: 'listReceipts',
      endpoint: '/api/tower/receipts',
      method: 'GET',
      description: 'List recent Tower receipts with optional status filter',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          required: false,
          default: 50,
          description: 'Maximum number of receipts to return',
        },
        {
          name: 'status',
          type: 'string',
          required: false,
          description: 'Filter by receipt status',
          enum: ['received', 'verified', 'rejected', 'pending'],
        },
      ],
      returns: 'Array of receipt summaries with status and timestamps',
      example: {
        request: { limit: 10, status: 'verified' },
        response: {
          receipts: [
            {
              receiptId: 'rcpt_abc123',
              status: 'verified',
              uploadedAt: '2025-11-26T10:00:00Z',
            },
          ],
          total: 1,
        },
      },
    },
    // Tool 8: Compute Merkle Root
    {
      name: 'computeMerkleRoot',
      endpoint: '/api/tower/merkle',
      method: 'POST',
      description: 'Compute Merkle root from an array of file hashes',
      parameters: [
        {
          name: 'hashes',
          type: 'array',
          required: true,
          description: 'Array of SHA-256 file hashes',
        },
      ],
      returns: 'Computed Merkle root hash',
      example: {
        request: {
          hashes: ['abc123...', 'def456...', 'ghi789...'],
        },
        response: {
          merkleRoot: 'root123...',
          leafCount: 3,
        },
      },
    },
    // Tool 9: Get Key Rotation Status
    {
      name: 'getKeyRotationStatus',
      endpoint: '/api/mcp/keys',
      method: 'GET',
      description: 'Get current key rotation status and upcoming rotation deadlines',
      returns: 'Key registry status with rotation urgency and deadlines',
      example: {
        response: {
          activeKeys: 3,
          needsRotation: 1,
          critical: 0,
          minDaysUntilRotation: 15,
          keys: [
            {
              kid: 'tower-key-1',
              algorithm: 'Ed25519',
              createdAt: '2025-10-01T00:00:00Z',
              expiresAt: '2026-01-01T00:00:00Z',
              urgency: 'normal',
            },
          ],
        },
      },
    },
    // Tool 10: Get Anti-Replay Stats
    {
      name: 'getAntiReplayStats',
      endpoint: '/api/mcp/nonce',
      method: 'GET',
      description: 'Get anti-replay nonce store statistics and replay detection metrics',
      returns: 'Nonce store stats with active/expired counts and replay rate',
      example: {
        response: {
          activeNonces: 150,
          expiredNonces: 1200,
          replayRate: 0,
          byContext: {
            tower: 100,
            federation: 50,
          },
        },
      },
    },
  ],
  metadata: {
    generatedAt: new Date().toISOString(),
    toolCount: 10,
  },
};

export async function GET() {
  // Update generated timestamp on each request
  const response = {
    ...manifest,
    metadata: {
      ...manifest.metadata,
      generatedAt: new Date().toISOString(),
    },
  };

  return NextResponse.json(response);
}
