"use client";

import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { useCountUpValue } from '@/lib/hooks/useCountUpValue';
import { getMotionProps } from '@/lib/utils/motion';
import type { G2Payload } from "@/types/gates";

interface DashboardProps {
  data: G2Payload;
}

export default function Dashboard({ data }: DashboardProps) {
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;

  // Formatters
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  // Animated KPI values with staggered delays
  const animatedTotal = useCountUpValue(Number(data.summary.total_recoverable) || 0, 1.2, 0, 0);
  const animatedRecovery7d = useCountUpValue(
    typeof kpi["recovery_rate_7d"] === "number" ? kpi["recovery_rate_7d"] * 100 : 0,
    1.2, 0.1, 1
  );
  const animatedAvgDays = useCountUpValue(
    typeof kpi["average_days_to_payment"] === "number" ? kpi["average_days_to_payment"] : 0,
    1.2, 0.15, 1
  );
  const animatedPendingCases = useCountUpValue(
    typeof kpi["pending_cases"] === "number" ? kpi["pending_cases"] : 0,
    1.2, 0.2, 0
  );
  const animatedHandoverQueue = useCountUpValue(
    typeof kpi["handover_queue"] === "number" ? kpi["handover_queue"] : 0,
    1.2, 0.25, 0
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Gate 2 — Payment Recovery</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Recoverable</div>
          <motion.div
            {...(getMotionProps() ?? {})}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold"
          >
            {fmMYR.format(animatedTotal)}
          </motion.div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
          <motion.div
            {...(getMotionProps() ?? {})}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold"
          >
            {animatedRecovery7d.toFixed(1)}%
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-gray-500 mt-2"
          >
            Avg days to pay: {animatedAvgDays.toFixed(1)}
          </motion.div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Cases</div>
              <motion.div
                {...(getMotionProps() ?? {})}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl font-semibold"
              >
                {Math.round(animatedPendingCases)}
              </motion.div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Handover Queue</div>
              <motion.div
                {...(getMotionProps() ?? {})}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="text-xl font-semibold"
              >
                {Math.round(animatedHandoverQueue)}
              </motion.div>
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
            <div className="space-y-2">
              {data.critical_leads.map((r: any, idx: number) => {
                const overdueDays = typeof r.overdue_days === "number" ? r.overdue_days : 0;
                const isUrgent = overdueDays > 20;

                return (
                  <motion.div
                    key={r.id ?? idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transition: { duration: 0.2 },
                    }}
                    className="flex items-center justify-between border rounded-lg p-3 cursor-pointer"
                    data-testid={`lead-row-${r.id ?? idx}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{r.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {r.stage ?? "-"} · {typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600">
                        {overdueDays}d overdue
                      </div>
                      {isUrgent && (
                        <motion.span
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold"
                        >
                          URGENT
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{
                      scale: 1.01,
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transition: { duration: 0.2 },
                    }}
                    className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{r.recipient ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {r.channel ?? "-"} · {r.scheduled_at ? fmDT.format(new Date(r.scheduled_at)) : "-"}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status ?? "-"}</span>
                  </motion.li>
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
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{
                      scale: 1.01,
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transition: { duration: 0.2 },
                    }}
                    className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{r.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        Paid {r.paid_at ? fmDT.format(new Date(r.paid_at)) : "-"} · {typeof r.days_to_pay === "number" ? `${r.days_to_pay} days` : "-"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
