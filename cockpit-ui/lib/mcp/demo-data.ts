// lib/mcp/demo-data.ts

import type {
  MCPTenant,
  MCPPipelineSummary,
  MCPLead,
  MCPProof,
  MCPProofRefreshResponse,
} from '@/types/mcp';

export const demoTenants: MCPTenant[] = [
  {
    id: 'tenant-voltek',
    name: 'Voltek Solar Engineering',
    industry: 'Energy',
    status: 'active',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'tenant-demo-sme',
    name: 'Demo SME Manufacturing',
    industry: 'Manufacturing',
    status: 'active',
    createdAt: '2024-03-01T10:30:00.000Z',
  },
];

export const demoPipelineSummary: MCPPipelineSummary = {
  totalRecoverable: 420000, // used by test: should be > 0
  totalStuck: 58000,
  totalLeads: 37,
  currency: 'MYR',
};

export const demoLeads: MCPLead[] = [
  {
    id: 'lead-001',
    tenantId: 'tenant-voltek',
    source: 'whatsapp',
    stage: 'hot',
    value: 75000,
    currency: 'MYR',
    createdAt: '2024-05-10T12:00:00.000Z',
  },
  {
    id: 'lead-002',
    tenantId: 'tenant-demo-sme',
    source: 'website',
    stage: 'warming',
    value: 120000,
    currency: 'MYR',
    createdAt: '2024-06-01T08:30:00.000Z',
  },
];

export const demoProof: MCPProof = {
  id: 'proof-demo-001',
  digest: '0xDEMO_MERKLE_DIGEST_001',
  generatedAt: '2025-01-01T00:00:00.000Z',
  validUntil: '2025-01-02T00:00:00.000Z',
};

export function createProofRefreshResponse(): MCPProofRefreshResponse {
  const now = new Date().toISOString();
  return {
    proof: {
      ...demoProof,
      generatedAt: now,
    },
    tower: {
      acknowledged: true,
      receiptId: `receipt-${Date.now()}`,
      acknowledgedAt: now,
    },
  };
}
