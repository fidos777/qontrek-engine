import { NextResponse } from 'next/server';
import { getNonceStats } from '@/lib/security/nonceStore';
import { listReceipts } from '@/lib/tower/receipts';
import { getRotationStatus } from '@/lib/security/keyRegistry';

/**
 * GET /api/mcp/healthz
 *
 * Health check endpoint with SLO/SLI metrics.
 *
 * Returns:
 * - ACK latency (p50/p95)
 * - Clock skew (p95)
 * - Tail error rate
 * - Panic mode status
 * - Coverage percentage
 * - Key rotation status
 * - Anti-replay stats
 */
export async function GET() {
  try {
    // Fetch recent receipts for ACK metrics
    const receipts = await listReceipts(100);
    const verifiedReceipts = receipts.filter(r => r.verifiedAt);

    // Compute ACK latency metrics
    const ackLatencies = verifiedReceipts.map(r => {
      const uploaded = new Date(r.uploadedAt).getTime();
      const verified = new Date(r.verifiedAt!).getTime();
      return verified - uploaded;
    });

    const p50Latency = ackLatencies.length > 0
      ? percentile(ackLatencies, 0.5)
      : 0;

    const p95Latency = ackLatencies.length > 0
      ? percentile(ackLatencies, 0.95)
      : 0;

    // Get nonce store stats
    const nonceStats = await getNonceStats();

    // Get key rotation status
    const keyRotations = await getRotationStatus();
    const criticalRotations = keyRotations.filter(
      ({ rotation }) => rotation.urgency === 'critical' || rotation.urgency === 'overdue'
    );

    // Compute health metrics
    const errorRate = receipts.length > 0
      ? receipts.filter(r => r.status === 'rejected').length / receipts.length
      : 0;

    const coverage = receipts.length > 0
      ? verifiedReceipts.length / receipts.length
      : 0;

    // Determine panic mode
    const panicMode = errorRate > 0.1 || criticalRotations.length > 0;

    // Build health response
    const health = {
      status: panicMode ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      slo: {
        ackLatency: {
          p50Ms: Math.round(p50Latency),
          p95Ms: Math.round(p95Latency),
          targetP50Ms: 2000,
          targetP95Ms: 5000,
          healthy: p95Latency <= 5000,
        },
        clockSkew: {
          p95Ms: 100, // Placeholder - would compute from federation sync
          targetP95Ms: 500,
          healthy: true,
        },
        errorRate: {
          current: Number((errorRate * 100).toFixed(2)),
          targetPercent: 1.0,
          healthy: errorRate <= 0.01,
        },
        coverage: {
          current: Number((coverage * 100).toFixed(2)),
          targetPercent: 95.0,
          healthy: coverage >= 0.95,
        },
      },
      panicMode: {
        active: panicMode,
        triggers: [
          ...(errorRate > 0.1 ? ['High error rate'] : []),
          ...(criticalRotations.length > 0 ? [`${criticalRotations.length} key(s) need rotation`] : []),
        ],
      },
      antiReplay: {
        activeNonces: nonceStats.active,
        expiredNonces: nonceStats.expired,
        byContext: nonceStats.byContext,
        replayRate: 0, // Would track from actual replay attempts
      },
      keyRotation: {
        activeKeys: keyRotations.length,
        needsRotation: keyRotations.filter(({ rotation }) => rotation.needsRotation).length,
        critical: criticalRotations.length,
        minDaysUntilRotation: keyRotations.length > 0
          ? Math.min(...keyRotations.map(({ rotation }) => rotation.daysUntilRotation))
          : null,
      },
      receipts: {
        total: receipts.length,
        verified: verifiedReceipts.length,
        pending: receipts.filter(r => r.status === 'pending' || r.status === 'received').length,
        rejected: receipts.filter(r => r.status === 'rejected').length,
      },
    };

    return NextResponse.json(health, {
      headers: {
        "X-Qontrek-MCP-Version": "1.0.0",
      },
    });

  } catch (error) {
    console.error('Healthz error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "X-Qontrek-MCP-Version": "1.0.0",
        },
      }
    );
  }
}

/**
 * Compute percentile from array of numbers
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, index)];
}
