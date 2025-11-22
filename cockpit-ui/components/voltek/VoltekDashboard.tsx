'use client';

import { useVoltekData } from '@/lib/hooks/useVoltekData';
import {
  calculate80_20Split,
  getCriticalLeads,
} from '@/lib/utils/voltekCalculations';
import { VoltekKPICard } from '@/components/voltek/VoltekKPICard';
import { VoltekLeadModal } from '@/components/voltek/VoltekLeadModal';
import { VoltekErrorDisplay } from '@/components/voltek/VoltekErrorDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import type { VoltekLead } from '@/types/voltek';

export default function VoltekDashboard() {
  const { data, loading, error } = useVoltekData();
  const [selectedLead, setSelectedLead] = useState<VoltekLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#f9fafb)] p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (error) {
    return <VoltekErrorDisplay error={error} />;
  }

  // No data state
  if (!data) {
    return <VoltekErrorDisplay error="No data available" />;
  }

  // Compute KPIs
  const totalRecoverable = data.summary.total_recoverable;
  const split = calculate80_20Split(data.leads);
  const criticalLeads = getCriticalLeads(data.leads);

  return (
    <div className="min-h-screen bg-[var(--bg-app,#f9fafb)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1,#111827)]">
            Voltek Recovery Dashboard
          </h1>
          <div className="text-sm text-[var(--text-2,#6b7280)] mt-1">
            Last updated: {new Date(data.metadata.generated_at).toLocaleString('en-MY')}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <VoltekKPICard
          title="Total Recoverable"
          value={totalRecoverable}
          prefix="RM "
          icon={<DollarSign size={20} />}
          subtitle={`${data.leads.length} active leads`}
        />
        <VoltekKPICard
          title="80% Pending"
          value={split.pending80.value}
          prefix="RM "
          icon={<TrendingUp size={20} />}
          subtitle={`${split.pending80.count} projects`}
        />
        <VoltekKPICard
          title="Critical Leads"
          value={criticalLeads.length}
          icon={<AlertCircle size={20} />}
          subtitle=">14 days overdue"
        />
        <VoltekKPICard
          title="20% Pending"
          value={split.pending20.value}
          prefix="RM "
          icon={<Users size={20} />}
          subtitle={`${split.pending20.count} handovers`}
        />
      </div>

      {/* Critical Leads Table */}
      <div className="rounded-lg border border-[var(--border-default,#e5e7eb)] bg-[var(--bg-surface,#ffffff)] p-4">
        <div className="text-sm font-semibold text-[var(--text-2,#6b7280)] mb-3">
          Critical Leads ({criticalLeads.length})
        </div>
        <div className="space-y-2">
          {criticalLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => {
                setSelectedLead(lead);
                setModalOpen(true);
              }}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default,#e5e7eb)] hover:bg-[var(--bg-hover,#f3f4f6)] cursor-pointer transition-colors"
            >
              <div className="space-y-1">
                <div className="font-semibold text-[var(--text-1,#111827)]">{lead.name}</div>
                <div className="text-xs text-[var(--text-2,#6b7280)]">
                  {lead.stage} • {lead.days_overdue} days overdue
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--text-1,#111827)]">
                  RM {lead.outstanding_amount.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-2,#6b7280)]">
                  {lead.system_size}kW
                </div>
              </div>
            </div>
          ))}
        </div>
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
