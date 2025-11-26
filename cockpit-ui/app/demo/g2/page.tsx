"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MotionCard } from "@/components/ui/motion-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { PulseIndicator } from "@/components/ui/pulse-indicator";
import { BounceBadge } from "@/components/ui/bounce-badge";
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

  // Calculate trust score from recovery rate
  const trustScore = Math.round(kpi.recovery_rate_7d * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <GovernanceHeaderStrip title="Gate 2 Demo — Payment Recovery" status="active" />

      <div className="p-6 space-y-6">
        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold">Voltek Demo Dashboard</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              DEMO MODE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ProofFreshnessIndicator lastUpdated={lastUpdated} freshnessThresholdMinutes={5} />
          </div>
        </motion.div>

        {/* Confidence Meter */}
        <MotionCard delay={0.2} className="p-4">
          <div className="max-w-md">
            <PulseIndicator intensity="subtle">
              <ConfidenceMeterAnimated trust={trustScore} />
            </PulseIndicator>
          </div>
        </MotionCard>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MotionCard delay={0.3} className="p-4">
            <div className="text-sm text-gray-500">Total Recoverable</div>
            <div className="text-2xl font-bold">
              <AnimatedNumber
                value={data.summary.total_recoverable}
                prefix="RM "
                duration={1.5}
                delay={0.4}
              />
            </div>
          </MotionCard>
          <MotionCard delay={0.4} className="p-4">
            <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
            <div className="text-2xl font-bold">
              <AnimatedNumber
                value={Math.round(kpi.recovery_rate_7d * 100)}
                suffix="%"
                duration={1.2}
                delay={0.5}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Avg days to pay: <AnimatedNumber value={kpi.average_days_to_payment} delay={0.6} />
            </div>
          </MotionCard>
          <MotionCard delay={0.5} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Cases</div>
                <div className="text-xl font-semibold">
                  <AnimatedNumber value={kpi.pending_cases} delay={0.6} />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Handover Queue</div>
                <div className="text-xl font-semibold">
                  <AnimatedNumber value={kpi.handover_queue} delay={0.7} />
                </div>
              </div>
            </div>
          </MotionCard>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Critical Leads */}
          <MotionCard delay={0.6} className="p-4">
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
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.7 + idx * 0.1 }}
                        className="border-t"
                      >
                        <td className="py-2 pr-4">{r.name}</td>
                        <td className="py-2 pr-4">
                          <BounceBadge
                            active={r.stage === "OVERDUE"}
                            className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium"
                          >
                            {r.stage}
                          </BounceBadge>
                        </td>
                        <td className="py-2 pr-4">{fmMYR.format(r.amount)}</td>
                        <td className="py-2 pr-4">{r.overdue_days}d</td>
                        <td className="py-2">{fmDT.format(new Date(r.last_reminder_at))}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MotionCard>

          {/* Right column stack */}
          <div className="grid grid-cols-1 gap-4">
            <MotionCard delay={0.7} className="p-4">
              <div className="text-lg font-semibold mb-3">Active Reminders</div>
              {data.active_reminders.length === 0 ? (
                <p className="text-sm text-gray-500">No active reminders scheduled.</p>
              ) : (
                <ul aria-label="Active reminders" className="space-y-2">
                  {data.active_reminders.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
                      className="flex items-center justify-between border rounded px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{r.recipient}</div>
                        <div className="text-xs text-gray-500">
                          {r.channel} · {fmDT.format(new Date(r.scheduled_at))}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </MotionCard>

            <MotionCard delay={0.8} className="p-4">
              <div className="text-lg font-semibold mb-3">Recent Success</div>
              {data.recent_success.length === 0 ? (
                <p className="text-sm text-gray-500">No recent payments.</p>
              ) : (
                <ul aria-label="Recent payments" className="space-y-2">
                  {data.recent_success.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
                      className="flex items-center justify-between border rounded px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">
                          Paid {fmDT.format(new Date(r.paid_at))} · {r.days_to_pay} days
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{fmMYR.format(r.amount)}</div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </MotionCard>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center text-sm text-gray-500 py-4"
        >
          Powered by Qontrek Engine · Trust Index {trustScore}% · Tower Federation Certified
        </motion.div>
      </div>
    </motion.div>
  );
}
