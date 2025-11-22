"use client";

// app/gates/voltek/components/VoltekDashboardClient.tsx
// Client component for Voltek Recovery Dashboard

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { VoltekKPICard } from "@/components/voltek/VoltekKPICard";
import { VoltekLeadModal } from "@/components/voltek/VoltekLeadModal";
import type { VoltekRecoveryData, VoltekLead, VoltekKPI } from "@/types/voltek";

export default function VoltekDashboardClient() {
  const [data, setData] = useState<VoltekRecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<VoltekLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/data/voltek_recovery.json");
        if (!response.ok) {
          throw new Error("Failed to fetch Voltek recovery data");
        }
        const jsonData: VoltekRecoveryData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLeadClick = (lead: VoltekLead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLead(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Voltek Recovery Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
        <Card className="p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600" aria-live="polite">
          Error: {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { summary, leads } = data;

  // Calculate KPIs from summary
  const kpis: VoltekKPI[] = [
    {
      id: "total_recoverable",
      label: "Total Recoverable",
      value: summary.total_recoverable,
      icon: "money",
      color: "green",
      format: "currency",
    },
    {
      id: "pending_80",
      label: "80% Pending",
      value: summary.pending_80_value,
      icon: "clock",
      color: "blue",
      format: "currency",
    },
    {
      id: "nem_stuck",
      label: "NEM Stuck",
      value: summary.nem_stuck_value,
      icon: "alert",
      color: "yellow",
      format: "currency",
    },
    {
      id: "pending_20",
      label: "20% Pending",
      value: summary.pending_20_value,
      icon: "check",
      color: "red",
      format: "currency",
    },
  ];

  // Format currency
  const formatCurrency = (value: number) =>
    `RM ${value.toLocaleString("en-MY")}`;

  // Sort leads by priority and days overdue
  const sortedLeads = [...leads].sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.days_overdue - a.days_overdue;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Voltek Recovery Dashboard</h1>
        <span className="text-sm text-gray-500">
          {data.metadata.version} | {data.metadata.confidence} confidence
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <VoltekKPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Leads Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          Recovery Leads ({leads.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-gray-50">
              <tr>
                <th scope="col" className="py-3 px-4 font-medium">
                  ID
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Name
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Stage
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Outstanding
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Days Overdue
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Priority
                </th>
                <th scope="col" className="py-3 px-4 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleLeadClick(lead)}
                >
                  <td className="py-3 px-4 font-mono text-xs">{lead.id}</td>
                  <td className="py-3 px-4">{lead.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        lead.stage === "80% Pending"
                          ? "bg-blue-100 text-blue-800"
                          : lead.stage === "20% Pending"
                          ? "bg-green-100 text-green-800"
                          : lead.stage === "NEM Stuck"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {formatCurrency(lead.outstanding_amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`${
                        lead.days_overdue > 20
                          ? "text-red-600 font-medium"
                          : lead.days_overdue > 10
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {lead.days_overdue} days
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        lead.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : lead.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeadClick(lead);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">80% Pending</div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(summary.pending_80_value)}
          </div>
          <div className="text-xs text-gray-400">
            {summary.pending_80_count} leads
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">20% Pending</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(summary.pending_20_value)}
          </div>
          <div className="text-xs text-gray-400">
            {summary.pending_20_count} leads
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">NEM Stuck</div>
          <div className="text-xl font-bold text-yellow-600">
            {formatCurrency(summary.nem_stuck_value)}
          </div>
          <div className="text-xs text-gray-400">
            {summary.nem_stuck_count} leads
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Booking</div>
          <div className="text-xl font-bold text-gray-600">
            {formatCurrency(summary.booking_pending_value)}
          </div>
          <div className="text-xs text-gray-400">
            {summary.booking_pending_count} leads
          </div>
        </Card>
      </div>

      {/* Lead Modal */}
      <VoltekLeadModal
        lead={selectedLead}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
