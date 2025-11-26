'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { MotionCard } from '@/components/ui/motion-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { PulseIndicator } from '@/components/ui/pulse-indicator';

interface GovernanceData {
  version: string;
  generatedAt: string;
  gates: Record<string, {
    name: string;
    status: 'pass' | 'partial' | 'pending' | 'fail';
    evidence: Record<string, unknown>;
    kpis: Record<string, number>;
  }>;
  summary: {
    totalGates: number;
    passed: number;
    pending: number;
    partial: number;
    failed: number;
  };
}

interface HealthData {
  status: string;
  timestamp: string;
  slo: {
    ackLatency: {
      p50Ms: number;
      p95Ms: number;
      targetP50Ms: number;
      targetP95Ms: number;
      healthy: boolean;
    };
    clockSkew: {
      p95Ms: number;
      targetP95Ms: number;
      healthy: boolean;
    };
    errorRate: {
      current: number;
      targetPercent: number;
      healthy: boolean;
    };
    coverage: {
      current: number;
      targetPercent: number;
      healthy: boolean;
    };
  };
  panicMode: {
    active: boolean;
    triggers: string[];
  };
  keyRotation: {
    activeKeys: number;
    needsRotation: number;
    critical: number;
    minDaysUntilRotation: number | null;
  };
}

// Static demo data for governance dashboard
const MOCK_GOVERNANCE: GovernanceData = {
  version: "R1.4.9",
  generatedAt: new Date().toISOString(),
  gates: {
    "G13": {
      name: "Trust Anchor Verification",
      status: "pass",
      evidence: { anchorsVerified: 12, lastCheck: new Date().toISOString() },
      kpis: { verificationRate: 100, avgLatencyMs: 45 },
    },
    "G14": {
      name: "Key Rotation Compliance",
      status: "pass",
      evidence: { rotatedKeys: 8, pendingRotation: 0 },
      kpis: { rotationCompliance: 100, daysToNextRotation: 28 },
    },
    "G15": {
      name: "Audit Log Integrity",
      status: "pass",
      evidence: { logsVerified: 1250, integrityScore: 100 },
      kpis: { logCoverage: 100, hashMismatches: 0 },
    },
    "G16": {
      name: "SLO Compliance",
      status: "partial",
      evidence: { sloChecks: 24, passing: 22 },
      kpis: { complianceRate: 92, breaches24h: 2 },
    },
    "G17": {
      name: "Federation Sync",
      status: "pass",
      evidence: { peersConnected: 5, lastSync: new Date().toISOString() },
      kpis: { syncLatencyMs: 120, peerHealth: 100 },
    },
    "G18": {
      name: "Data Residency",
      status: "pass",
      evidence: { regionsCompliant: 3, violations: 0 },
      kpis: { complianceScore: 100, dataFlowAudited: 850 },
    },
    "G19": {
      name: "Access Control",
      status: "pass",
      evidence: { policiesActive: 45, lastReview: new Date().toISOString() },
      kpis: { policyCompliance: 98, unauthorizedAttempts: 0 },
    },
    "G20": {
      name: "Incident Response",
      status: "pending",
      evidence: { drillsCompleted: 2, lastDrill: "2025-10-15" },
      kpis: { mttrMinutes: 15, incidentsOpen: 0 },
    },
    "G21": {
      name: "Continuous Monitoring",
      status: "pass",
      evidence: { monitorsActive: 128, alertsTriggered: 3 },
      kpis: { uptimePercent: 99.95, falsePositiveRate: 2 },
    },
  },
  summary: {
    totalGates: 9,
    passed: 7,
    pending: 1,
    partial: 1,
    failed: 0,
  },
};

const MOCK_HEALTH: HealthData = {
  status: "healthy",
  timestamp: new Date().toISOString(),
  slo: {
    ackLatency: {
      p50Ms: 12,
      p95Ms: 45,
      targetP50Ms: 50,
      targetP95Ms: 100,
      healthy: true,
    },
    clockSkew: {
      p95Ms: 8,
      targetP95Ms: 50,
      healthy: true,
    },
    errorRate: {
      current: 0.02,
      targetPercent: 1,
      healthy: true,
    },
    coverage: {
      current: 98.5,
      targetPercent: 95,
      healthy: true,
    },
  },
  panicMode: {
    active: false,
    triggers: [],
  },
  keyRotation: {
    activeKeys: 8,
    needsRotation: 0,
    critical: 0,
    minDaysUntilRotation: 28,
  },
};

export default function GovernanceDashboard() {
  const [governance, setGovernance] = useState<GovernanceData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading with mock data
    const timer = setTimeout(() => {
      setGovernance({
        ...MOCK_GOVERNANCE,
        generatedAt: new Date().toISOString(),
      });
      setHealth({
        ...MOCK_HEALTH,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading governance dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pass: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800',
      fail: 'bg-red-100 text-red-800',
    };

    const color = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';

    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`px-2 py-1 rounded text-sm font-medium ${color}`}
      >
        {status.toUpperCase()}
      </motion.span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Governance Observatory</h1>
          <p className="text-gray-600 mt-1">
            Factory Runtime R1.4.4-R1.4.9 · Gates G13-G21
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-sm">DEMO</span>
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Last updated: {governance ? new Date(governance.generatedAt).toLocaleString() : '-'}
        </div>
      </motion.div>

      {/* Panic Mode Alert */}
      {health?.panicMode.active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PulseIndicator intensity="strong">
            <Card className="bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">!</span>
                <div>
                  <div className="font-bold text-red-900">Panic Mode Active</div>
                  <div className="text-red-700 text-sm">
                    {health.panicMode.triggers.join(', ')}
                  </div>
                </div>
              </div>
            </Card>
          </PulseIndicator>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MotionCard delay={0.2} className="p-4">
          <div className="text-sm text-gray-600">Total Gates</div>
          <div className="text-3xl font-bold mt-1">
            <AnimatedNumber value={governance?.summary.totalGates || 0} delay={0.3} />
          </div>
        </MotionCard>
        <MotionCard delay={0.3} className="p-4">
          <div className="text-sm text-gray-600">Passed</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            <AnimatedNumber value={governance?.summary.passed || 0} delay={0.4} />
          </div>
        </MotionCard>
        <MotionCard delay={0.4} className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            <AnimatedNumber value={governance?.summary.pending || 0} delay={0.5} />
          </div>
        </MotionCard>
        <MotionCard delay={0.5} className="p-4">
          <div className="text-sm text-gray-600">Partial</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">
            <AnimatedNumber value={governance?.summary.partial || 0} delay={0.6} />
          </div>
        </MotionCard>
      </div>

      {/* SLO Health */}
      <MotionCard delay={0.6} hover={false} className="p-6">
        <h2 className="text-xl font-bold mb-4">SLO Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="text-sm text-gray-600">ACK Latency (P95)</div>
            <div className={`text-2xl font-bold ${health?.slo.ackLatency.healthy ? 'text-green-600' : 'text-red-600'}`}>
              <AnimatedNumber value={health?.slo.ackLatency.p95Ms || 0} suffix="ms" delay={0.8} />
            </div>
            <div className="text-xs text-gray-500">Target: {health?.slo.ackLatency.targetP95Ms}ms</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="text-sm text-gray-600">Clock Skew (P95)</div>
            <div className={`text-2xl font-bold ${health?.slo.clockSkew.healthy ? 'text-green-600' : 'text-red-600'}`}>
              <AnimatedNumber value={health?.slo.clockSkew.p95Ms || 0} suffix="ms" delay={0.9} />
            </div>
            <div className="text-xs text-gray-500">Target: {health?.slo.clockSkew.targetP95Ms}ms</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <div className="text-sm text-gray-600">Error Rate</div>
            <div className={`text-2xl font-bold ${health?.slo.errorRate.healthy ? 'text-green-600' : 'text-red-600'}`}>
              <AnimatedNumber value={health?.slo.errorRate.current || 0} decimals={2} suffix="%" delay={1} />
            </div>
            <div className="text-xs text-gray-500">Target: &lt;{health?.slo.errorRate.targetPercent}%</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1 }}
          >
            <div className="text-sm text-gray-600">Coverage</div>
            <PulseIndicator intensity="subtle">
              <div className={`text-2xl font-bold ${health?.slo.coverage.healthy ? 'text-green-600' : 'text-red-600'}`}>
                <AnimatedNumber value={health?.slo.coverage.current || 0} decimals={1} suffix="%" delay={1.1} />
              </div>
            </PulseIndicator>
            <div className="text-xs text-gray-500">Target: &gt;{health?.slo.coverage.targetPercent}%</div>
          </motion.div>
        </div>
      </MotionCard>

      {/* Key Rotation Status */}
      <MotionCard delay={0.7} hover={false} className="p-6">
        <h2 className="text-xl font-bold mb-4">Key Rotation Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="text-sm text-gray-600">Active Keys</div>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={health?.keyRotation.activeKeys || 0} delay={0.9} />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <div className="text-sm text-gray-600">Needs Rotation</div>
            <div className={`text-2xl font-bold ${health?.keyRotation.needsRotation === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              <AnimatedNumber value={health?.keyRotation.needsRotation || 0} delay={1} />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1 }}
          >
            <div className="text-sm text-gray-600">Critical</div>
            <div className={`text-2xl font-bold ${health?.keyRotation.critical === 0 ? 'text-green-600' : 'text-red-600'}`}>
              <AnimatedNumber value={health?.keyRotation.critical || 0} delay={1.1} />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.1 }}
          >
            <div className="text-sm text-gray-600">Min Days Until Rotation</div>
            <div className="text-2xl font-bold">
              {health?.keyRotation.minDaysUntilRotation != null ? (
                <AnimatedNumber value={health.keyRotation.minDaysUntilRotation} delay={1.2} />
              ) : '-'}
            </div>
          </motion.div>
        </div>
      </MotionCard>

      {/* Governance Gates */}
      <MotionCard delay={0.8} hover={false} className="p-6">
        <h2 className="text-xl font-bold mb-4">Governance Gates (G13-G21)</h2>
        <div className="space-y-3">
          {governance && Object.entries(governance.gates).map(([gateId, gate], idx) => (
            <motion.div
              key={gateId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + idx * 0.05 }}
              className="border rounded p-4"
              whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold">{gateId}: {gate.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {Object.keys(gate.kpis).length} KPIs · {Object.keys(gate.evidence).length} Evidence Items
                  </div>
                </div>
                {getStatusBadge(gate.status)}
              </div>
              {Object.keys(gate.kpis).length > 0 && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(gate.kpis).map(([key, value], kpiIdx) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 1 + idx * 0.05 + kpiIdx * 0.02 }}
                      className="bg-gray-50 p-2 rounded"
                    >
                      <div className="text-gray-600 text-xs">{key}</div>
                      <div className="font-medium">
                        <AnimatedNumber value={value} delay={1 + idx * 0.05 + kpiIdx * 0.02} duration={0.6} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </MotionCard>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="text-center text-sm text-gray-500 py-4"
      >
        Powered by Qontrek Engine · Tower Federation Certified
      </motion.div>
    </motion.div>
  );
}
