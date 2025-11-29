/**
 * Governance Module
 *
 * Centralized exports for governance enforcement in MCP tools.
 *
 * @module lib/governance
 */

// Middleware exports
export {
  enforceGovernance,
  extractActorIdentity,
  withGovernanceAudit,
  createGovernanceErrorResponse,
  generateRequestId,
  emitLedgerEvent,
  getLedgerEvents,
  type ActorIdentity,
  type GovernanceContext,
  type GovernanceCheckResult,
  type LedgerEvent,
} from './middleware';

// Schema exports
export {
  // Response schemas
  MCPResponseEnvelopeSchema,
  MCPErrorResponseSchema,
  GovernanceResponseSchema,
  HealthzResponseSchema,
  TailResponseSchema,
  UploadProofResponseSchema,
  VerifyDigestResponseSchema,
  AckReceiptResponseSchema,
  // Request schemas
  TailRequestQuerySchema,
  UploadProofRequestSchema,
  VerifyDigestRequestSchema,
  AckReceiptParamsSchema,
  // Vertical archetype
  VerticalArchetypeSchema,
  TOOL_VERTICAL_MAP,
  isVerticalAllowed,
  // Utilities
  validateRequest,
  createResponseEnvelope,
  type VerticalArchetype,
} from './schemas';

// Ledger exports
export {
  appendToLedger,
  queryLedger,
  getLedgerStats,
  emitStateMutation,
  verifyStateIntegrity,
  generateEventId,
  computeStateChecksum,
  closeLedger,
  type LedgerEventType,
  type BaseLedgerEvent,
  type StateMutationEvent,
} from './ledger';
