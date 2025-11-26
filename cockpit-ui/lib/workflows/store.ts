/**
 * Workflow Version Store
 *
 * SQLite-based persistence for workflow versions.
 * Follows the pattern established by nonceStore.ts.
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { join } from 'path';
import type {
  WorkflowVersion,
  WorkflowDefinition,
  MutationType,
} from '@/types/workflows';

let dbInstance: Database | null = null;

/**
 * Get database connection
 */
async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = join(process.cwd(), '..', 'data', 'workflow_versions.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize schema
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS workflow_versions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      definition_json TEXT NOT NULL,
      score REAL DEFAULT 0.0,
      parent_version_id TEXT,
      mutation_type TEXT CHECK (mutation_type IN ('clone', 'mutate', 'rollback', 'initial')),
      is_active INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_tenant_name_version
      ON workflow_versions(tenant_id, workflow_name, version);

    CREATE INDEX IF NOT EXISTS idx_workflow_tenant_active
      ON workflow_versions(tenant_id, workflow_name) WHERE is_active = 1;

    CREATE INDEX IF NOT EXISTS idx_workflow_score
      ON workflow_versions(tenant_id, workflow_name, score DESC);

    CREATE INDEX IF NOT EXISTS idx_workflow_parent
      ON workflow_versions(parent_version_id);
  `);

  return dbInstance;
}

/**
 * Generate a unique version ID
 */
export function generateVersionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `wfv_${timestamp}_${random}`;
}

/**
 * Store a new workflow version
 */
export async function storeWorkflowVersion(
  tenantId: string,
  workflowName: string,
  definition: WorkflowDefinition,
  options: {
    parentVersionId?: string | null;
    mutationType?: MutationType;
    score?: number;
    isActive?: boolean;
  } = {}
): Promise<WorkflowVersion> {
  const db = await getDatabase();

  // Get next version number
  const lastVersion = await db.get(
    'SELECT MAX(version) as maxVersion FROM workflow_versions WHERE tenant_id = ? AND workflow_name = ?',
    [tenantId, workflowName]
  );

  const nextVersion = (lastVersion?.maxVersion || 0) + 1;
  const now = Date.now();
  const id = generateVersionId();

  await db.run(
    `INSERT INTO workflow_versions
      (id, tenant_id, workflow_name, version, definition_json, score, parent_version_id, mutation_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      workflowName,
      nextVersion,
      JSON.stringify(definition),
      options.score ?? 0,
      options.parentVersionId ?? null,
      options.mutationType ?? 'initial',
      options.isActive ? 1 : 0,
      now,
      now,
    ]
  );

  return {
    id,
    tenantId,
    workflowName,
    version: nextVersion,
    definitionJson: definition,
    score: options.score ?? 0,
    parentVersionId: options.parentVersionId ?? null,
    mutationType: options.mutationType ?? 'initial',
    isActive: options.isActive ?? false,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
}

/**
 * Get a specific workflow version
 */
export async function getWorkflowVersion(
  tenantId: string,
  workflowName: string,
  version: number
): Promise<WorkflowVersion | null> {
  const db = await getDatabase();

  const row = await db.get(
    'SELECT * FROM workflow_versions WHERE tenant_id = ? AND workflow_name = ? AND version = ?',
    [tenantId, workflowName, version]
  );

  if (!row) return null;

  return rowToWorkflowVersion(row);
}

/**
 * Get the active workflow version
 */
export async function getActiveWorkflowVersion(
  tenantId: string,
  workflowName: string
): Promise<WorkflowVersion | null> {
  const db = await getDatabase();

  const row = await db.get(
    'SELECT * FROM workflow_versions WHERE tenant_id = ? AND workflow_name = ? AND is_active = 1',
    [tenantId, workflowName]
  );

  if (!row) return null;

  return rowToWorkflowVersion(row);
}

/**
 * Get the latest workflow version (highest version number)
 */
export async function getLatestWorkflowVersion(
  tenantId: string,
  workflowName: string
): Promise<WorkflowVersion | null> {
  const db = await getDatabase();

  const row = await db.get(
    'SELECT * FROM workflow_versions WHERE tenant_id = ? AND workflow_name = ? ORDER BY version DESC LIMIT 1',
    [tenantId, workflowName]
  );

  if (!row) return null;

  return rowToWorkflowVersion(row);
}

/**
 * Get the best-scoring workflow version
 */
export async function getBestScoringVersion(
  tenantId: string,
  workflowName: string
): Promise<WorkflowVersion | null> {
  const db = await getDatabase();

  const row = await db.get(
    'SELECT * FROM workflow_versions WHERE tenant_id = ? AND workflow_name = ? ORDER BY score DESC LIMIT 1',
    [tenantId, workflowName]
  );

  if (!row) return null;

  return rowToWorkflowVersion(row);
}

/**
 * List workflow versions with pagination
 */
export async function listWorkflowVersions(
  tenantId: string,
  options: {
    workflowName?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'version' | 'score' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ versions: WorkflowVersion[]; total: number }> {
  const db = await getDatabase();

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const sortBy = options.sortBy ?? 'version';
  const sortOrder = options.sortOrder ?? 'desc';

  const sortColumn = {
    version: 'version',
    score: 'score',
    createdAt: 'created_at',
  }[sortBy];

  let whereClause = 'WHERE tenant_id = ?';
  const params: (string | number)[] = [tenantId];

  if (options.workflowName) {
    whereClause += ' AND workflow_name = ?';
    params.push(options.workflowName);
  }

  const totalRow = await db.get(
    `SELECT COUNT(*) as count FROM workflow_versions ${whereClause}`,
    params
  );

  const rows = await db.all(
    `SELECT * FROM workflow_versions ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    versions: rows.map(rowToWorkflowVersion),
    total: totalRow?.count || 0,
  };
}

/**
 * Update workflow version score
 */
export async function updateWorkflowScore(
  id: string,
  score: number
): Promise<void> {
  const db = await getDatabase();

  await db.run(
    'UPDATE workflow_versions SET score = ?, updated_at = ? WHERE id = ?',
    [score, Date.now(), id]
  );
}

/**
 * Set active workflow version (deactivates others)
 */
export async function setActiveVersion(
  tenantId: string,
  workflowName: string,
  versionId: string
): Promise<void> {
  const db = await getDatabase();

  // Deactivate all versions for this workflow
  await db.run(
    'UPDATE workflow_versions SET is_active = 0, updated_at = ? WHERE tenant_id = ? AND workflow_name = ?',
    [Date.now(), tenantId, workflowName]
  );

  // Activate the specified version
  await db.run(
    'UPDATE workflow_versions SET is_active = 1, updated_at = ? WHERE id = ?',
    [Date.now(), versionId]
  );
}

/**
 * Get version by ID
 */
export async function getWorkflowVersionById(
  id: string
): Promise<WorkflowVersion | null> {
  const db = await getDatabase();

  const row = await db.get(
    'SELECT * FROM workflow_versions WHERE id = ?',
    [id]
  );

  if (!row) return null;

  return rowToWorkflowVersion(row);
}

/**
 * Get version lineage (parent chain)
 */
export async function getVersionLineage(
  id: string,
  maxDepth = 10
): Promise<WorkflowVersion[]> {
  const lineage: WorkflowVersion[] = [];
  let currentId: string | null = id;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    const version = await getWorkflowVersionById(currentId);
    if (!version) break;

    lineage.push(version);
    currentId = version.parentVersionId;
    depth++;
  }

  return lineage;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Convert database row to WorkflowVersion
 */
function rowToWorkflowVersion(row: Record<string, unknown>): WorkflowVersion {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    workflowName: row.workflow_name as string,
    version: row.version as number,
    definitionJson: JSON.parse(row.definition_json as string) as WorkflowDefinition,
    score: row.score as number,
    parentVersionId: row.parent_version_id as string | null,
    mutationType: row.mutation_type as MutationType,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at as number).toISOString(),
    updatedAt: new Date(row.updated_at as number).toISOString(),
  };
}
