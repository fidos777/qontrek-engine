/**
 * n8n Workflow Wrapper
 *
 * Evolutionary workflow engine that supports:
 * - Workflow versioning
 * - Mutation-based evolution
 * - Score-based rollback
 *
 * Provides three main operations:
 * - cloneWorkflow(): Create an exact copy with a new version
 * - mutateWorkflow(): Create a modified version with applied mutations
 * - rollbackWorkflow(): Revert to a previous version based on score
 */

import type {
  WorkflowVersion,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowConnection,
  MutationRule,
  EvolutionConfig,
  EvolutionResult,
} from '@/types/workflows';
import {
  storeWorkflowVersion,
  getLatestWorkflowVersion,
  getBestScoringVersion,
  getWorkflowVersionById,
  setActiveVersion,
  updateWorkflowScore,
} from './store';

/**
 * Default evolution configuration
 */
const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  maxVersions: 100,
  mutationRate: 0.3,
  eliteCount: 3,
  scoreThreshold: 0.1,
  rollbackOnScoreDrop: true,
};

/**
 * Built-in mutation rules
 */
export const MUTATION_RULES: MutationRule[] = [
  {
    id: 'add_retry',
    name: 'Add Retry Logic',
    description: 'Adds retry parameters to HTTP request nodes',
    probability: 0.2,
    apply: (def) => addRetryToHttpNodes(def),
  },
  {
    id: 'add_timeout',
    name: 'Add Timeout',
    description: 'Adds timeout parameters to long-running nodes',
    probability: 0.15,
    apply: (def) => addTimeoutToNodes(def),
  },
  {
    id: 'add_error_handler',
    name: 'Add Error Handler',
    description: 'Adds error handling branch to nodes',
    probability: 0.1,
    apply: (def) => addErrorHandler(def),
  },
  {
    id: 'optimize_parallel',
    name: 'Optimize Parallel Execution',
    description: 'Identifies and parallelizes independent branches',
    probability: 0.15,
    apply: (def) => optimizeParallelExecution(def),
  },
  {
    id: 'add_caching',
    name: 'Add Caching',
    description: 'Adds caching to idempotent operations',
    probability: 0.1,
    apply: (def) => addCachingToNodes(def),
  },
  {
    id: 'add_logging',
    name: 'Add Logging',
    description: 'Adds logging nodes for observability',
    probability: 0.2,
    apply: (def) => addLoggingNodes(def),
  },
  {
    id: 'reorder_nodes',
    name: 'Reorder Nodes',
    description: 'Optimizes node execution order',
    probability: 0.1,
    apply: (def) => reorderNodesForEfficiency(def),
  },
];

/**
 * Clone a workflow with a new version number
 *
 * Creates an exact copy of the latest workflow version without modifications.
 * Useful for creating a checkpoint before experimentation.
 */
export async function cloneWorkflow(
  tenantId: string,
  workflowName: string,
  options: {
    sourceVersion?: number;
    activateClone?: boolean;
  } = {}
): Promise<EvolutionResult> {
  try {
    // Get source version
    let sourceVersion: WorkflowVersion | null;

    if (options.sourceVersion) {
      const { versions } = await import('./store').then((m) =>
        m.listWorkflowVersions(tenantId, {
          workflowName,
          limit: 1000,
        })
      );
      sourceVersion = versions.find((v) => v.version === options.sourceVersion) || null;
    } else {
      sourceVersion = await getLatestWorkflowVersion(tenantId, workflowName);
    }

    if (!sourceVersion) {
      return {
        success: false,
        newVersion: null,
        previousVersion: null,
        mutationsApplied: [],
        scoreChange: 0,
        message: `No workflow found: ${workflowName}`,
      };
    }

    // Create clone
    const newVersion = await storeWorkflowVersion(
      tenantId,
      workflowName,
      sourceVersion.definitionJson,
      {
        parentVersionId: sourceVersion.id,
        mutationType: 'clone',
        score: sourceVersion.score,
        isActive: options.activateClone ?? false,
      }
    );

    if (options.activateClone) {
      await setActiveVersion(tenantId, workflowName, newVersion.id);
    }

    return {
      success: true,
      newVersion,
      previousVersion: sourceVersion,
      mutationsApplied: [],
      scoreChange: 0,
      message: `Cloned ${workflowName} v${sourceVersion.version} to v${newVersion.version}`,
    };
  } catch (error) {
    return {
      success: false,
      newVersion: null,
      previousVersion: null,
      mutationsApplied: [],
      scoreChange: 0,
      message: `Clone failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Mutate a workflow to create an evolved version
 *
 * Applies mutation rules to create a new version with potential improvements.
 * The mutation rate and rules can be configured.
 */
export async function mutateWorkflow(
  tenantId: string,
  workflowName: string,
  options: {
    sourceVersion?: number;
    mutationRules?: string[];
    mutationRate?: number;
    activateMutant?: boolean;
  } = {}
): Promise<EvolutionResult> {
  try {
    // Get source version
    let sourceVersion: WorkflowVersion | null;

    if (options.sourceVersion) {
      const { versions } = await import('./store').then((m) =>
        m.listWorkflowVersions(tenantId, {
          workflowName,
          limit: 1000,
        })
      );
      sourceVersion = versions.find((v) => v.version === options.sourceVersion) || null;
    } else {
      sourceVersion = await getLatestWorkflowVersion(tenantId, workflowName);
    }

    if (!sourceVersion) {
      return {
        success: false,
        newVersion: null,
        previousVersion: null,
        mutationsApplied: [],
        scoreChange: 0,
        message: `No workflow found: ${workflowName}`,
      };
    }

    // Select mutation rules to apply
    const mutationRate = options.mutationRate ?? DEFAULT_EVOLUTION_CONFIG.mutationRate;
    const allowedRules = options.mutationRules
      ? MUTATION_RULES.filter((r) => options.mutationRules!.includes(r.id))
      : MUTATION_RULES;

    const appliedMutations: string[] = [];
    let mutatedDefinition = deepClone(sourceVersion.definitionJson);

    // Apply mutations based on probability
    for (const rule of allowedRules) {
      const shouldApply = Math.random() < rule.probability * mutationRate;
      if (shouldApply) {
        try {
          mutatedDefinition = rule.apply(mutatedDefinition);
          appliedMutations.push(rule.id);
        } catch {
          // Skip failed mutations
          console.warn(`Mutation ${rule.id} failed, skipping`);
        }
      }
    }

    // Ensure at least one mutation was applied
    if (appliedMutations.length === 0) {
      // Force apply a random mutation
      const randomRule = allowedRules[Math.floor(Math.random() * allowedRules.length)];
      if (randomRule) {
        mutatedDefinition = randomRule.apply(mutatedDefinition);
        appliedMutations.push(randomRule.id);
      }
    }

    // Store mutated version
    const newVersion = await storeWorkflowVersion(
      tenantId,
      workflowName,
      mutatedDefinition,
      {
        parentVersionId: sourceVersion.id,
        mutationType: 'mutate',
        score: 0, // Score will be updated after execution
        isActive: options.activateMutant ?? false,
      }
    );

    if (options.activateMutant) {
      await setActiveVersion(tenantId, workflowName, newVersion.id);
    }

    return {
      success: true,
      newVersion,
      previousVersion: sourceVersion,
      mutationsApplied: appliedMutations,
      scoreChange: 0,
      message: `Mutated ${workflowName} v${sourceVersion.version} to v${newVersion.version} with ${appliedMutations.length} mutations`,
    };
  } catch (error) {
    return {
      success: false,
      newVersion: null,
      previousVersion: null,
      mutationsApplied: [],
      scoreChange: 0,
      message: `Mutation failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Rollback to a previous workflow version
 *
 * Reverts to the best-scoring previous version when the current version
 * scores below the threshold.
 */
export async function rollbackWorkflow(
  tenantId: string,
  workflowName: string,
  options: {
    targetVersion?: number;
    targetScore?: number;
    activateRollback?: boolean;
  } = {}
): Promise<EvolutionResult> {
  try {
    const currentVersion = await getLatestWorkflowVersion(tenantId, workflowName);

    if (!currentVersion) {
      return {
        success: false,
        newVersion: null,
        previousVersion: null,
        mutationsApplied: [],
        scoreChange: 0,
        message: `No workflow found: ${workflowName}`,
      };
    }

    // Find rollback target
    let targetVersion: WorkflowVersion | null = null;

    if (options.targetVersion) {
      // Rollback to specific version
      const { versions } = await import('./store').then((m) =>
        m.listWorkflowVersions(tenantId, {
          workflowName,
          limit: 1000,
        })
      );
      targetVersion = versions.find((v) => v.version === options.targetVersion) || null;
    } else if (options.targetScore) {
      // Find best version meeting score threshold
      const { versions } = await import('./store').then((m) =>
        m.listWorkflowVersions(tenantId, {
          workflowName,
          sortBy: 'score',
          sortOrder: 'desc',
          limit: 1000,
        })
      );
      targetVersion = versions.find((v) => v.score >= options.targetScore!) || null;
    } else {
      // Default: rollback to best scoring version
      targetVersion = await getBestScoringVersion(tenantId, workflowName);
    }

    if (!targetVersion || targetVersion.id === currentVersion.id) {
      return {
        success: false,
        newVersion: null,
        previousVersion: currentVersion,
        mutationsApplied: [],
        scoreChange: 0,
        message: 'No suitable rollback target found',
      };
    }

    // Create rollback version
    const newVersion = await storeWorkflowVersion(
      tenantId,
      workflowName,
      targetVersion.definitionJson,
      {
        parentVersionId: currentVersion.id,
        mutationType: 'rollback',
        score: targetVersion.score,
        isActive: options.activateRollback ?? true,
      }
    );

    if (options.activateRollback ?? true) {
      await setActiveVersion(tenantId, workflowName, newVersion.id);
    }

    const scoreChange = targetVersion.score - currentVersion.score;

    return {
      success: true,
      newVersion,
      previousVersion: currentVersion,
      mutationsApplied: [],
      scoreChange,
      message: `Rolled back ${workflowName} from v${currentVersion.version} to v${newVersion.version} (based on v${targetVersion.version})`,
    };
  } catch (error) {
    return {
      success: false,
      newVersion: null,
      previousVersion: null,
      mutationsApplied: [],
      scoreChange: 0,
      message: `Rollback failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Score a workflow version based on execution metrics
 */
export async function scoreWorkflow(
  versionId: string,
  metrics: {
    executionTime: number;
    successRate: number;
    errorCount: number;
    resourceUsage?: number;
    outputQuality?: number;
  },
  weights: {
    executionTime?: number;
    successRate?: number;
    errorCount?: number;
    resourceUsage?: number;
    outputQuality?: number;
  } = {}
): Promise<number> {
  const w = {
    executionTime: weights.executionTime ?? 0.2,
    successRate: weights.successRate ?? 0.4,
    errorCount: weights.errorCount ?? 0.2,
    resourceUsage: weights.resourceUsage ?? 0.1,
    outputQuality: weights.outputQuality ?? 0.1,
  };

  // Normalize metrics (higher is better)
  const normalizedTime = Math.max(0, 1 - metrics.executionTime / 60000); // Assume 60s max
  const normalizedSuccess = metrics.successRate;
  const normalizedErrors = Math.max(0, 1 - metrics.errorCount / 10); // Assume 10 errors max
  const normalizedResource = 1 - (metrics.resourceUsage ?? 0.5);
  const normalizedQuality = metrics.outputQuality ?? 0.5;

  // Calculate weighted score
  const score =
    w.executionTime * normalizedTime +
    w.successRate * normalizedSuccess +
    w.errorCount * normalizedErrors +
    w.resourceUsage * normalizedResource +
    w.outputQuality * normalizedQuality;

  // Update score in store
  await updateWorkflowScore(versionId, score);

  return score;
}

/**
 * Check if workflow should auto-rollback based on score
 */
export async function checkAutoRollback(
  tenantId: string,
  workflowName: string,
  config: Partial<EvolutionConfig> = {}
): Promise<EvolutionResult | null> {
  const effectiveConfig = { ...DEFAULT_EVOLUTION_CONFIG, ...config };

  if (!effectiveConfig.rollbackOnScoreDrop) {
    return null;
  }

  const currentVersion = await getLatestWorkflowVersion(tenantId, workflowName);
  const bestVersion = await getBestScoringVersion(tenantId, workflowName);

  if (!currentVersion || !bestVersion) {
    return null;
  }

  // Check if score dropped below threshold
  const scoreDrop = bestVersion.score - currentVersion.score;
  if (scoreDrop > effectiveConfig.scoreThreshold && currentVersion.id !== bestVersion.id) {
    return rollbackWorkflow(tenantId, workflowName, {
      targetScore: bestVersion.score - effectiveConfig.scoreThreshold,
      activateRollback: true,
    });
  }

  return null;
}

// ============================================================================
// Mutation Rule Implementations
// ============================================================================

function addRetryToHttpNodes(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  for (const node of mutated.nodes) {
    if (node.type === 'http_request' && !node.parameters.retry) {
      node.parameters.retry = {
        enabled: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        exponentialBackoff: true,
      };
    }
  }

  return mutated;
}

function addTimeoutToNodes(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  for (const node of mutated.nodes) {
    if (['http_request', 'code', 'function'].includes(node.type) && !node.parameters.timeout) {
      node.parameters.timeout = 30000; // 30 seconds default
    }
  }

  return mutated;
}

function addErrorHandler(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  // Find nodes without error handling
  const nodesWithoutErrorHandler = mutated.nodes.filter(
    (node) => !node.parameters.onError && node.type !== 'trigger'
  );

  if (nodesWithoutErrorHandler.length > 0) {
    // Add a global error handler node
    const errorHandlerId = `error_handler_${Date.now()}`;
    const errorHandlerNode: WorkflowNode = {
      id: errorHandlerId,
      name: 'Error Handler',
      type: 'code',
      position: { x: 800, y: 100 },
      parameters: {
        code: `
          // Log error and continue
          const error = $input.all()[0].json.error;
          console.error('Workflow error:', error);
          return [{ json: { handled: true, error: error?.message || 'Unknown error' } }];
        `,
        onError: 'continueOnError',
      },
    };

    mutated.nodes.push(errorHandlerNode);

    // Update nodes to reference error handler
    for (const node of nodesWithoutErrorHandler) {
      node.parameters.onError = 'continueOnError';
    }
  }

  return mutated;
}

function optimizeParallelExecution(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  // Find nodes that could run in parallel (no dependencies between them)
  const nodeIds = new Set(mutated.nodes.map((n) => n.id));
  const dependencies = new Map<string, Set<string>>();

  // Build dependency graph
  for (const conn of mutated.connections) {
    if (!dependencies.has(conn.targetNodeId)) {
      dependencies.set(conn.targetNodeId, new Set());
    }
    dependencies.get(conn.targetNodeId)!.add(conn.sourceNodeId);
  }

  // Find independent nodes at same level (could be parallelized)
  // Add split/merge pattern if found
  const triggerNodes = mutated.nodes.filter((n) => n.type === 'trigger' || n.type === 'webhook');

  if (triggerNodes.length > 0) {
    const triggerNode = triggerNodes[0];
    const directChildren = mutated.connections
      .filter((c) => c.sourceNodeId === triggerNode.id)
      .map((c) => c.targetNodeId);

    // If trigger has multiple independent children, add split node
    if (directChildren.length >= 2) {
      const splitNodeId = `split_${Date.now()}`;
      const splitNode: WorkflowNode = {
        id: splitNodeId,
        name: 'Parallel Split',
        type: 'split',
        position: {
          x: triggerNode.position.x + 200,
          y: triggerNode.position.y,
        },
        parameters: {
          mode: 'parallel',
        },
      };

      mutated.nodes.push(splitNode);

      // Rewire connections
      mutated.connections = mutated.connections.map((conn) => {
        if (conn.sourceNodeId === triggerNode.id && directChildren.includes(conn.targetNodeId)) {
          return { ...conn, sourceNodeId: splitNodeId };
        }
        return conn;
      });

      mutated.connections.push({
        sourceNodeId: triggerNode.id,
        sourceOutput: 0,
        targetNodeId: splitNodeId,
        targetInput: 0,
      });
    }
  }

  return mutated;
}

function addCachingToNodes(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  for (const node of mutated.nodes) {
    if (node.type === 'http_request' && !node.parameters.cache) {
      // Only cache GET requests
      const method = node.parameters.method as string;
      if (!method || method.toUpperCase() === 'GET') {
        node.parameters.cache = {
          enabled: true,
          ttlSeconds: 300, // 5 minutes
          key: `${node.id}_${node.name}`,
        };
      }
    }
  }

  return mutated;
}

function addLoggingNodes(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  // Add logging at workflow start and end
  const triggerNodes = mutated.nodes.filter((n) => n.type === 'trigger' || n.type === 'webhook');
  const endNodes = mutated.nodes.filter((node) => {
    const hasOutgoing = mutated.connections.some((c) => c.sourceNodeId === node.id);
    return !hasOutgoing && node.type !== 'trigger' && node.type !== 'webhook';
  });

  if (triggerNodes.length > 0) {
    const startLogId = `log_start_${Date.now()}`;
    const startLogNode: WorkflowNode = {
      id: startLogId,
      name: 'Log Start',
      type: 'code',
      position: {
        x: triggerNodes[0].position.x + 100,
        y: triggerNodes[0].position.y - 100,
      },
      parameters: {
        code: `
          console.log('Workflow started:', new Date().toISOString());
          return $input.all();
        `,
      },
    };
    mutated.nodes.push(startLogNode);
  }

  for (const endNode of endNodes.slice(0, 1)) {
    const endLogId = `log_end_${Date.now()}`;
    const endLogNode: WorkflowNode = {
      id: endLogId,
      name: 'Log End',
      type: 'code',
      position: {
        x: endNode.position.x + 200,
        y: endNode.position.y,
      },
      parameters: {
        code: `
          console.log('Workflow completed:', new Date().toISOString());
          return $input.all();
        `,
      },
    };

    mutated.nodes.push(endLogNode);
    mutated.connections.push({
      sourceNodeId: endNode.id,
      sourceOutput: 0,
      targetNodeId: endLogId,
      targetInput: 0,
    });
  }

  return mutated;
}

function reorderNodesForEfficiency(def: WorkflowDefinition): WorkflowDefinition {
  const mutated = deepClone(def);

  // Sort nodes by type priority (triggers first, then data processing, then actions)
  const typePriority: Record<string, number> = {
    trigger: 0,
    webhook: 0,
    set: 1,
    code: 2,
    function: 2,
    conditional: 3,
    loop: 4,
    http_request: 5,
    merge: 6,
    split: 6,
    delay: 7,
  };

  mutated.nodes.sort((a, b) => {
    const priorityA = typePriority[a.type] ?? 5;
    const priorityB = typePriority[b.type] ?? 5;
    return priorityA - priorityB;
  });

  // Update positions to reflect new order
  let yOffset = 100;
  for (const node of mutated.nodes) {
    node.position.y = yOffset;
    yOffset += 150;
  }

  return mutated;
}

// ============================================================================
// Utility Functions
// ============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Export mutation rules for testing
 */
export function getMutationRules(): MutationRule[] {
  return [...MUTATION_RULES];
}

/**
 * Get default evolution config
 */
export function getDefaultEvolutionConfig(): EvolutionConfig {
  return { ...DEFAULT_EVOLUTION_CONFIG };
}
