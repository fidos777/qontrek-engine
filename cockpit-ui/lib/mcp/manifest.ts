/**
 * MCP (Model Context Protocol) Manifest
 *
 * Defines available MCP tools and their schemas.
 * Used for AI model integration and API documentation.
 */

export interface MCPTool {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  parameters?: Record<string, MCPParameter>;
  response: MCPResponseSchema;
}

export interface MCPParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

export interface MCPResponseSchema {
  type: 'object';
  properties: Record<string, unknown>;
}

/**
 * MCP Manifest v1.0
 *
 * All available MCP endpoints for AI model integration
 */
export const MCP_MANIFEST: {
  version: string;
  tools: MCPTool[];
} = {
  version: '1.0',
  tools: [
    // =========================================================================
    // Governance Endpoints
    // =========================================================================
    {
      name: 'getGovernanceSnapshot',
      description: 'Returns governance KPI snapshot for G13-G21 gates including status, evidence, and metrics.',
      endpoint: '/api/mcp/governance',
      method: 'GET',
      response: {
        type: 'object',
        properties: {
          version: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          gates: { type: 'object' },
          summary: {
            type: 'object',
            properties: {
              totalGates: { type: 'number' },
              passed: { type: 'number' },
              pending: { type: 'number' },
              partial: { type: 'number' },
              failed: { type: 'number' },
            },
          },
        },
      },
    },

    // =========================================================================
    // Health & Monitoring Endpoints
    // =========================================================================
    {
      name: 'getHealthMetrics',
      description: 'Returns health check endpoint with SLO/SLI metrics including latency, error rate, coverage, and key rotation status.',
      endpoint: '/api/mcp/healthz',
      method: 'GET',
      response: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          slo: { type: 'object' },
          keyRotation: { type: 'object' },
          antiReplay: { type: 'object' },
          receiptMetrics: { type: 'object' },
        },
      },
    },
    {
      name: 'tailLogs',
      description: 'Log tail endpoint with rate limiting and optional filtering. Returns recent log entries.',
      endpoint: '/api/mcp/tail',
      method: 'GET',
      parameters: {
        filter: {
          type: 'string',
          description: 'Optional regex filter for log lines',
          required: false,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to return (max 1000)',
          required: false,
          default: 100,
        },
      },
      response: {
        type: 'object',
        properties: {
          lines: { type: 'array' },
          count: { type: 'number' },
          rateLimit: { type: 'object' },
        },
      },
    },

    // =========================================================================
    // Pattern Recommendations Endpoints (Phase 3.2)
    // =========================================================================
    {
      name: 'listPatternRecommendations',
      description: 'Analyzes pattern_aggregate data to generate actionable recommendations. Includes performance benchmarking, outlier detection, trend analysis, and gate-specific optimization suggestions. Privacy-safe with k-anonymity guarantees.',
      endpoint: '/api/mcp/patterns/recommendations',
      method: 'GET',
      parameters: {
        gateId: {
          type: 'string',
          description: 'Filter by gate ID (e.g., "G0", "G2", "CFO")',
          required: false,
          enum: ['G0', 'G1', 'G2', 'CFO'],
        },
        priority: {
          type: 'string',
          description: 'Filter by recommendation priority',
          required: false,
          enum: ['critical', 'high', 'medium', 'low', 'info'],
        },
        category: {
          type: 'string',
          description: 'Filter by recommendation category',
          required: false,
          enum: ['performance', 'outlier', 'trend', 'gate_optimization', 'privacy', 'compliance'],
        },
        limit: {
          type: 'number',
          description: 'Maximum recommendations to return',
          required: false,
          default: 50,
        },
        demo: {
          type: 'boolean',
          description: 'Use demo data for testing (set to "true" for demo mode)',
          required: false,
          default: false,
        },
      },
      response: {
        type: 'object',
        properties: {
          version: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                category: { type: 'string' },
                priority: { type: 'string' },
                gateId: { type: 'string' },
                metricName: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                impact: { type: 'string' },
                action: { type: 'string' },
                evidence: { type: 'object' },
              },
            },
          },
          summary: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              byPriority: { type: 'object' },
              byCategory: { type: 'object' },
              byGate: { type: 'object' },
            },
          },
          privacy: {
            type: 'object',
            properties: {
              kAnonymityMet: { type: 'boolean' },
              minTenants: { type: 'number' },
            },
          },
        },
      },
    },
    {
      name: 'generatePatternRecommendations',
      description: 'Generate recommendations for provided pattern aggregates. Useful for real-time analysis without database storage. Input aggregates are scrubbed for privacy before processing.',
      endpoint: '/api/mcp/patterns/recommendations',
      method: 'POST',
      parameters: {
        aggregates: {
          type: 'array',
          description: 'Array of PatternAggregate objects to analyze',
          required: true,
        },
        trendData: {
          type: 'object',
          description: 'Optional trend data keyed by "{gateId}_{metricName}"',
          required: false,
        },
        customBenchmarks: {
          type: 'array',
          description: 'Optional custom benchmarks to use instead of defaults',
          required: false,
        },
      },
      response: {
        type: 'object',
        properties: {
          version: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          recommendations: { type: 'array' },
          summary: { type: 'object' },
          privacy: { type: 'object' },
        },
      },
    },
  ],
};

/**
 * Get MCP tool by name
 */
export function getMCPTool(name: string): MCPTool | undefined {
  return MCP_MANIFEST.tools.find((tool) => tool.name === name);
}

/**
 * Get all MCP tools for a specific endpoint prefix
 */
export function getMCPToolsByEndpoint(prefix: string): MCPTool[] {
  return MCP_MANIFEST.tools.filter((tool) => tool.endpoint.startsWith(prefix));
}

/**
 * Export manifest as JSON for external consumption
 */
export function exportManifest(): string {
  return JSON.stringify(MCP_MANIFEST, null, 2);
}
