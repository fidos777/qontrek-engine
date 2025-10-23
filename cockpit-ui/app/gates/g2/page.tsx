"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ConfidenceMeterAnimated } from "@/components/voltek/ConfidenceMeterAnimated";
import { logProofLoad } from "@/lib/telemetry";
import { useCountUpValue } from "@/lib/hooks/useCountUpValue";
import { getMotionProps } from "@/lib/utils/motion";
import type { G2Response, G2Lead } from "@/types/gates";
import { LeadModal } from "@/components/voltek/LeadModal";
import { usePaymentSuccess } from "@/lib/hooks/usePaymentSuccess";
import { useProofSync } from "@/lib/hooks/useProofSync";
import { showInfoToast } from "@/lib/utils/toast-helpers";

// R1.5.2 – Governance Feedback Layer
import GovernanceHeaderStrip from "@/components/voltek/GovernanceHeaderStrip";
import HologramBadge from "@/components/voltek/HologramBadge";
import ProofFreshnessIndicator from "@/components/voltek/ProofFreshnessIndicator";
import { useAISuggestions } from "@/lib/hooks/useAISuggestions";

async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g2.summary.json");
      return mod.default as G2Response;
    }
    throw new Error("G2 summary endpoint unavailable");
  }
}

export default function Gate2Dashboard() {
  const [payload, setPayload] = useState<G2Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);
  const [selectedLead, setSelectedLead] = useState<G2Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const dataLoadedAt = new Date().toISOString();

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
        window.dispatchEvent(
          new CustomEvent("proof.updated", {
            detail: { freshness: 0, source: resp?.source || "real" },
          })
        );
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      }
    })();
  }, []);

  const handleLeadClick = (lead: G2Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleAction = (
    action: "call" | "sms" | "whatsapp",
    lead: G2Lead
  ) => {
    showInfoToast(`Preparing ${action} for ${lead.name || "lead"}...`);
  };

  usePaymentSuccess(payload?.data?.recent_success || []);
  useProofSync();

  if (error)
    return (
      <div className="p-6 text-red-600" aria-live="assertive">
        {error}
      </div>
    );

  if (!payload)
    return (
      <div className="p-6 text-gray-500" aria-live="polite">
        Loading...
      </div>
    );

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmtMYR = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  });
  const pct = (v: unknown) =>
    typeof v === "number" ? `${Math.round(v * 100)}%` : "—";

  const totalRecoverable = useCountUpValue(Number(data.summary.total_recoverable || 0), 1.2, 0.3);
  const pendingCases = useCountUpValue(Number(kpi["pending_cases"] || 0), 1.2, 0.3);
  const handoverQueue = useCountUpValue(Number(kpi["handover_queue"] || 0), 1.2, 0.3);

  return (
    <>
      {/* Governance + Animated Header */}
      <GovernanceHeaderStrip lastSync={dataLoadedAt} />

      <motion.div
        className="p-6 space-y-6"
        {...getMotionProps({
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5 },
        })}
      >
        <div className="flex items-center justify-between">
          <motion.h1
            className="text-2xl font-semibold"
            {...getMotionProps({
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 },
            })}
          >
            Gate 2 — Payment Recovery
          </motion.h1>

          <ProofFreshnessIndicator freshness={data.summary.freshness} />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Recoverable</div>
            <motion.div
              className="text-2xl font-bold"
              {...getMotionProps({
                initial: { scale: 0.8 },
                animate: { scale: 1 },
                transition: { delay: 0.2, duration: 0.5, type: "spring" },
              })}
            >
              {fmtMYR.format(totalRecoverable)}
            </motion.div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
            <div className="text-2xl font-bold">{pct(kpi["recovery_rate_7d"])}</div>
            <div className="text-xs text-gray-500 mt-2">
              Avg days to pay: {kpi["avg_days_to_pay"] ?? "—"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Cases</div>
                <div className="text-xl font-semibold">{pendingCases}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Handover Queue</div>
                <div className="text-xl font-semibold">{handoverQueue}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Trust Index Meter */}
        <Card className="p-4">
          <ConfidenceMeterAnimated value={100} label="Trust Index" />
        </Card>

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
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Stage</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Overdue</th>
                    <th className="py-2">Last Reminder</th>
                  </tr>
                </thead>
                <tbody>
                  {data.critical_leads.map((r: any, idx: number) => (
                    <motion.tr
                      key={idx}
                      className="border-t cursor-pointer hover:bg-gray-50 transition"
                      {...getMotionProps({
                        initial: { opacity: 0, y: 5 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: idx * 0.05, duration: 0.4 },
                      })}
                      onClick={() => handleLeadClick(r as G2Lead)}
                    >
                      <td className="py-2 pr-4">{r.name ?? "—"}</td>
                      <td className="py-2 pr-4">{r.stage ?? "—"}</td>
                      <td className="py-2 pr-4">{fmtMYR.format(r.amount ?? 0)}</td>
                      <td className="py-2 pr-4">{r.overdue_days ?? "—"}d</td>
                      <td className="py-2">{r.last_reminder ?? "—"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </>
  );
}

