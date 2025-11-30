// ============================================
// L9 LEDGER - PROOF INFRASTRUCTURE
// Purpose: Immutable audit trail for Tower verification
// Every data mutation must be logged here
// ============================================

import { z } from 'zod';

// ============================================
// LEDGER ENTRY TYPES
// ============================================

export type LedgerEntryType = 
  | 'UPLOAD_INITIATED'      // File upload started
  | 'UPLOAD_RECEIVED'       // File received and validated
  | 'PARSE_STARTED'         // Excel parsing began
  | 'PARSE_COMPLETED'       // Excel parsing finished
  | 'MAPPING_APPLIED'       // Field mapping executed
  | 'VALIDATION_RUN'        // Row validation completed
  | 'NORMALIZATION_RUN'     // Data normalization completed
  | 'RECORD_INSERTED'       // Single record inserted
  | 'RECORD_UPDATED'        // Single record updated
  | 'RECORD_FAILED'         // Single record failed
  | 'BATCH_COMMITTED'       // Batch of records committed
  | 'WORKFLOW_COMPLETED'    // Full workflow finished
  | 'WORKFLOW_FAILED'       // Workflow failed
  | 'PROOF_GENERATED'       // Proof digest created
  | 'TOWER_ACK'             // Tower acknowledged receipt
  | 'DATA_ACCESS'           // Data was read/queried
  | 'ACTION_LOGGED'         // Recovery action logged
  | 'EXPORT_GENERATED';     // Data export created

export type LedgerSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// ============================================
// LEDGER ENTRY SCHEMA
// ============================================

export const LedgerEntrySchema = z.object({
  // Identity
  id: z.string().uuid(),
  entry_type: z.string(),
  severity: z.enum(['INFO', 'WARN', 'ERROR', 'CRITICAL']),
  
  // Temporal
  timestamp: z.string().datetime(),
  sequence_no: z.number().int().positive(),
  
  // Context
  tenant_id: z.string(),
  vertical: z.string(),
  workflow_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  step_id: z.string().optional(),
  
  // Actor
  actor: z.object({
    type: z.enum(['USER', 'SYSTEM', 'WORKFLOW', 'API', 'TOWER']),
    id: z.string(),
    name: z.string().optional(),
    ip_address: z.string().optional(),
  }),
  
  // Subject (what was affected)
  subject: z.object({
    type: z.enum(['FILE', 'RECORD', 'BATCH', 'WORKFLOW', 'PROOF', 'QUERY']),
    id: z.string(),
    name: z.string().optional(),
    table: z.string().optional(),
  }).optional(),
  
  // Payload (operation-specific data)
  payload: z.record(z.unknown()),
  
  // Integrity
  checksum: z.string(), // SHA-256 of payload
  previous_hash: z.string(), // Hash of previous entry (chain)
  
  // Governance
  gates_affected: z.array(z.string()).optional(), // e.g., ['G13', 'G14']
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ============================================
// LEDGER SERVICE
// ============================================

import crypto from 'crypto';

class LedgerService {
  private entries: LedgerEntry[] = [];
  private sequenceNo: number = 0;
  private lastHash: string = '0'.repeat(64); // Genesis hash
  
  private tenantId: string;
  private vertical: string;
  
  constructor(tenantId: string = 'voltek', vertical: string = 'solar') {
    this.tenantId = tenantId;
    this.vertical = vertical;
  }
  
  /**
   * Generate SHA-256 hash of payload
   */
  private generateChecksum(payload: Record<string, unknown>): string {
    const data = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Generate chain hash linking to previous entry
   */
  private generateChainHash(entry: Omit<LedgerEntry, 'previous_hash'>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      checksum: entry.checksum,
      previous: this.lastHash,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Create a new ledger entry
   */
  async log(
    entryType: LedgerEntryType,
    actor: LedgerEntry['actor'],
    payload: Record<string, unknown>,
    options: {
      severity?: LedgerSeverity;
      workflowId?: string;
      jobId?: string;
      stepId?: string;
      subject?: LedgerEntry['subject'];
      gatesAffected?: string[];
    } = {}
  ): Promise<LedgerEntry> {
    this.sequenceNo++;
    
    const checksum = this.generateChecksum(payload);
    
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      entry_type: entryType,
      severity: options.severity || 'INFO',
      timestamp: new Date().toISOString(),
      sequence_no: this.sequenceNo,
      tenant_id: this.tenantId,
      vertical: this.vertical,
      workflow_id: options.workflowId,
      job_id: options.jobId,
      step_id: options.stepId,
      actor,
      subject: options.subject,
      payload,
      checksum,
      previous_hash: this.lastHash,
      gates_affected: options.gatesAffected,
    };
    
    // Update chain
    this.lastHash = this.generateChainHash(entry);
    this.entries.push(entry);
    
    // In production: persist to Supabase
    await this.persist(entry);
    
    return entry;
  }
  
  /**
   * Persist entry to storage (Supabase in production)
   */
  private async persist(entry: LedgerEntry): Promise<void> {
    // TODO: Insert into supabase.ledger_entries table
    // For now, log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[LEDGER]', entry.entry_type, entry.subject?.id || '', entry.payload);
    }
  }
  
  /**
   * Get entries for a workflow
   */
  getWorkflowEntries(workflowId: string): LedgerEntry[] {
    return this.entries.filter(e => e.workflow_id === workflowId);
  }
  
  /**
   * Get entries for a job
   */
  getJobEntries(jobId: string): LedgerEntry[] {
    return this.entries.filter(e => e.job_id === jobId);
  }
  
  /**
   * Verify chain integrity
   */
  verifyChain(): { valid: boolean; brokenAt?: number } {
    let previousHash = '0'.repeat(64);
    
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      
      if (entry.previous_hash !== previousHash) {
        return { valid: false, brokenAt: i };
      }
      
      // Recalculate checksum
      const expectedChecksum = this.generateChecksum(entry.payload);
      if (entry.checksum !== expectedChecksum) {
        return { valid: false, brokenAt: i };
      }
      
      previousHash = this.generateChainHash(entry);
    }
    
    return { valid: true };
  }
  
  /**
   * Generate proof digest for Tower
   */
  generateProofDigest(jobId: string): ProofDigest {
    const entries = this.getJobEntries(jobId);
    
    if (entries.length === 0) {
      throw new Error(`No ledger entries found for job ${jobId}`);
    }
    
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    
    // Collect all checksums
    const checksums = entries.map(e => e.checksum);
    const merkleRoot = this.generateMerkleRoot(checksums);
    
    return {
      job_id: jobId,
      workflow_id: firstEntry.workflow_id!,
      tenant_id: this.tenantId,
      vertical: this.vertical,
      started_at: firstEntry.timestamp,
      completed_at: lastEntry.timestamp,
      entry_count: entries.length,
      first_sequence: firstEntry.sequence_no,
      last_sequence: lastEntry.sequence_no,
      merkle_root: merkleRoot,
      chain_valid: this.verifyChain().valid,
      summary: this.generateJobSummary(entries),
    };
  }
  
  /**
   * Generate Merkle root from checksums
   */
  private generateMerkleRoot(checksums: string[]): string {
    if (checksums.length === 0) return '0'.repeat(64);
    if (checksums.length === 1) return checksums[0];
    
    const combined = checksums.join('');
    return crypto.createHash('sha256').update(combined).digest('hex');
  }
  
  /**
   * Generate summary of job execution
   */
  private generateJobSummary(entries: LedgerEntry[]): JobSummary {
    const summary: JobSummary = {
      records_processed: 0,
      records_inserted: 0,
      records_updated: 0,
      records_failed: 0,
      warnings: 0,
      errors: 0,
    };
    
    for (const entry of entries) {
      if (entry.entry_type === 'RECORD_INSERTED') summary.records_inserted++;
      if (entry.entry_type === 'RECORD_UPDATED') summary.records_updated++;
      if (entry.entry_type === 'RECORD_FAILED') summary.records_failed++;
      if (entry.severity === 'WARN') summary.warnings++;
      if (entry.severity === 'ERROR' || entry.severity === 'CRITICAL') summary.errors++;
    }
    
    summary.records_processed = summary.records_inserted + summary.records_updated + summary.records_failed;
    
    return summary;
  }
}

// ============================================
// PROOF DIGEST (sent to Tower)
// ============================================

export interface ProofDigest {
  job_id: string;
  workflow_id: string;
  tenant_id: string;
  vertical: string;
  started_at: string;
  completed_at: string;
  entry_count: number;
  first_sequence: number;
  last_sequence: number;
  merkle_root: string;
  chain_valid: boolean;
  summary: JobSummary;
}

export interface JobSummary {
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  warnings: number;
  errors: number;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let ledgerInstance: LedgerService | null = null;

export function getLedger(tenantId?: string, vertical?: string): LedgerService {
  if (!ledgerInstance) {
    ledgerInstance = new LedgerService(tenantId, vertical);
  }
  return ledgerInstance;
}

export function resetLedger(): void {
  ledgerInstance = null;
}

// ============================================
// CONVENIENCE LOGGING FUNCTIONS
// ============================================

const SYSTEM_ACTOR: LedgerEntry['actor'] = {
  type: 'SYSTEM',
  id: 'qontrek-engine',
  name: 'Qontrek Engine',
};

/**
 * Log upload initiated
 */
export async function logUploadInitiated(
  userId: string,
  userName: string,
  fileName: string,
  fileSize: number,
  workflowId: string,
  jobId: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'UPLOAD_INITIATED',
    { type: 'USER', id: userId, name: userName },
    { file_name: fileName, file_size: fileSize, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    {
      workflowId,
      jobId,
      subject: { type: 'FILE', id: jobId, name: fileName },
      gatesAffected: ['G13', 'G16'],
    }
  );
}

/**
 * Log file received and validated
 */
export async function logUploadReceived(
  jobId: string,
  workflowId: string,
  fileHash: string,
  rowCount: number
): Promise<LedgerEntry> {
  return getLedger().log(
    'UPLOAD_RECEIVED',
    SYSTEM_ACTOR,
    { file_hash: fileHash, row_count: rowCount, validation_passed: true },
    {
      workflowId,
      jobId,
      stepId: 'receive_file',
      gatesAffected: ['G13', 'G14'],
    }
  );
}

/**
 * Log parsing started
 */
export async function logParseStarted(
  jobId: string,
  workflowId: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'PARSE_STARTED',
    SYSTEM_ACTOR,
    { parser: 'xlsx', started_at: new Date().toISOString() },
    { workflowId, jobId, stepId: 'parse_excel' }
  );
}

/**
 * Log parsing completed
 */
export async function logParseCompleted(
  jobId: string,
  workflowId: string,
  rowCount: number,
  columnCount: number,
  headers: string[]
): Promise<LedgerEntry> {
  return getLedger().log(
    'PARSE_COMPLETED',
    SYSTEM_ACTOR,
    { row_count: rowCount, column_count: columnCount, headers, completed_at: new Date().toISOString() },
    {
      workflowId,
      jobId,
      stepId: 'parse_excel',
      gatesAffected: ['G14'],
    }
  );
}

/**
 * Log field mapping applied
 */
export async function logMappingApplied(
  jobId: string,
  workflowId: string,
  mappingVersion: string,
  fieldsMatched: number,
  fieldsUnmapped: string[]
): Promise<LedgerEntry> {
  return getLedger().log(
    'MAPPING_APPLIED',
    SYSTEM_ACTOR,
    { mapping_version: mappingVersion, fields_matched: fieldsMatched, fields_unmapped: fieldsUnmapped },
    {
      workflowId,
      jobId,
      stepId: 'map_fields',
      severity: fieldsUnmapped.length > 0 ? 'WARN' : 'INFO',
      gatesAffected: ['G14', 'G15'],
    }
  );
}

/**
 * Log validation run
 */
export async function logValidationRun(
  jobId: string,
  workflowId: string,
  totalRows: number,
  validRows: number,
  invalidRows: number,
  errors: Array<{ row: number; field: string; message: string }>
): Promise<LedgerEntry> {
  return getLedger().log(
    'VALIDATION_RUN',
    SYSTEM_ACTOR,
    {
      total_rows: totalRows,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      error_count: errors.length,
      errors: errors.slice(0, 100), // Limit to first 100 errors
    },
    {
      workflowId,
      jobId,
      stepId: 'validate_rows',
      severity: invalidRows > 0 ? 'WARN' : 'INFO',
      gatesAffected: ['G14', 'G15'],
    }
  );
}

/**
 * Log normalization run
 */
export async function logNormalizationRun(
  jobId: string,
  workflowId: string,
  transformsApplied: string[],
  recordsTransformed: number
): Promise<LedgerEntry> {
  return getLedger().log(
    'NORMALIZATION_RUN',
    SYSTEM_ACTOR,
    { transforms_applied: transformsApplied, records_transformed: recordsTransformed },
    {
      workflowId,
      jobId,
      stepId: 'normalize_data',
      gatesAffected: ['G15'],
    }
  );
}

/**
 * Log single record inserted
 */
export async function logRecordInserted(
  jobId: string,
  workflowId: string,
  recordId: string,
  projectNo: string,
  table: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'RECORD_INSERTED',
    SYSTEM_ACTOR,
    { record_id: recordId, project_no: projectNo },
    {
      workflowId,
      jobId,
      stepId: 'store_records',
      subject: { type: 'RECORD', id: recordId, name: projectNo, table },
      gatesAffected: ['G13', 'G18'],
    }
  );
}

/**
 * Log single record updated
 */
export async function logRecordUpdated(
  jobId: string,
  workflowId: string,
  recordId: string,
  projectNo: string,
  table: string,
  changedFields: string[]
): Promise<LedgerEntry> {
  return getLedger().log(
    'RECORD_UPDATED',
    SYSTEM_ACTOR,
    { record_id: recordId, project_no: projectNo, changed_fields: changedFields },
    {
      workflowId,
      jobId,
      stepId: 'store_records',
      subject: { type: 'RECORD', id: recordId, name: projectNo, table },
      gatesAffected: ['G13', 'G18'],
    }
  );
}

/**
 * Log single record failed
 */
export async function logRecordFailed(
  jobId: string,
  workflowId: string,
  rowNumber: number,
  projectNo: string,
  error: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'RECORD_FAILED',
    SYSTEM_ACTOR,
    { row_number: rowNumber, project_no: projectNo, error },
    {
      workflowId,
      jobId,
      stepId: 'store_records',
      severity: 'ERROR',
      gatesAffected: ['G15'],
    }
  );
}

/**
 * Log batch committed
 */
export async function logBatchCommitted(
  jobId: string,
  workflowId: string,
  batchNumber: number,
  recordCount: number
): Promise<LedgerEntry> {
  return getLedger().log(
    'BATCH_COMMITTED',
    SYSTEM_ACTOR,
    { batch_number: batchNumber, record_count: recordCount, committed_at: new Date().toISOString() },
    {
      workflowId,
      jobId,
      stepId: 'store_records',
      subject: { type: 'BATCH', id: `batch-${batchNumber}` },
      gatesAffected: ['G13', 'G18'],
    }
  );
}

/**
 * Log workflow completed
 */
export async function logWorkflowCompleted(
  jobId: string,
  workflowId: string,
  summary: JobSummary,
  totalPipelineValue: number
): Promise<LedgerEntry> {
  return getLedger().log(
    'WORKFLOW_COMPLETED',
    SYSTEM_ACTOR,
    {
      ...summary,
      total_pipeline_value: totalPipelineValue,
      completed_at: new Date().toISOString(),
    },
    {
      workflowId,
      jobId,
      subject: { type: 'WORKFLOW', id: workflowId },
      gatesAffected: ['G13', 'G14', 'G15', 'G18'],
    }
  );
}

/**
 * Log workflow failed
 */
export async function logWorkflowFailed(
  jobId: string,
  workflowId: string,
  stepId: string,
  error: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'WORKFLOW_FAILED',
    SYSTEM_ACTOR,
    { failed_at_step: stepId, error, failed_at: new Date().toISOString() },
    {
      workflowId,
      jobId,
      stepId,
      severity: 'CRITICAL',
      subject: { type: 'WORKFLOW', id: workflowId },
      gatesAffected: ['G13', 'G17'],
    }
  );
}

/**
 * Log proof generated
 */
export async function logProofGenerated(
  jobId: string,
  workflowId: string,
  proofDigest: ProofDigest
): Promise<LedgerEntry> {
  return getLedger().log(
    'PROOF_GENERATED',
    SYSTEM_ACTOR,
    {
      merkle_root: proofDigest.merkle_root,
      entry_count: proofDigest.entry_count,
      chain_valid: proofDigest.chain_valid,
    },
    {
      workflowId,
      jobId,
      subject: { type: 'PROOF', id: proofDigest.merkle_root },
      gatesAffected: ['G14', 'G18'],
    }
  );
}

/**
 * Log Tower acknowledgment
 */
export async function logTowerAck(
  jobId: string,
  workflowId: string,
  ackId: string,
  towerTimestamp: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'TOWER_ACK',
    { type: 'TOWER', id: 'tower-federation', name: 'Tower Federation' },
    { ack_id: ackId, tower_timestamp: towerTimestamp, latency_ms: Date.now() - new Date(towerTimestamp).getTime() },
    {
      workflowId,
      jobId,
      gatesAffected: ['G14', 'G18'],
    }
  );
}

/**
 * Log data access (query)
 */
export async function logDataAccess(
  userId: string,
  userName: string,
  queryType: string,
  params: Record<string, unknown>
): Promise<LedgerEntry> {
  return getLedger().log(
    'DATA_ACCESS',
    { type: 'USER', id: userId, name: userName },
    { query_type: queryType, params },
    { gatesAffected: ['G18'] }
  );
}

/**
 * Log recovery action
 */
export async function logRecoveryAction(
  userId: string,
  userName: string,
  projectId: string,
  projectNo: string,
  actionType: string,
  result: string
): Promise<LedgerEntry> {
  return getLedger().log(
    'ACTION_LOGGED',
    { type: 'USER', id: userId, name: userName },
    { action_type: actionType, result, performed_at: new Date().toISOString() },
    {
      subject: { type: 'RECORD', id: projectId, name: projectNo, table: 'solar_recovery_actions' },
      gatesAffected: ['G13', 'G18'],
    }
  );
}

export default {
  getLedger,
  resetLedger,
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
};
