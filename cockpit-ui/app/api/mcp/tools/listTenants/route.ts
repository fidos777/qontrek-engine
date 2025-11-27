/**
 * MCP Tool: listTenants
 *
 * Lists available tenants with filtering and pagination.
 * Respects tenant_id from JWT for access control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ListTenantsInputSchema, type ListTenantsOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo tenant data
const DEMO_TENANTS = [
  {
    id: 'tenant_001',
    name: 'Acme Corporation',
    status: 'active' as const,
    created_at: '2024-01-15T10:00:00Z',
    config: { tier: 'enterprise' as const, features: ['analytics', 'workflows', 'api'] },
  },
  {
    id: 'tenant_002',
    name: 'TechStart Inc',
    status: 'active' as const,
    created_at: '2024-02-20T14:30:00Z',
    config: { tier: 'pro' as const, features: ['analytics', 'workflows'] },
  },
  {
    id: 'tenant_003',
    name: 'GlobalTrade Ltd',
    status: 'active' as const,
    created_at: '2024-03-10T09:15:00Z',
    config: { tier: 'enterprise' as const, features: ['analytics', 'workflows', 'api', 'sso'] },
  },
  {
    id: 'tenant_004',
    name: 'LocalShop Co',
    status: 'suspended' as const,
    created_at: '2024-01-05T11:00:00Z',
    config: { tier: 'free' as const, features: ['analytics'] },
  },
  {
    id: 'tenant_005',
    name: 'InnovateTech',
    status: 'pending' as const,
    created_at: '2024-06-01T08:00:00Z',
    config: { tier: 'pro' as const, features: ['analytics', 'workflows'] },
  },
];

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = ListTenantsInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, ListTenantsOutput>(
      'listTenants',
      parseResult.data,
      governance,
      async (input) => {
        const { filter, limit } = input;

        // Filter tenants based on status
        let filtered = DEMO_TENANTS;
        if (filter !== 'all') {
          filtered = DEMO_TENANTS.filter(t => t.status === filter);
        }

        // Apply limit
        const tenants = filtered.slice(0, limit);

        return {
          tenants,
          total: filtered.length,
          has_more: filtered.length > limit,
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

export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  const result = await withGovernance<{}, ListTenantsOutput>(
    'listTenants',
    { filter: 'active', limit: 50 },
    governance,
    async () => {
      const filtered = DEMO_TENANTS.filter(t => t.status === 'active');
      return {
        tenants: filtered,
        total: filtered.length,
        has_more: false,
      };
    }
  );

  return NextResponse.json(result);
}
