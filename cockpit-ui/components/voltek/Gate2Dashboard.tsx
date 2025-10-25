"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import GovernanceHeaderStrip from "@/components/voltek/GovernanceHeaderStrip";
import ConfidenceMeterAnimated from "@/components/trust/ConfidenceMeterAnimated";
import { LeadModal } from "@/components/voltek/LeadModal";
import { useCountUpValue } from "@/lib/hooks/useCountUpValue";
import { fmtMYR, pct } from "@/lib/utils/formatters";

// Fallback mock API (for dev/demo)
async function fetchGate(): Promise<any> {
  try {
    const res = await fetch("/api/gates/g2/summary", { cache: "no-store" });
    if (!res.ok) throw new Error("G2 summary endpoint unavailable");
    return await res.json();
  } catch {
    // fallback mock data
    return {
      summary: {
        kpi: { recovery_rate_7d: 0.72, avg_days_to_pay: 7 },
        total_recoverable: 28500,
        pending_cases: 12,
        handover_queue: 5,
      },
      critical_leads: [
        { name: "Metro Solar Sdn Bhd", stage: "OVERDUE", amount: 9900, overdue_days: 17, last_reminder: "15 Oct 2025" },
        { name: "Kemuncak Glass", stage: "PENDING", amount: 7800, overdue_days: 5, last_reminder: "19 Oct 2025" },
      ],
      recent_success: [
        { name: "Bina Maju Trading", amount: 12500, paid_at: "2025-10-19" },
        { name: "Mega Energy Works", amount: 7800, paid_at: "2025-10-18" },
      ],
    };
  }
}

export default function Gate2Dashboard() {
  const [data, setData] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dataLoadedAt, setDataLoadedAt] = useState<Date>(new Date());
  const telemetrySent = useRef(false);

  // Fetch logic
  useEffect(() => {
    (async () => {
      const payload = await fetchGate();
      setData(payload);
      setDataLoadedAt(new Date());
    })();
  }, []);

  const kpi = data?.summary?.kpi ?? {};
  const totalRecoverableTarget = Number(data?.summary?.total_recoverable ?? 0);
  const pendingCasesTarget = Number(kpi["pending_cases"] ?? 0);
  const handoverQueueTarget = Number(kpi["handover_queue"] ?? 0);

  const totalRecoverable = useCountUpValue(totalRecoverableTarget, 1.2, 0);
  const pendingCases = useCountUpValue(pendingCasesTarget, 1.2, 0.2);
  const handoverQueue = useCountUpValue(handoverQueueTarget, 1.2, 0.3);

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <GovernanceHeaderStrip lastSync={dataLoadedAt} />

      {/* Recovery KPI Section */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
            <div className="text-2xl font-bold">{pct(kpi["recovery_rate_7d"])}</div>
            <div className="text-xs text-gray-500 mt-2">
              Avg days to pay: {kpi["avg_days_to_pay"] ?? "-"}
            </div>
          </div>
          <ConfidenceMeterAnimated confidence={kpi["recovery_rate_7d"] ?? 0.72} />
        </div>
      </Card>

      {/* Financials */}
      <Card className="p-4">
        <div className="text-sm text-gray-500 mb-2">Total Recoverable</div>
        <div className="text-3xl font-semibold text-green-600">
          {fmtMYR.format(totalRecoverable)}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          <div>Pending Cases: {pendingCases}</div>
          <div>Handover Queue: {handoverQueue}</div>
        </div>
      </Card>

      {/* Critical Leads */}
      <Card className="p-4">
        <div className="font-semibold mb-2">Critical Leads</div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Stage</th>
              <th className="text-left py-2">Amount</th>
              <th className="text-left py-2">Days Overdue</th>
              <th className="text-left py-2">Last Reminder</th>
            </tr>
          </thead>
          <tbody>
            {data?.critical_leads?.map((lead: any, idx: number) => (
              <motion.tr
                key={idx}
                className="border-t cursor-pointer hover:bg-gray-50"
                onClick={() => handleLeadClick(lead)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <td className="py-2 pr-4">{lead.name}</td>
                <td className="py-2 pr-4">{lead.stage}</td>
                <td className="py-2 pr-4">{fmtMYR.format(lead.amount)}</td>
                <td className="py-2 pr-4">{lead.overdue_days}</td>
                <td className="py-2 pr-4">{lead.last_reminder}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          lead={selectedLead}
        />
      )}
    </motion.div>
  );
}

