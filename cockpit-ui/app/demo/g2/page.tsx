"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportWizardModal } from "@/components/voltek/ImportWizardModal";
import { SafeModeProvider, useSafeMode } from "@/contexts/SafeModeContext";
import { SafeModeToggleCompact } from "@/components/voltek/SafeModeToggle";
import { ConfidenceMeterAnimated } from "@/components/voltek/ConfidenceMeterAnimated";
import { ProofFreshnessIndicator } from "@/components/voltek/ProofFreshnessIndicator";
import { GovernanceHeaderStrip } from "@/components/voltek/GovernanceHeaderStrip";

function LeadNameDisplay({ name }: { name: string }) {
  const { maskText } = useSafeMode();
  return <span>{maskText(name)}</span>;
}

export default function Gate2DemoPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);

  const leads = [
    { name: "Alpha Engineering", stage: "OVERDUE", amount: "RM 18,500", overdue: "19d", last: "14 Oct 2025, 11:20" },
    { name: "Seri Mutiara Builders", stage: "OVERDUE", amount: "RM 22,800", overdue: "22d", last: "12 Oct 2025, 17:15" },
    { name: "Metro Solar Sdn Bhd", stage: "OVERDUE", amount: "RM 9,900", overdue: "17d", last: "15 Oct 2025, 09:40" },
  ];

  return (
    <SafeModeProvider>
      <main className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gate 2 — Payment Recovery</h1>
            <p className="text-gray-600">Live financial recovery dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <SafeModeToggleCompact />
            <Button
              onClick={() => setImportModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              <Upload size={18} className="mr-2" />
              Import Data
            </Button>
          </div>
        </div>

        {/* Governance Header */}
        <div className="mb-4">
          <GovernanceHeaderStrip />
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm text-gray-500">Total Recoverable</h3>
            <p className="text-3xl font-bold mt-1">RM 152,500</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm text-gray-500">7-Day Recovery Rate</h3>
            <p className="text-3xl font-bold mt-1">32%</p>
            <p className="text-xs text-gray-400 mt-1">Avg days to pay: 11</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm text-gray-500">Pending Cases</h3>
            <p className="text-3xl font-bold mt-1">14</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm text-gray-500">Handover Queue</h3>
            <p className="text-3xl font-bold mt-1">5</p>
          </div>
        </div>

        {/* Proof Section */}
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <ProofFreshnessIndicator lastUpdated={new Date()} source="tower" />
          <div className="mt-4">
            <ConfidenceMeterAnimated trust={100} />
          </div>
        </div>

        {/* Critical Leads */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Critical Leads</h2>
          <table className="min-w-full text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Stage</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Overdue</th>
                <th className="text-left py-2">Last Reminder</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">
                    <LeadNameDisplay name={lead.name} />
                  </td>
                  <td className="py-2">{lead.stage}</td>
                  <td className="py-2">{lead.amount}</td>
                  <td className="py-2">{lead.overdue}</td>
                  <td className="py-2">{lead.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Import Wizard */}
        <ImportWizardModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onComplete={() => console.log("Import completed! Trust Index updated!")}
        />
      </main>
    </SafeModeProvider>
  );
}

