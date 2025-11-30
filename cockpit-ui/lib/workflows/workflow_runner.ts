// ============================================
// WORKFLOW RUNNER WITH L9 LEDGER INTEGRATION
// Layer: L8 (Workflow Engine)
// Purpose: Execute workflows with full audit trail
// ============================================

import { v4 as uuidv4 } from 'uuid';
import {
  getLedger,
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
  type ProofDigest,
} from '../ledger/proof-ledger';

import {
  SOLAR_INGESTION_WORKFLOW,
  FIELD_MAPPING,
  SolarProjectRowSchema,
  type WorkflowJob,
  type WorkflowOutput,
  type WorkflowError,
} from './solar_ingestion';

import {
  cleanCurrency,
  parseDate,
  standardizeStatus,
  extractState,
  calculateBalance,
  normalizeRow,
  type NormalizedProjectRow,
} from './pipeline_normalizer';

// ============================================
// WORKFLOW CONTEXT
// ============================================

interface WorkflowContext {
  jobId: string;
  workflowId: string;
  tenantId: string;
  vertical: string;
  userId: string;
  userName: string;
}

interface ParsedExcelData {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
}

interface ValidationResult {
  valid: NormalizedProjectRow[];
  invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: Array<{ field: string; message: string }>;
  }>;
}

// ============================================
// WORKFLOW RUNNER CLASS
// ============================================

export class SolarIngestionRunner {
  private context: WorkflowContext;
  private job: WorkflowJob;
  private errors: WorkflowError[] = [];
  
  constructor(
    userId: string,
    userName: string,
    tenantId: string = 'voltek',
    vertical: string = 'solar'
  ) {
    const jobId = uuidv4();
    const workflowId = SOLAR_INGESTION_WORKFLOW.id;
    
    this.context = {
      jobId,
      workflowId,
      tenantId,
      vertical,
      userId,
      userName,
    };
    
    this.job = {
      id: jobId,
      workflow_id: workflowId,
      status: 'pending',
      current_step: '',
      progress: 0,
      started_at: new Date().toISOString(),
      input: {
        file_name: '',
        file_size: 0,
        uploaded_by: userId,
      },
    };
  }
  
  /**
   * Execute the full ingestion workflow
   */
  async execute(
    file: File | Buffer,
    fileName: string,
    fileSize: number
  ): Promise<WorkflowOutput> {
    const { jobId, workflowId, userId, userName } = this.context;
    
    this.job.input.file_name = fileName;
    this.job.input.file_size = fileSize;
    this.job.status = 'running';
    
    try {
      // Step 1: Log upload initiated
      await this.updateStep('receive_file', 5);
      await logUploadInitiated(userId, userName, fileName, fileSize, workflowId, jobId);
      
      // Step 2: Validate and hash file
      const fileHash = await this.hashFile(file);
      await logUploadReceived(jobId, workflowId, fileHash, 0);
      
      // Step 3: Parse Excel
      await this.updateStep('parse_excel', 15);
      await logParseStarted(jobId, workflowId);
      const parsed = await this.parseExcel(file);
      await logParseCompleted(jobId, workflowId, parsed.rowCount, parsed.columnCount, parsed.headers);
      
      // Step 4: Map fields
      await this.updateStep('map_fields', 30);
      const { mapped, unmapped } = this.mapFields(parsed.rows);
      await logMappingApplied(jobId, workflowId, '1.0.0', Object.keys(FIELD_MAPPING).length, unmapped);
      
      // Step 5: Validate rows
      await this.updateStep('validate_rows', 45);
      const validation = await this.validateRows(mapped);
      const validationErrors = validation.invalid.flatMap(inv => 
        inv.errors.map(e => ({ row: inv.row, field: e.field, message: e.message }))
      );
      await logValidationRun(
        jobId, 
        workflowId, 
        mapped.length, 
        validation.valid.length, 
        validation.invalid.length,
        validationErrors
      );
      
      // Step 6: Normalize data
      await this.updateStep('normalize_data', 60);
      const normalized = validation.valid;
      await logNormalizationRun(jobId, workflowId, [
        'cleanCurrency',
        'parseDates',
        'standardizeStatus',
        'extractState',
        'calculateBalance',
      ], normalized.length);
      
      // Step 7: Store records
      await this.updateStep('store_records', 70);
      const storeResult = await this.storeRecords(normalized);
      
      // Step 8: Generate proof
      await this.updateStep('emit_completion', 95);
      const proofDigest = getLedger().generateProofDigest(jobId);
      await logProofGenerated(jobId, workflowId, proofDigest);
      
      // Step 9: Complete workflow
      const output: WorkflowOutput = {
        records_processed: validation.valid.length + validation.invalid.length,
        records_inserted: storeResult.inserted,
        records_updated: storeResult.updated,
        records_failed: storeResult.failed + validation.invalid.length,
        validation_errors: validationErrors.length,
        total_pipeline_value: storeResult.totalPipelineValue,
        execution_time_ms: Date.now() - new Date(this.job.started_at).getTime(),
      };
      
      await logWorkflowCompleted(jobId, workflowId, {
        records_processed: output.records_processed,
        records_inserted: output.records_inserted,
        records_updated: output.records_updated,
        records_failed: output.records_failed,
        warnings: validationErrors.length,
        errors: storeResult.failed,
      }, output.total_pipeline_value);
      
      this.job.status = 'completed';
      this.job.completed_at = new Date().toISOString();
      this.job.output = output;
      this.job.progress = 100;
      
      return output;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await logWorkflowFailed(jobId, workflowId, this.job.current_step, errorMessage);
      
      this.job.status = 'failed';
      this.job.completed_at = new Date().toISOString();
      this.errors.push({
        step_id: this.job.current_step,
        message: errorMessage,
        severity: 'error',
      });
      
      throw error;
    }
  }
  
  /**
   * Update current step and progress
   */
  private async updateStep(stepId: string, progress: number): Promise<void> {
    this.job.current_step = stepId;
    this.job.progress = progress;
    
    // In production: emit progress event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workflow.progress', {
        detail: { jobId: this.context.jobId, stepId, progress }
      }));
    }
  }
  
  /**
   * Hash file for integrity verification
   */
  private async hashFile(file: File | Buffer): Promise<string> {
    // In browser: use SubtleCrypto
    // In Node: use crypto module
    // For now, return placeholder
    return 'sha256:' + Array(64).fill('0').join('');
  }
  
  /**
   * Parse Excel file (placeholder - use xlsx library in production)
   */
  private async parseExcel(file: File | Buffer): Promise<ParsedExcelData> {
    // In production: use xlsx or exceljs library
    // For now, return mock data structure
    return {
      headers: Object.keys(FIELD_MAPPING).slice(0, 10),
      rows: [],
      rowCount: 0,
      columnCount: 10,
    };
  }
  
  /**
   * Map Excel columns to database fields
   */
  private mapFields(rows: Record<string, unknown>[]): {
    mapped: Record<string, unknown>[];
    unmapped: string[];
  } {
    const unmapped: Set<string> = new Set();
    
    const mapped = rows.map(row => {
      const mappedRow: Record<string, unknown> = {};
      
      for (const [excelCol, value] of Object.entries(row)) {
        const dbField = FIELD_MAPPING[excelCol];
        
        if (dbField) {
          mappedRow[dbField] = value;
        } else {
          unmapped.add(excelCol);
        }
      }
      
      return mappedRow;
    });
    
    return { mapped, unmapped: Array.from(unmapped) };
  }
  
  /**
   * Validate and normalize rows
   */
  private async validateRows(rows: Record<string, unknown>[]): Promise<ValidationResult> {
    const valid: NormalizedProjectRow[] = [];
    const invalid: ValidationResult['invalid'] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Normalize the row
        const normalized = normalizeRow(row);
        
        // Validate with Zod
        const result = SolarProjectRowSchema.safeParse({
          project_no: normalized.project_no,
          client_name: normalized.client_name,
          client_phone: normalized.client_phone,
          client_email: normalized.client_email,
          status: normalized.status,
          total_sales: normalized.total_sales,
          balance: normalized.balance,
          proposed_capacity_kwp: normalized.proposed_capacity_kwp,
          state: normalized.state,
        });
        
        if (result.success) {
          valid.push(normalized);
        } else {
          invalid.push({
            row: i + 2, // +2 for header row and 0-index
            data: row,
            errors: result.error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
      } catch (error) {
        invalid.push({
          row: i + 2,
          data: row,
          errors: [{ field: 'unknown', message: error instanceof Error ? error.message : 'Parse error' }],
        });
      }
    }
    
    return { valid, invalid };
  }
  
  /**
   * Store records in database (placeholder)
   */
  private async storeRecords(records: NormalizedProjectRow[]): Promise<{
    inserted: number;
    updated: number;
    failed: number;
    totalPipelineValue: number;
  }> {
    const { jobId, workflowId } = this.context;
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    let totalPipelineValue = 0;
    
    const BATCH_SIZE = 100;
    let batchNumber = 0;
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      batchNumber++;
      
      for (const record of batch) {
        try {
          // In production: upsert to Supabase
          // For now, simulate insert/update
          const isUpdate = Math.random() > 0.8; // 20% updates
          
          if (isUpdate) {
            await logRecordUpdated(
              jobId,
              workflowId,
              uuidv4(),
              record.project_no,
              'solar_projects',
              ['balance', 'status']
            );
            updated++;
          } else {
            await logRecordInserted(
              jobId,
              workflowId,
              uuidv4(),
              record.project_no,
              'solar_projects'
            );
            inserted++;
          }
          
          totalPipelineValue += record.balance;
          
        } catch (error) {
          await logRecordFailed(
            jobId,
            workflowId,
            i,
            record.project_no,
            error instanceof Error ? error.message : 'Insert failed'
          );
          failed++;
        }
      }
      
      await logBatchCommitted(jobId, workflowId, batchNumber, batch.length);
    }
    
    return { inserted, updated, failed, totalPipelineValue };
  }
  
  /**
   * Get current job status
   */
  getJob(): WorkflowJob {
    return { ...this.job, errors: this.errors };
  }
  
  /**
   * Get proof digest for this job
   */
  getProofDigest(): ProofDigest {
    return getLedger().generateProofDigest(this.context.jobId);
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createIngestionRunner(
  userId: string,
  userName: string,
  tenantId?: string
): SolarIngestionRunner {
  return new SolarIngestionRunner(userId, userName, tenantId);
}

export default SolarIngestionRunner;
