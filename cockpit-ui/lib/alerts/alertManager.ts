/**
 * Alert Manager
 *
 * Monitors SLO violations and triggers alerts.
 * Integrates with notification channels (Slack, email, etc.)
 */

import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source: string;
  createdAt: string;
  clearedAt?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: Alert['severity'];
  message: (metrics: any) => string;
  cooldownMinutes?: number;
}

// Alert history in memory (should use database in production)
const activeAlerts = new Map<string, Alert>();
const alertHistory: Alert[] = [];

/**
 * Alert rules for SLO monitoring
 */
export const ALERT_RULES: AlertRule[] = [
  {
    id: 'ack_latency_high',
    name: 'ACK Latency High',
    severity: 'warning',
    condition: (metrics) => metrics.slo?.ackLatency?.p95Ms > metrics.slo?.ackLatency?.targetP95Ms,
    message: (metrics) => `ACK latency P95 is ${metrics.slo.ackLatency.p95Ms}ms (target: ${metrics.slo.ackLatency.targetP95Ms}ms)`,
    cooldownMinutes: 15,
  },
  {
    id: 'error_rate_high',
    name: 'Error Rate High',
    severity: 'critical',
    condition: (metrics) => metrics.slo?.errorRate?.current > metrics.slo?.errorRate?.targetPercent,
    message: (metrics) => `Error rate is ${metrics.slo.errorRate.current}% (target: <${metrics.slo.errorRate.targetPercent}%)`,
    cooldownMinutes: 5,
  },
  {
    id: 'coverage_low',
    name: 'Coverage Below Target',
    severity: 'warning',
    condition: (metrics) => metrics.slo?.coverage?.current < metrics.slo?.coverage?.targetPercent,
    message: (metrics) => `Coverage is ${metrics.slo.coverage.current}% (target: >${metrics.slo.coverage.targetPercent}%)`,
    cooldownMinutes: 30,
  },
  {
    id: 'key_rotation_critical',
    name: 'Key Rotation Critical',
    severity: 'critical',
    condition: (metrics) => metrics.keyRotation?.critical > 0,
    message: (metrics) => `${metrics.keyRotation.critical} key(s) need immediate rotation`,
    cooldownMinutes: 60,
  },
  {
    id: 'panic_mode_active',
    name: 'Panic Mode Active',
    severity: 'critical',
    condition: (metrics) => metrics.panicMode?.active === true,
    message: (metrics) => `Panic mode triggered: ${metrics.panicMode.triggers.join(', ')}`,
    cooldownMinutes: 10,
  },
];

/**
 * Evaluate alert rules against current metrics
 */
export function evaluateAlerts(metrics: any): Alert[] {
  const triggeredAlerts: Alert[] = [];

  for (const rule of ALERT_RULES) {
    try {
      if (rule.condition(metrics)) {
        // Check if already active and in cooldown
        const existingAlert = activeAlerts.get(rule.id);
        if (existingAlert && rule.cooldownMinutes) {
          const cooldownMs = rule.cooldownMinutes * 60 * 1000;
          const timeSinceCreated = Date.now() - new Date(existingAlert.createdAt).getTime();
          if (timeSinceCreated < cooldownMs) {
            continue; // Skip, still in cooldown
          }
        }

        // Create new alert
        const alert: Alert = {
          id: `${rule.id}_${Date.now()}`,
          severity: rule.severity,
          title: rule.name,
          message: rule.message(metrics),
          source: 'alert_manager',
          createdAt: new Date().toISOString(),
          metadata: { ruleId: rule.id },
        };

        activeAlerts.set(rule.id, alert);
        triggeredAlerts.push(alert);
      } else {
        // Condition not met - clear alert if active
        const existingAlert = activeAlerts.get(rule.id);
        if (existingAlert && !existingAlert.clearedAt) {
          existingAlert.clearedAt = new Date().toISOString();
          alertHistory.push(existingAlert);
          activeAlerts.delete(rule.id);
        }
      }
    } catch (error) {
      console.error(`Error evaluating alert rule ${rule.id}:`, error);
    }
  }

  return triggeredAlerts;
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values());
}

/**
 * Get alert history
 */
export function getAlertHistory(limit = 100): Alert[] {
  return alertHistory.slice(-limit);
}

/**
 * Send alert notification
 */
export async function sendAlertNotification(alert: Alert): Promise<void> {
  // Log to file
  const alertLog = join(process.cwd(), '..', 'logs', 'alerts.jsonl');
  await appendFile(
    alertLog,
    JSON.stringify(alert) + '\n',
    'utf-8'
  ).catch(() => {}); // Ignore errors

  // In production, integrate with:
  // - Slack webhook
  // - Email service
  // - PagerDuty
  // - Discord webhook
  // etc.

  console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`);
  console.log(`  ${alert.message}`);

  // Example Slack webhook (disabled by default)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alert.title}*\n${alert.message}`,
          attachments: [{
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Time', value: alert.createdAt, short: true },
            ],
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

/**
 * Monitor and alert loop (run periodically)
 */
export async function monitorAndAlert(healthEndpoint = 'http://localhost:3000/api/mcp/healthz'): Promise<void> {
  try {
    const response = await fetch(healthEndpoint);

    if (!response.ok) {
      console.error('Failed to fetch health metrics');
      return;
    }

    const metrics = await response.json();

    // Evaluate alerts
    const triggeredAlerts = evaluateAlerts(metrics);

    // Send notifications for new alerts
    for (const alert of triggeredAlerts) {
      await sendAlertNotification(alert);
    }

  } catch (error) {
    console.error('Monitor and alert error:', error);
  }
}
