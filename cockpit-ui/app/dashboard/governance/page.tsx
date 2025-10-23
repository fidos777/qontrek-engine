'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface GovernanceData {
  version: string;
  generatedAt: string;
  gates: Record<string, {
    name: string;
    status: 'pass' | 'partial' | 'pending' | 'fail';
    evidence: Record<string, any>;
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

export default function GovernanceDashboard() {
  const [governance, setGovernance] = useState<GovernanceData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [govRes, healthRes] = await Promise.all([
          fetch('/api/mcp/governance'),
          fetch('/api/mcp/healthz'),
        ]);

        if (!govRes.ok || !healthRes.ok) {
          throw new Error('Failed to fetch governance data');
        }

        const govData = await govRes.json();
        const healthData = await healthRes.json();

        setGovernance(govData);
        setHealth(healthData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading governance dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">Error: {error}</div>
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
      <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Governance Observatory</h1>
          <p className="text-gray-600 mt-1">
            Factory Runtime R1.4.4–R1.4.9 · Gates G13–G21
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Last updated: {governance ? new Date(governance.generatedAt).toLocaleString() : '—'}
        </div>
      </div>

      {/* Panic Mode Alert */}
      {health?.panicMode.active && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-red-900">Panic Mode Active</div>
              <div className="text-red-700 text-sm">
                {health.panicMode.triggers.join(', ')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Gates</div>
          <div className="text-3xl font-bold mt-1">{governance?.summary.totalGates}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Passed</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{governance?.summary.passed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{governance?.summary.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Partial</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">{governance?.summary.partial}</div>
        </Card>
      </div>

      {/* SLO Health */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">SLO Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">ACK Latency (P95)</div>
            <div className={`text-2xl font-bold ${health?.slo.ackLatency.healthy ? 'text-green-600' : 'text-red-600'}`}>
              {health?.slo.ackLatency.p95Ms}ms
            </div>
            <div className="text-xs text-gray-500">Target: {health?.slo.ackLatency.targetP95Ms}ms</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Clock Skew (P95)</div>
            <div className={`text-2xl font-bold ${health?.slo.clockSkew.healthy ? 'text-green-600' : 'text-red-600'}`}>
              {health?.slo.clockSkew.p95Ms}ms
            </div>
            <div className="text-xs text-gray-500">Target: {health?.slo.clockSkew.targetP95Ms}ms</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Error Rate</div>
            <div className={`text-2xl font-bold ${health?.slo.errorRate.healthy ? 'text-green-600' : 'text-red-600'}`}>
              {health?.slo.errorRate.current}%
            </div>
            <div className="text-xs text-gray-500">Target: &lt;{health?.slo.errorRate.targetPercent}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Coverage</div>
            <div className={`text-2xl font-bold ${health?.slo.coverage.healthy ? 'text-green-600' : 'text-red-600'}`}>
              {health?.slo.coverage.current}%
            </div>
            <div className="text-xs text-gray-500">Target: &gt;{health?.slo.coverage.targetPercent}%</div>
          </div>
        </div>
      </Card>

      {/* Key Rotation Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Key Rotation Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Active Keys</div>
            <div className="text-2xl font-bold">{health?.keyRotation.activeKeys}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Needs Rotation</div>
            <div className={`text-2xl font-bold ${health?.keyRotation.needsRotation === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {health?.keyRotation.needsRotation}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Critical</div>
            <div className={`text-2xl font-bold ${health?.keyRotation.critical === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {health?.keyRotation.critical}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Min Days Until Rotation</div>
            <div className="text-2xl font-bold">
              {health?.keyRotation.minDaysUntilRotation !== null ? health?.keyRotation.minDaysUntilRotation : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Governance Gates */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Governance Gates (G13–G21)</h2>
        <div className="space-y-3">
          {governance && Object.entries(governance.gates).map(([gateId, gate]) => (
            <div key={gateId} className="border rounded p-4">
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
                  {Object.entries(gate.kpis).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">{key}</div>
                      <div className="font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
