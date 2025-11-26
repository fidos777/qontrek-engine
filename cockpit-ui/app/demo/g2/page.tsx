"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import ConfidenceMeterAnimated from "@/components/voltek/ConfidenceMeterAnimated";
import GovernanceHeaderStrip from "@/components/voltek/GovernanceHeaderStrip";
import ProofFreshnessIndicator from "@/components/voltek/ProofFreshnessIndicator";

// Static demo data - no API call needed for demo
const DEMO_DATA = {
  ok: true,
  rel: "g2_dashboard_v19.1.json",
  source: "demo",
  schemaVersion: "1.0.0",
  data: {
    summary: {
      total_recoverable: 152500,
      kpi: {
        recovery_rate_7d: 0.68,
        recovery_rate_30d: 0.82,
        average_days_to_payment: 8,
        pending_cases: 14,
        handover_queue: 5,
      },
    },
    critical_leads: [
      {
        name: "Alpha Engineering",
        stage: "OVERDUE",
        amount: 18500,
        overdue_days: 19,
        last_reminder_at: "2025-10-14T03:20:00.000Z",
      },
      {
        name: "Seri Mutiara Builders",
        stage: "OVERDUE",
        amount: 22800,
        overdue_days: 22,
        last_reminder_at: "2025-10-12T09:15:00.000Z",
      },
      {
        name: "Metro Solar Sdn Bhd",
        stage: "OVERDUE",
        amount: 9900,
        overdue_days: 17,
        last_reminder_at: "2025-10-15T01:40:00.000Z",
      },
    ],
    active_reminders: [
      {
        recipient: "alpha.finance@alphaeng.my",
        channel: "email",
        scheduled_at: "2025-10-21T02:00:00.000Z",
        status: "queued",
      },
      {
        recipient: "+60-12-345-6678",
        channel: "whatsapp",
        scheduled_at: "2025-10-21T06:30:00.000Z",
        status: "queued",
      },
    ],
    recent_success: [
      {
        name: "Bina Maju Trading",
        stage: "PAID",
        amount: 12500,
        paid_at: "2025-10-19T08:10:00.000Z",
        days_to_pay: 9,
      },
      {
        name: "Kemuncak Glass",
        stage: "PAID",
        amount: 7800,
        paid_at: "2025-10-18T04:55:00.000Z",
        days_to_pay: 12,
      },
    ],
  },
};

export default function DemoGate2Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate loading for demo effect
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo data...</p>
        </div>
      </div>
    );
  }

  const { data } = DEMO_DATA;
  const kpi = data.summary.kpi;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  // Calculate trust score from recovery rate
  const trustScore = Math.round(kpi.recovery_rate_7d * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <GovernanceHeaderStrip title="Gate 2 Demo — Payment Recovery" status="active" />

      <div className="p-6 space-y-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Voltek Demo Dashboard</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              DEMO MODE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ProofFreshnessIndicator lastUpdated={lastUpdated} freshnessThresholdMinutes={5} />
          </div>
        </div>

        {/* Confidence Meter */}
        <Card className="p-4">
          <div className="max-w-md">
            <ConfidenceMeterAnimated trust={trustScore} />
          </div>
        </Card>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Recoverable</div>
            <div className="text-2xl font-bold">{fmMYR.format(data.summary.total_recoverable)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
            <div className="text-2xl font-bold">{pct(kpi.recovery_rate_7d)}</div>
            <div className="text-xs text-gray-500 mt-2">Avg days to pay: {kpi.average_days_to_payment}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Cases</div>
                <div className="text-xl font-semibold">{kpi.pending_cases}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Handover Queue</div>
                <div className="text-xl font-semibold">{kpi.handover_queue}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Critical Leads */}
          <Card className="p-4">
            <div className="text-lg font-semibold mb-3">Critical Leads</div>
            {data.critical_leads.length === 0 ? (
              <p className="text-sm text-gray-500">No critical overdue leads.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr>
                      <th scope="col" className="py-2 pr-4">Name</th>
                      <th scope="col" className="py-2 pr-4">Stage</th>
                      <th scope="col" className="py-2 pr-4">Amount</th>
                      <th scope="col" className="py-2 pr-4">Overdue</th>
                      <th scope="col" className="py-2">Last Reminder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.critical_leads.map((r, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{r.name}</td>
                        <td className="py-2 pr-4">{r.stage}</td>
                        <td className="py-2 pr-4">{fmMYR.format(r.amount)}</td>
                        <td className="py-2 pr-4">{r.overdue_days}d</td>
                        <td className="py-2">{fmDT.format(new Date(r.last_reminder_at))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Right column stack */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <div className="text-lg font-semibold mb-3">Active Reminders</div>
              {data.active_reminders.length === 0 ? (
                <p className="text-sm text-gray-500">No active reminders scheduled.</p>
              ) : (
                <ul aria-label="Active reminders" className="space-y-2">
                  {data.active_reminders.map((r, i) => (
                    <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                      <div>
                        <div className="font-medium">{r.recipient}</div>
                        <div className="text-xs text-gray-500">
                          {r.channel} · {fmDT.format(new Date(r.scheduled_at))}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <div className="text-lg font-semibold mb-3">Recent Success</div>
              {data.recent_success.length === 0 ? (
                <p className="text-sm text-gray-500">No recent payments.</p>
              ) : (
                <ul aria-label="Recent payments" className="space-y-2">
                  {data.recent_success.map((r, i) => (
                    <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">
                          Paid {fmDT.format(new Date(r.paid_at))} · {r.days_to_pay} days
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{fmMYR.format(r.amount)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          Powered by Qontrek Engine · Trust Index {trustScore}% · Tower Federation Certified
        </div>
      </div>
    </div>
  );
}
