"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ConfidenceMeterAnimated } from "@/components/voltek/ConfidenceMeterAnimated";
import { logProofLoad } from "@/lib/telemetry";
import { useCountUpValue } from "@/lib/hooks/useCountUpValue";
import { getMotionProps } from "@/lib/utils/motion";
import type { G2Response } from "@/types/gates";

async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
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

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        // Prevent double telemetry in Next.js StrictMode (dev only)
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      }
    })();
  }, []);

  if (error) return <div className="p-6"><p className="text-red-600" aria-live="polite">Error: {error}</p></div>;
  if (!payload) return <div className="p-6">Loading...</div>;

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  // Animated values for KPIs
  const totalRecoverable = useCountUpValue(Number(data.summary.total_recoverable || 0), 1.2, 0.1);
  const pendingCases = useCountUpValue(Number(kpi["pending_cases"] || 0), 1.2, 0.2);
  const handoverQueue = useCountUpValue(Number(kpi["handover_queue"] || 0), 1.2, 0.3);

  return (
    <motion.div
      className="p-6 space-y-6"
      {...getMotionProps({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
      })}
    >
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
              {fmMYR.format(totalRecoverable)}
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
            <div className="text-2xl font-bold">{pct(kpi["recovery_rate_7d"])}</div>
            <div className="text-xs text-gray-500 mt-2">Avg days to pay: {kpi["average_days_to_payment"] ?? "-"}</div>
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

      {/* Trust Index Meter */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Leads */}
        <motion.div
          {...getMotionProps({
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.5, duration: 0.6 },
          })}
        >
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
                    {data.critical_leads.map((r: any, idx: number) => {
                      const isUrgent = typeof r.overdue_days === "number" && r.overdue_days > 20;
                      return (
                        <motion.tr
                          key={idx}
                          className="border-t"
                          {...getMotionProps({
                            initial: { opacity: 0, x: -20 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: 0.6 + idx * 0.05, duration: 0.4 },
                            whileHover: {
                              scale: 1.02,
                              backgroundColor: "rgba(0, 0, 0, 0.02)",
                              transition: { duration: 0.2 },
                            },
                          })}
                        >
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              {r.name ?? "-"}
                              {isUrgent && (
                                <motion.span
                                  className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded"
                                  {...getMotionProps({
                                    animate: {
                                      scale: [1, 1.1, 1],
                                      rotate: [0, 5, -5, 0],
                                    },
                                    transition: {
                                      duration: 0.5,
                                      repeat: Infinity,
                                      repeatDelay: 2,
                                    },
                                  })}
                                >
                                  URGENT
                                </motion.span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 pr-4">{r.stage ?? "-"}</td>
                          <td className="py-2 pr-4">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</td>
                          <td className="py-2 pr-4">
                            <span className={isUrgent ? "text-red-600 font-semibold" : ""}>
                              {typeof r.overdue_days === "number" ? `${r.overdue_days}d` : "-"}
                            </span>
                          </td>
                          <td className="py-2">{r.last_reminder_at ? fmDT.format(new Date(r.last_reminder_at)) : "-"}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Right column stack */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.6, duration: 0.6 },
            })}
          >
            <Card className="p-4">
              <div className="text-lg font-semibold mb-3">Active Reminders</div>
              {data.active_reminders.length === 0 ? (
                <p className="text-sm text-gray-500">No active reminders scheduled.</p>
              ) : (
                <ul aria-label="Active reminders" className="space-y-2">
                  {data.active_reminders.map((r: any, i: number) => (
                    <motion.li
                      key={i}
                      className="flex items-center justify-between border rounded px-3 py-2"
                      {...getMotionProps({
                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.7 + i * 0.05, duration: 0.4 },
                        whileHover: {
                          scale: 1.02,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transition: { duration: 0.2 },
                        },
                      })}
                    >
                      <div>
                        <div className="font-medium">{r.recipient ?? "-"}</div>
                        <div className="text-xs text-gray-500">{r.channel ?? "-"} · {r.scheduled_at ? fmDT.format(new Date(r.scheduled_at)) : "-"}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status ?? "-"}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>

          <motion.div
            {...getMotionProps({
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: 0.7, duration: 0.6 },
            })}
          >
            <Card className="p-4">
              <div className="text-lg font-semibold mb-3">Recent Success</div>
              {data.recent_success.length === 0 ? (
                <p className="text-sm text-gray-500">No recent payments.</p>
              ) : (
                <ul aria-label="Recent payments" className="space-y-2">
                  {data.recent_success.map((r: any, i: number) => (
                    <motion.li
                      key={i}
                      className="flex items-center justify-between border rounded px-3 py-2"
                      {...getMotionProps({
                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.8 + i * 0.05, duration: 0.4 },
                        whileHover: {
                          scale: 1.02,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transition: { duration: 0.2 },
                        },
                      })}
                    >
                      <div>
                        <div className="font-medium">{r.name ?? "-"}</div>
                        <div className="text-xs text-gray-500">Paid {r.paid_at ? fmDT.format(new Date(r.paid_at)) : "-"} · {typeof r.days_to_pay === "number" ? `${r.days_to_pay} days` : "-"}</div>
                      </div>
                      <div className="text-sm font-semibold">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
