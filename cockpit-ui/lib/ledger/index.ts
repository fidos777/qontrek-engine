// ============================================
// L9 LEDGER - INDEX
// Exports all ledger functionality
// ============================================

export {
  // Types
  type LedgerEntry,
  type LedgerEntryType,
  type LedgerSeverity,
  type ProofDigest,
  type JobSummary,
  LedgerEntrySchema,
  
  // Service
  getLedger,
  resetLedger,
  
  // Convenience logging functions
  logUploadInitiated,
  logUploadReceived,
  logParseStarted,
  logParseCompleted,
  logMappingApplied,
  logValidationRun,
  logNormalizationRun,
  logRecordInserted,
  logRecordUpdated,
  logRecordFailed,
  logBatchCommitted,
  logWorkflowCompleted,
  logWorkflowFailed,
  logProofGenerated,
  logTowerAck,
  logDataAccess,
  logRecoveryAction,
} from './proof-ledger';
