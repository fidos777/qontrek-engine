import { createHash, randomUUID } from "crypto";

export type NotifyChannel = "slack" | "whatsapp" | "email";

export interface NotificationEvent {
  eventId: string;
  event_id?: string;
  tenantId: string;
  channel: NotifyChannel;
  payload: Record<string, unknown>;
  correlationKey?: string;
  recipientLocalTime?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationConfig {
  rateLimits: {
    slack_per_min: number;
    whatsapp_per_min: number;
    email_per_min: number;
  };
  quietHours: {
    start_local: string;
    end_local: string;
  };
  retryPolicy: {
    max_attempts: number;
    backoff_strategy: "exponential" | "linear";
  };
  coalesce_window_min: number;
}

export interface ChannelTransport {
  send(event: NotificationEvent): Promise<void>;
}

export interface DlqEntry {
  dlqId: string;
  eventId: string;
  channel: NotifyChannel;
  payload: Record<string, unknown>;
  retryCount: number;
  lastError: string;
  nextAttemptAt: Date;
  payloadChecksum: string;
  createdAt: Date;
}

export interface DlqSink {
  persist(entry: DlqEntry): Promise<void>;
}

export interface SendReceipt {
  eventId: string;
  channel: NotifyChannel;
  attempt: number;
  status: "sent" | "deferred" | "deduped" | "failed";
  nextAttemptAt?: Date;
  failureReason?: string;
}

class InMemoryDlqSink implements DlqSink {
  private readonly entries: DlqEntry[] = [];

  async persist(entry: DlqEntry): Promise<void> {
    this.entries.push(entry);
  }

  snapshot(): DlqEntry[] {
    return [...this.entries];
  }
}

class RateLimiter {
  private readonly buckets = new Map<string, { windowStart: number; count: number }>();

  constructor(private readonly config: NotificationConfig["rateLimits"]) {}

  consume(tenantId: string, channel: NotifyChannel, timestamp: number): boolean {
    const limit = this.limitFor(channel);
    const key = `${tenantId}:${channel}`;
    const minuteWindow = Math.floor(timestamp / 60000);
    const bucket = this.buckets.get(key);

    if (bucket && bucket.windowStart === minuteWindow) {
      if (bucket.count >= limit) {
        return false;
      }
      bucket.count += 1;
      return true;
    }

    this.buckets.set(key, { windowStart: minuteWindow, count: 1 });
    return true;
  }

  private limitFor(channel: NotifyChannel): number {
    switch (channel) {
      case "slack":
        return this.config.slack_per_min;
      case "whatsapp":
        return this.config.whatsapp_per_min;
      case "email":
        return this.config.email_per_min;
      default:
        return 0;
    }
  }
}

class QuietHoursGuard {
  private readonly startMinutes: number;
  private readonly endMinutes: number;

  constructor(private readonly quietHours: NotificationConfig["quietHours"]) {
    this.startMinutes = QuietHoursGuard.parseMinutes(quietHours.start_local);
    this.endMinutes = QuietHoursGuard.parseMinutes(quietHours.end_local);
  }

  isQuiet(localTime?: string): boolean {
    if (!localTime) {
      return false;
    }

    const minutes = QuietHoursGuard.parseMinutes(localTime);
    if (this.startMinutes <= this.endMinutes) {
      return minutes >= this.startMinutes && minutes < this.endMinutes;
    }

    return minutes >= this.startMinutes || minutes < this.endMinutes;
  }

  nextWindow(): Date {
    const now = new Date();
    const next = new Date(now);
    const [hours, minutes] = this.quietHours.end_local.split(":").map(Number);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private static parseMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
}

export class TowerNotificationGateway {
  private readonly dedupeWindowMs: number;
  private readonly dedupeCache = new Map<string, number>();
  private readonly rateLimiter: RateLimiter;
  private readonly quietHours: QuietHoursGuard;
  private readonly dlqSink: DlqSink;
  private readonly transports: Partial<Record<NotifyChannel, ChannelTransport>>;
  private readonly inflight = new Map<string, Promise<SendReceipt>>();
  private readonly auditTrail: SendReceipt[] = [];

  constructor(
    private readonly config: NotificationConfig,
    transports: Partial<Record<NotifyChannel, ChannelTransport>>,
    dlqSink?: DlqSink
  ) {
    this.dedupeWindowMs = config.coalesce_window_min * 60 * 1000;
    this.rateLimiter = new RateLimiter(config.rateLimits);
    this.quietHours = new QuietHoursGuard(config.quietHours);
    this.transports = transports;
    this.dlqSink = dlqSink ?? new InMemoryDlqSink();
  }

  async emit(event: NotificationEvent): Promise<SendReceipt> {
    const dedupeKey = this.dedupeKey(event);
    const now = Date.now();

    if (this.isDuplicate(dedupeKey, now)) {
      const receipt: SendReceipt = {
        eventId: event.eventId,
        channel: event.channel,
        attempt: 0,
        status: "deduped",
        failureReason: "coalesce_window_hit",
      };
      this.auditTrail.push(receipt);
      return receipt;
    }

    if (this.quietHours.isQuiet(event.recipientLocalTime)) {
      const next = this.quietHours.nextWindow();
      const receipt: SendReceipt = {
        eventId: event.eventId,
        channel: event.channel,
        attempt: 0,
        status: "deferred",
        nextAttemptAt: next,
        failureReason: "quiet_hours",
      };
      this.auditTrail.push(receipt);
      return receipt;
    }

    if (!this.rateLimiter.consume(event.tenantId, event.channel, now)) {
      const next = new Date(now + 60_000);
      const receipt: SendReceipt = {
        eventId: event.eventId,
        channel: event.channel,
        attempt: 0,
        status: "deferred",
        nextAttemptAt: next,
        failureReason: "rate_limited",
      };
      this.auditTrail.push(receipt);
      return receipt;
    }

    const inflightKey = `${event.eventId}:${event.channel}`;
    if (this.inflight.has(inflightKey)) {
      return this.inflight.get(inflightKey)!;
    }

    const sendPromise = this.sendWithRetry(event)
      .finally(() => {
        this.inflight.delete(inflightKey);
      })
      .then((receipt) => {
        this.auditTrail.push(receipt);
        this.dedupeCache.set(dedupeKey, Date.now());
        return receipt;
      });

    this.inflight.set(inflightKey, sendPromise);
    return sendPromise;
  }

  async flushDlq(): Promise<DlqEntry[]> {
    const sink = this.dlqSink as InMemoryDlqSink;
    if (typeof sink.snapshot === "function") {
      return sink.snapshot();
    }
    return [];
  }

  getAuditTrail(): SendReceipt[] {
    return [...this.auditTrail];
  }

  private dedupeKey(event: NotificationEvent): string {
    const key = event.correlationKey ?? event.eventId ?? event.event_id;
    if (!key) {
      throw new Error("NotificationEvent requires eventId or event_id");
    }
    return key;
  }

  private isDuplicate(key: string, now: number): boolean {
    const firstSeen = this.dedupeCache.get(key);
    if (!firstSeen) {
      return false;
    }
    return now - firstSeen < this.dedupeWindowMs;
  }

  private async sendWithRetry(event: NotificationEvent): Promise<SendReceipt> {
    const maxAttempts = Math.max(this.config.retryPolicy.max_attempts, 1);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await this.dispatch(event);
        return {
          eventId: event.eventId,
          channel: event.channel,
          attempt,
          status: "sent",
        };
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts) {
          await this.writeToDlq(event, attempt, error);
          return {
            eventId: event.eventId,
            channel: event.channel,
            attempt,
            status: "failed",
            failureReason: error instanceof Error ? error.message : "unknown_error",
          };
        }
        await this.delay(this.computeBackoff(attempt));
      }
    }

    await this.writeToDlq(event, maxAttempts, lastError ?? new Error("unknown_error"));
    return {
      eventId: event.eventId,
      channel: event.channel,
      attempt: maxAttempts,
      status: "failed",
      failureReason: lastError instanceof Error ? lastError.message : "unknown_error",
    };
  }

  private async dispatch(event: NotificationEvent): Promise<void> {
    const transport = this.transports[event.channel];
    if (!transport) {
      throw new Error(`Transport unavailable for channel ${event.channel}`);
    }
    await transport.send(event);
  }

  private computeBackoff(attempt: number): number {
    const base = 1000;
    if (this.config.retryPolicy.backoff_strategy === "linear") {
      return base * attempt;
    }
    return base * Math.pow(2, attempt - 1);
  }

  private async writeToDlq(
    event: NotificationEvent,
    retryCount: number,
    error: unknown
  ): Promise<void> {
    const payloadChecksum = createHash("sha256")
      .update(JSON.stringify(event.payload))
      .digest("hex");

    const entry: DlqEntry = {
      dlqId: cryptoRandomUuid(),
      eventId: event.eventId,
      channel: event.channel,
      payload: event.payload,
      retryCount,
      lastError: error instanceof Error ? error.message : "unknown_error",
      nextAttemptAt: new Date(Date.now() + this.computeBackoff(retryCount + 1)),
      payloadChecksum,
      createdAt: new Date(),
    };
    await this.dlqSink.persist(entry);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function cryptoRandomUuid(): string {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export { InMemoryDlqSink };
