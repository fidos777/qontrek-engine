"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import ConfidenceMeterAnimated from "@/components/voltek/ConfidenceMeterAnimated";
import { getMotionProps } from "@/lib/utils/motion";
import { useCountUpValue } from "@/lib/hooks/useCountUpValue";
import { showInfoToast } from "@/lib/utils/toast-helpers";

// Governance pack
import GovernanceHeaderStrip from "@/components/voltek/GovernanceHeaderStrip";
import ProofFreshnessIndicator from "@/components/voltek/ProofFreshnessIndicator";

// Types (local fallback for leads to avoid TS breaks)
import type { G2Response } from "@/types/gates";
type G2Lead = {
  name?: string;
  stage?: string;
  amount?: number;
  overdue_days?: number;
  last_reminder?: string;
};

// Helpers (currency + percentage)
const fmtMYR = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 0,
});
const pct = (v: unknown) => {
  if (typeof v === "number") return `${(v * 100).toFixed(0)}%`;
  const n = Number(v);
  return isNaN(n) ? "-" : `${(n * 100).toFixed(0)}%`;
};

// Data fetch with dev fallback
async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // dev fallback to mock route
    const res = await fetch("/api/gates/g2/summary");
    if (!res.ok) throw new Error("G2 summary endpoint unavailable");
    return await res.json();
  }
}

export default function Gate2Dashboard() {
  const [payload, setPayload] = useState<G2Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);
  const [selectedLead, setSelectedLead] = useState<G2Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [dataLoadedAt, setDataLoadedAt] = useState<Date>(new Date());

  // Always call hooks in the same order every render.
  // (We feed 0/empty defaults when data is not yet available.)
  const kpi = (payload?.summary?.kpi ?? {}) as Record<string, number | string>;
  const totalRecoverableTarget = Number(payload?.summary?.total_recoverable ?? 0);
  const pendingCasesTarget = Number(kpi["pending_cases"] ?? 0);
  const handoverQueueTarget = Number(kpi["handover_queue"] ?? 0);

  const totalRecoverable = useCountUpValue(totalRecoverableTarget, 1.2, 0);
  const pendingCases = useCountUpValue(pendingCasesTarget, 1.2, 0.2);
  const handoverQueue = useCountUpValue(handoverQueueTarget, 1.2, 0.3);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        setDataLoadedAt(new Date());
        if (!telemetrySent.current) {
          window.dispatchEvent(
            new CustomEvent("proof.updated", {
              detail: { freshness: 0, source: resp?.source || "real" },
            })
          );
          telemetrySent.current = true;
        }
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

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-4 text-red-600" aria-live="assertive">
          Failed to load dashboard: {error}
        </Card>
      </div>
    );
  }

  // Main layout
  return (
    <>
      {/* Governance strip always gets a Date */}
      <GovernanceHeaderStrip lastSync={dataLoadedAt} />

      <motion.div
        className="p-6 space-y-6"
        {...getMotionProps({
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5 },
        })}
      >
        {/* Header with Proof Freshness */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Gate 2 — Payment Recovery</h1>
          <ProofFreshnessIndicator loadedAt={dataLoadedAt} />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1, duration: 0.6 },
            })}
          >
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
          </motion.div>

          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.2, duration: 0.6 },
            })}
          >
            <Card className="p-4">
              <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
              <div className="text-2xl font-bold">
                {pct(kpi["recovery_rate_7d"])}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Avg days to pay: {kpi["avg_days_to_pay"] ?? "–"}
              </div>
            </Card>
          </motion.div>

          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.3, duration: 0.6 },
            })}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Pending Cases</div>
                  <motion.div
                    className="text-xl font-semibold"
                    {...getMotionProps({
                      initial: { scale: 0.8 },
                      animate: { scale: 1 },
                      transition: { delay: 0.4, duration: 0.5, type: "spring" },
                    })}
                  >
                    {pendingCases}
                  </motion.div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Handover Queue</div>
                  <motion.div
                    className="text-xl font-semibold"
                    {...getMotionProps({
                      initial: { scale: 0.8 },
                      animate: { scale: 1 },
                      transition: { delay: 0.5, duration: 0.5, type: "spring" },
                    })}
                  >
                    {handoverQueue}
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Trust Index */}
        <motion.div
          {...getMotionProps({
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4, duration: 0.6 },
          })}
        >
          <Card className="p-4">
            <ConfidenceMeterAnimated value={100} label="Trust Index" />
          </Card>
        </motion.div>

        {/* Critical Leads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.5, duration: 0.6 },
            })}
          >
            <Card className="p-4">
              <div className="text-lg font-semibold mb-3">Critical Leads</div>
              {!payload?.data?.critical_leads?.length ? (
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
                      {payload.data.critical_leads.map((r: G2Lead, idx: number) => (
                        <motion.tr
                          key={idx}
                          className="border-t cursor-pointer hover:bg-gray-50 transition"
                          {...getMotionProps({
                            initial: { opacity: 0, y: 5 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: idx * 0.05, duration: 0.4 },
                          })}
                          onClick={() => handleLeadClick(r)}
                        >
                          <td className="py-2 pr-4">{r.name ?? "–"}</td>
                          <td className="py-2 pr-4">{r.stage ?? "–"}</td>
                          <td className="py-2 pr-4">{fmtMYR.format(r.amount ?? 0)}</td>
                          <td className="py-2 pr-4">{r.overdue_days ?? "–"}d</td>
                          <td className="py-2">{r.last_reminder ?? "–"}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Right column: Active Reminders & Recent Success can stay as you had them */}
          {/* … (keep your existing cards / animations here) … */}
        </div>
      </motion.div>

      {/* If you want Lead modal active, render it here when available */}
      {/* {isLeadModalOpen && selectedLead && (
        <LeadModal open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen} lead={selectedLead} onAction={handleAction} />
      )} */}
    </>
  );
}

