"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { G2Response } from "@/types/gates";

// Static demo data for production builds
const DEMO_DATA: G2Response = {
  ok: true,
  rel: "g2_dashboard_demo.json",
  source: "fallback",
  schemaVersion: "1.0.0",
  data: {
    summary: {
      total_recoverable: 152500,
      kpi: {
        recovery_rate_7d: 0.32,
        recovery_rate_30d: 0.58,
        average_days_to_payment: 11,
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

export default function Gate2Dashboard() {
  const [payload] = useState<G2Response>(DEMO_DATA);

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  return (
    <div className="p-6 space-y-6">
      <GovernanceHeaderStrip title="G2 Payment Recovery" status="active" />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Gate 2 — Payment Recovery</h1>
        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
          DEMO MODE
        </span>
        <ProofFreshnessIndicator lastUpdated={DEMO_DATA.data.recent_success[0]?.paid_at} />
      </div>

      <ConfidenceMeterAnimated trust={Math.round((kpi["recovery_rate_30d"] as number) * 100)} />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Recoverable</div>
          <div className="text-2xl font-bold">{fmMYR.format(Number(data.summary.total_recoverable || 0))}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
          <div className="text-2xl font-bold">{pct(kpi["recovery_rate_7d"])}</div>
          <div className="text-xs text-gray-500 mt-2">Avg days to pay: {kpi["average_days_to_payment"] ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Cases</div>
              <div className="text-xl font-semibold">{kpi["pending_cases"] ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Handover Queue</div>
              <div className="text-xl font-semibold">{kpi["handover_queue"] ?? 0}</div>
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
                  {data.critical_leads.map((r: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{r.name ?? "-"}</td>
                      <td className="py-2 pr-4">{r.stage ?? "-"}</td>
                      <td className="py-2 pr-4">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</td>
                      <td className="py-2 pr-4">{typeof r.overdue_days === "number" ? `${r.overdue_days}d` : "-"}</td>
                      <td className="py-2">{r.last_reminder_at ? fmDT.format(new Date(r.last_reminder_at)) : "-"}</td>
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
                {data.active_reminders.map((r: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="font-medium">{r.recipient ?? "-"}</div>
                      <div className="text-xs text-gray-500">{r.channel ?? "-"} · {r.scheduled_at ? fmDT.format(new Date(r.scheduled_at)) : "-"}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status ?? "-"}</span>
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
                {data.recent_success.map((r: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="font-medium">{r.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">Paid {r.paid_at ? fmDT.format(new Date(r.paid_at)) : "-"} · {typeof r.days_to_pay === "number" ? `${r.days_to_pay} days` : "-"}</div>
                    </div>
                    <div className="text-sm font-semibold">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
