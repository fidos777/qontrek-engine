/**
 * MCP Tool Fabric - Main Export
 *
 * Qontrek OS Layer 2 - MCP Tool Fabric
 * Enterprise governance and sales operations tools.
 */

// Schemas
export * from './schemas';

// Types
export * from './types';

// Governance
export {
  createGovernanceContext,
  buildEnvelope,
  successEnvelope,
  errorEnvelope,
  logMCPInvocation,
  createLogEntry,
  emitToolLineageProof,
  extractTenantFromJWT,
  getDefaultTenant,
  validateTenantAccess,
  withGovernance,
  generateRequestId,
  hashPayload,
  ErrorCodes,
} from './governance';

export type { GovernanceContext, MCPLogEntry } from './governance';

// Tool manifest
import toolsManifest from './tools.json';
export { toolsManifest };

/**
 * Get tool definition by name
 */
export function getToolDefinition(toolName: string) {
  return toolsManifest.tools.find(t => t.name === toolName);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return toolsManifest.tools.map(t => t.name);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string) {
  return toolsManifest.tools.filter(t => t.category === category);
}
