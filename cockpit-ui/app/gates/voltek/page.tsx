'use client';

import { VoltekKPICard } from '@/components/voltek/VoltekKPICard';
import { VoltekLeadModal } from '@/components/voltek/VoltekLeadModal';
import { useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import type { VoltekLead } from '@/types/voltek';

export default function VoltekDashboard() {
  const [selectedLead, setSelectedLead] = useState<VoltekLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Mock data for testing
  const mockLead: VoltekLead = {
    id: 'TEST-001',
    name: 'Test Customer',
    phone: '012-3456789',
    system_size: 6.0,
    project_value: 21000,
    outstanding_amount: 4200,
    stage: '20% Pending',
    days_overdue: 15,
    last_contact: '2025-11-01',
    next_action: 'Follow up payment',
    priority: 'MEDIUM',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Voltek Recovery Dashboard
        </h1>
      </div>

      {/* KPI Cards with icons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <VoltekKPICard
          title="Total Recoverable"
          value={180000}
          prefix="RM "
          icon={<DollarSign size={20} />}
          subtitle="Across all stages"
        />
        <VoltekKPICard
          title="80% Pending"
          value={92800}
          prefix="RM "
          icon={<TrendingUp size={20} />}
          subtitle="3 projects"
        />
        <VoltekKPICard
          title="Critical Leads"
          value={12}
          icon={<AlertCircle size={20} />}
          subtitle=">14 days overdue"
        />
        <VoltekKPICard
          title="Total Leads"
          value={23}
          icon={<Users size={20} />}
          subtitle="Active pipeline"
        />
      </div>

      {/* Test button for modal */}
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <button
          onClick={() => {
            setSelectedLead(mockLead);
            setModalOpen(true);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Test Modal (Click to open lead details)
        </button>
      </div>

      {/* Modal */}
      <VoltekLeadModal
        lead={selectedLead}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
