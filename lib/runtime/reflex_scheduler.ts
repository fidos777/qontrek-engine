import { Pool, PoolClient } from "pg";
import { createHash } from "crypto";

export interface SchedulerJobContext {
  payload?: Record<string, unknown>;
}

export interface SchedulerJob {
  name: string;
  cron: string;
  handler: (context: SchedulerJobContext) => Promise<void>;
  maxRetries?: number;
}

export interface SchedulerOptions {
  jitterWindowMs?: number;
  dlqTable?: string;
  metricsSink?: (event: SchedulerMetricEvent) => void;
}

export interface SchedulerMetricEvent {
  job: string;
  status: "skipped_lock" | "started" | "completed" | "failed" | "dlq_replayed";
  attempt: number;
  elapsedMs?: number;
  error?: string;
}

export interface SchedulerResult {
  job: string;
  attempt: number;
  status: "completed" | "skipped" | "failed";
  reason?: string;
  nextAttemptAt?: Date;
}

const DEFAULT_DLQ_TABLE = "runtime_job_dlq";

export class ReflexScheduler {
  private readonly jobs = new Map<string, SchedulerJob>();
  private readonly jitterWindowMs: number;
  private readonly dlqTable: string;
  private readonly metricsSink?: SchedulerOptions["metricsSink"];

  constructor(private readonly pool: Pool, options: SchedulerOptions = {}) {
    this.jitterWindowMs = options.jitterWindowMs ?? 5_000;
    this.dlqTable = options.dlqTable ?? DEFAULT_DLQ_TABLE;
    this.metricsSink = options.metricsSink;
  }

  register(job: SchedulerJob): void {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job ${job.name} already registered`);
    }
    this.jobs.set(job.name, { ...job });
  }

  async run(jobName: string, context: SchedulerJobContext = {}): Promise<SchedulerResult> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Unknown job ${jobName}`);
    }

    const client = await this.pool.connect();
    const lockKey = hashJobName(job.name);
    let attempt = 0;

    try {
      await this.applyJitter();

      const hasLock = await this.acquireLock(client, lockKey);
      if (!hasLock) {
        this.emitMetric(job.name, "skipped_lock", 0);
        return {
          job: job.name,
          attempt: 0,
          status: "skipped",
          reason: "lock_not_acquired",
        };
      }

      const maxAttempts = Math.max(job.maxRetries ?? 3, 1);
      const startedAt = Date.now();

      this.emitMetric(job.name, "started", 1);
      for (attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await job.handler(context);
          this.emitMetric(job.name, "completed", attempt, Date.now() - startedAt);
          return {
            job: job.name,
            attempt,
            status: "completed",
          };
        } catch (error) {
          if (attempt >= maxAttempts) {
            const nextAttempt = new Date(Date.now() + this.backoffMs(attempt));
            await this.enqueueDlq(client, job, context, attempt, error);
            this.emitMetric(job.name, "failed", attempt, Date.now() - startedAt, error);
            return {
              job: job.name,
              attempt,
              status: "failed",
              reason: error instanceof Error ? error.message : "unknown_error",
              nextAttemptAt: nextAttempt,
            };
          }
          await this.delay(this.backoffMs(attempt));
        }
      }
    } finally {
      try {
        await this.releaseLock(client, lockKey);
      } finally {
        client.release();
      }
    }

    return {
      job: jobName,
      attempt,
      status: "failed",
      reason: "unexpected_exit",
    };
  }

  async replayDlq(limit = 10): Promise<number> {
    const client = await this.pool.connect();
    let processed = 0;

    try {
      const rows = await client.query(
        `select dlq_id, job_name, payload, retry_count, last_error
         from ${this.dlqTable}
         where next_attempt_at <= now()
         order by next_attempt_at asc
         limit $1`,
        [limit]
      );

      for (const row of rows.rows) {
        const job = this.jobs.get(row.job_name);
        if (!job) {
          continue;
        }

        const payload = (row.payload ?? {}) as Record<string, unknown>;
        const context: SchedulerJobContext = { payload };
        const startedAt = Date.now();
        try {
          await job.handler(context);
          await client.query(`delete from ${this.dlqTable} where dlq_id = $1`, [row.dlq_id]);
          processed += 1;
          this.emitMetric(job.name, "dlq_replayed", row.retry_count + 1, Date.now() - startedAt);
        } catch (error) {
          const nextRetry = row.retry_count + 1;
          await client.query(
            `update ${this.dlqTable}
             set retry_count = $1,
                 last_error = $2,
                 next_attempt_at = now() + ($3 || ' seconds')::interval
             where dlq_id = $4`,
            [
              nextRetry,
              error instanceof Error ? error.message : "unknown_error",
              Math.ceil(this.backoffMs(nextRetry) / 1000),
              row.dlq_id,
            ]
          );
        }
      }
    } finally {
      client.release();
    }

    return processed;
  }

  private async applyJitter(): Promise<void> {
    const jitter = Math.floor(Math.random() * this.jitterWindowMs);
    await this.delay(jitter);
  }

  private async acquireLock(client: PoolClient, lockKey: number): Promise<boolean> {
    const result = await client.query<{ pg_try_advisory_lock: boolean }>(
      "select pg_try_advisory_lock($1) as pg_try_advisory_lock",
      [lockKey]
    );
    return result.rows[0]?.pg_try_advisory_lock ?? false;
  }

  private async releaseLock(client: PoolClient, lockKey: number): Promise<void> {
    await client.query("select pg_advisory_unlock($1)", [lockKey]);
  }

  private async enqueueDlq(
    client: PoolClient,
    job: SchedulerJob,
    context: SchedulerJobContext,
    retryCount: number,
    error: unknown
  ): Promise<void> {
    const payload = context.payload ?? {};
    const payloadChecksum = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
    const nextAttemptSeconds = Math.ceil(this.backoffMs(retryCount) / 1000);

    await client.query(
      `insert into ${this.dlqTable} (
          dlq_id,
          job_name,
          payload,
          retry_count,
          last_error,
          next_attempt_at,
          payload_checksum,
          created_at
        ) values (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          now() + ($5 || ' seconds')::interval,
          $6,
          now()
        )`,
      [
        job.name,
        payload,
        retryCount,
        error instanceof Error ? error.message : "unknown_error",
        nextAttemptSeconds,
        payloadChecksum,
      ]
    );
  }

  private backoffMs(attempt: number): number {
    const base = 1_000;
    return base * Math.pow(2, attempt - 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private emitMetric(
    job: string,
    status: SchedulerMetricEvent["status"],
    attempt: number,
    elapsedMs?: number,
    error?: unknown
  ): void {
    if (!this.metricsSink) {
      return;
    }
    this.metricsSink({
      job,
      status,
      attempt,
      elapsedMs,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

function hashJobName(jobName: string): number {
  const digest = createHash("sha256").update(jobName).digest();
  return digest.readInt32BE(0);
}
