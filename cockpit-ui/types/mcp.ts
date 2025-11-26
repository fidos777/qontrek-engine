// types/mcp.ts

export interface MCPTenant {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MCPPipelineSummary {
  totalRecoverable: number;
  totalStuck: number;
  totalLeads: number;
  currency: string;
}

export interface MCPLead {
  id: string;
  tenantId: string;
  source: string;
  stage: 'new' | 'warming' | 'hot' | 'closed-won' | 'closed-lost';
  value: number;
  currency: string;
  createdAt: string;
}

export interface MCPProof {
  id: string;
  digest: string;
  generatedAt: string;
  validUntil?: string;
}

export interface MCPTowerAck {
  acknowledged: boolean;
  receiptId: string;
  acknowledgedAt: string;
}

export interface MCPProofRefreshResponse {
  proof: MCPProof;
  tower: MCPTowerAck;
}

export interface MCPManifestTool {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    enum?: string[];
    default?: string | number | boolean;
  }>;
  returns: string;
}
