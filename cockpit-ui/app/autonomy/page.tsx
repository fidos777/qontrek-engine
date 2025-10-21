"use client";

import { useEffect, useState } from "react";
import AutonomyStatus from "../components/AutonomyStatus";
import PerChannelGauges from "../components/PerChannelGauges";
import ChangeReceipts from "../components/ChangeReceipts";
import type { TowerSummary, TowerChannelMetrics } from "./types";

type ChangeReceiptIndex = {
  receipts: Array<{
    receipt_id: string;
    issued_at: string;
    change_type: string;
    summary: string;
    diff_hash: string;
  }>;
};

export default function AutonomyDashboard() {
  const [summary, setSummary] = useState<TowerSummary | null>(null);
  const [receipts, setReceipts] = useState<ChangeReceiptIndex["receipts"]>([]);

  useEffect(() => {
    const load = async () => {
      const [summaryRes, receiptsRes] = await Promise.all([
        fetch("/proof/tower_sync_summary.json"),
        fetch("/proof/change_receipt_index.json"),
      ]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
      if (receiptsRes.ok) {
        const data = await receiptsRes.json();
        setReceipts(data.receipts ?? []);
      }
    };
    load().catch((error) => console.error("Failed to load autonomy dashboard", error));
  }, []);

  if (!summary) {
    return <div className="p-8 text-center text-slate-500">Loading autonomy metrics…</div>;
  }

  const { kpis } = summary;
  const fallbackChannels: Record<string, TowerChannelMetrics> = {
    slack: {
      ack_rate: kpis.ack_rate_24h_slack ?? kpis.ack_rate_24h,
      latency_p95_ms: kpis.latency_p95_ms_slack ?? kpis.alert_action_latency_ms_p95,
    },
    whatsapp: {
      ack_rate: kpis.ack_rate_24h_wa ?? kpis.ack_rate_24h,
      latency_p95_ms: kpis.latency_p95_ms_wa ?? kpis.alert_action_latency_ms_p95,
    },
    email: {
      ack_rate: kpis.ack_rate_24h_email ?? kpis.ack_rate_24h,
      latency_p95_ms: kpis.latency_p95_ms_email ?? kpis.alert_action_latency_ms_p95,
    },
  };
  const channels = summary.channels ?? fallbackChannels;

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <AutonomyStatus summary={summary} />
      <PerChannelGauges channels={channels} />
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Change Receipts</h2>
        <ChangeReceipts receipts={receipts} />
      </section>
    </main>
  );
}
