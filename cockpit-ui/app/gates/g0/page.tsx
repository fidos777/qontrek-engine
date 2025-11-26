"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/ui/motion-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { BounceBadge } from "@/components/ui/bounce-badge";
import type { G0Response } from "@/types/gates";

// Static demo data for production builds
const DEMO_DATA: G0Response = {
  ok: true,
  rel: "g0_dashboard_demo.json",
  source: "fallback",
  schemaVersion: "1.0.0",
  data: {
    summary: {
      total_leads: 150,
      hot_leads: 32,
      warm_leads: 68,
      cold_leads: 50,
      conversion_rate: 0.21,
      avg_response_time: 4.3,
      leads_today: 12,
      qualified_rate: 0.67,
    },
    activity: [
      {
        id: "L001",
        company: "TechCorp Sdn Bhd",
        contact: "Ahmad bin Hassan",
        status: "hot",
        score: 92,
        source: "Website Form",
        created_at: "2025-10-21T03:15:00.000Z",
        last_contact: "2025-10-21T08:30:00.000Z",
        response_time: 2.5,
      },
      {
        id: "L002",
        company: "Green Energy Solutions",
        contact: "Siti Nurhaliza",
        status: "hot",
        score: 88,
        source: "LinkedIn",
        created_at: "2025-10-20T14:20:00.000Z",
        last_contact: "2025-10-21T09:10:00.000Z",
        response_time: 3.2,
      },
      {
        id: "L003",
        company: "Metro Builders",
        contact: "David Tan",
        status: "warm",
        score: 72,
        source: "Referral",
        created_at: "2025-10-20T10:45:00.000Z",
        last_contact: "2025-10-21T07:20:00.000Z",
        response_time: 4.8,
      },
      {
        id: "L004",
        company: "Alpha Logistics",
        contact: "Lee Mei Ling",
        status: "warm",
        score: 68,
        source: "Google Ads",
        created_at: "2025-10-19T16:30:00.000Z",
        last_contact: "2025-10-20T11:15:00.000Z",
        response_time: 5.1,
      },
      {
        id: "L005",
        company: "Sunrise Trading",
        contact: "Kumar Rajesh",
        status: "cold",
        score: 45,
        source: "Cold Outreach",
        created_at: "2025-10-18T09:00:00.000Z",
        last_contact: "2025-10-19T13:30:00.000Z",
        response_time: 7.2,
      },
      {
        id: "L006",
        company: "Bright Future Consultancy",
        contact: "Nurul Huda",
        status: "hot",
        score: 85,
        source: "Website Form",
        created_at: "2025-10-21T06:00:00.000Z",
        last_contact: "2025-10-21T08:45:00.000Z",
        response_time: 2.8,
      },
    ],
  },
};

export default function Gate0Dashboard() {
  const [payload] = useState<G0Response>(DEMO_DATA);

  const { data } = payload;
  const summary = data.summary;

  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmTime = (v: unknown) => (typeof v === "number" ? `${v.toFixed(1)}h` : "-");

  // Split activity by status
  const hotLeads = data.activity.filter((a: any) => a.status === "hot");
  const warmLeads = data.activity.filter((a: any) => a.status === "warm");
  const coldLeads = data.activity.filter((a: any) => a.status === "cold");

  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <h1 className="text-2xl font-semibold">Gate 0 — Lead Qualification</h1>
        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
          DEMO MODE
        </span>
      </motion.div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MotionCard delay={0.2} className="p-4">
          <div className="text-sm text-gray-500">Total Leads</div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={Number(summary.total_leads) || 0} delay={0.3} />
          </div>
        </MotionCard>
        <MotionCard delay={0.3} className="p-4">
          <div className="text-sm text-gray-500">Conversion Rate</div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={Math.round(Number(summary.conversion_rate || 0) * 100)} suffix="%" delay={0.4} />
          </div>
        </MotionCard>
        <MotionCard delay={0.4} className="p-4">
          <div className="text-sm text-gray-500">Avg Response Time</div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={Number(summary.avg_response_time) || 0} decimals={1} suffix="h" delay={0.5} />
          </div>
        </MotionCard>
        <MotionCard delay={0.5} className="p-4">
          <div className="text-sm text-gray-500">Qualified Rate</div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={Math.round(Number(summary.qualified_rate || 0) * 100)} suffix="%" delay={0.6} />
          </div>
        </MotionCard>
      </div>

      {/* Lead Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Lead qualification panels">
        {/* Hot Leads Panel */}
        <MotionCard delay={0.6} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Hot Leads</h2>
            <div className="flex items-center gap-2">
              <motion.span
                className="inline-flex h-3 w-3 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-medium">
                <AnimatedNumber value={Number(summary.hot_leads) || 0} delay={0.7} />
              </span>
            </div>
          </div>

          {hotLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No hot leads at this time.</p>
          ) : (
            <ul aria-label="Hot leads list" className="space-y-3">
              {hotLeads.map((lead: any, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + idx * 0.1 }}
                  className="border-l-4 border-red-500 pl-3 py-2"
                >
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <BounceBadge
                      active={lead.score >= 90}
                      className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded"
                    >
                      Score: {lead.score}
                    </BounceBadge>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </MotionCard>

        {/* Warm Leads Panel */}
        <MotionCard delay={0.7} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Warm Leads</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm font-medium">
                <AnimatedNumber value={Number(summary.warm_leads) || 0} delay={0.8} />
              </span>
            </div>
          </div>

          {warmLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No warm leads at this time.</p>
          ) : (
            <ul aria-label="Warm leads list" className="space-y-3">
              {warmLeads.map((lead: any, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + idx * 0.1 }}
                  className="border-l-4 border-yellow-500 pl-3 py-2"
                >
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </MotionCard>

        {/* Cold Leads Panel */}
        <MotionCard delay={0.8} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cold Leads</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
              <span className="text-sm font-medium">
                <AnimatedNumber value={Number(summary.cold_leads) || 0} delay={0.9} />
              </span>
            </div>
          </div>

          {coldLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No cold leads at this time.</p>
          ) : (
            <ul aria-label="Cold leads list" className="space-y-3">
              {coldLeads.map((lead: any, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 + idx * 0.1 }}
                  className="border-l-4 border-blue-500 pl-3 py-2"
                >
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </MotionCard>
      </div>

      {/* Recent Activity Table */}
      <MotionCard delay={0.9} className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {data.activity.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th scope="col" className="py-2 pr-4">Company</th>
                  <th scope="col" className="py-2 pr-4">Contact</th>
                  <th scope="col" className="py-2 pr-4">Status</th>
                  <th scope="col" className="py-2 pr-4">Score</th>
                  <th scope="col" className="py-2 pr-4">Source</th>
                  <th scope="col" className="py-2 pr-4">Response Time</th>
                  <th scope="col" className="py-2">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.map((activity: any, idx: number) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1 + idx * 0.05 }}
                    className="border-t"
                  >
                    <td className="py-2 pr-4">{activity.company ?? "-"}</td>
                    <td className="py-2 pr-4">{activity.contact ?? "-"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          activity.status === "hot"
                            ? "bg-red-100 text-red-800"
                            : activity.status === "warm"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {activity.status ?? "-"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{activity.score ?? "-"}</td>
                    <td className="py-2 pr-4">{activity.source ?? "-"}</td>
                    <td className="py-2 pr-4">{fmTime(activity.response_time)}</td>
                    <td className="py-2">
                      {activity.last_contact ? fmDT.format(new Date(activity.last_contact)) : "-"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MotionCard>
    </motion.div>
  );
}
