import type { VoltekResponse, VoltekLead } from '@/types/voltek';

export function calculateTotalRecoverable(leads: VoltekLead[]): number {
  return leads.reduce((sum, lead) => sum + lead.outstanding_amount, 0);
}

export function calculate80_20Split(leads: VoltekLead[]) {
  const pending80 = leads.filter(l => l.stage === '80% Pending');
  const pending20 = leads.filter(l => l.stage === '20% Pending');

  return {
    pending80: {
      count: pending80.length,
      value: pending80.reduce((sum, l) => sum + l.outstanding_amount, 0),
      leads: pending80,
    },
    pending20: {
      count: pending20.length,
      value: pending20.reduce((sum, l) => sum + l.outstanding_amount, 0),
      leads: pending20,
    },
  };
}

export function getCriticalLeads(leads: VoltekLead[]): VoltekLead[] {
  return leads
    .filter(l => l.days_overdue > 14 || l.priority === 'HIGH')
    .sort((a, b) => {
      // Sort by priority first, then by outstanding amount
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return b.outstanding_amount - a.outstanding_amount;
    });
}

export function getNEMStuckLeads(leads: VoltekLead[]): VoltekLead[] {
  return leads.filter(l => l.stage === 'NEM Stuck');
}

export function getRecoveryRate(response: VoltekResponse): number {
  // Calculate based on collected vs total pipeline
  const totalPipeline = 250000; // Assume total project value pool
  const outstanding = response.summary.total_recoverable;
  const collected = totalPipeline - outstanding;
  return (collected / totalPipeline) * 100;
}

export function getStageDistribution(leads: VoltekLead[]) {
  const stages = ['80% Pending', '20% Pending', 'NEM Stuck', 'Booking'] as const;

  return stages.map(stage => {
    const stageLeads = leads.filter(l => l.stage === stage);
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + l.outstanding_amount, 0),
      percentage: (stageLeads.reduce((sum, l) => sum + l.outstanding_amount, 0) /
                   calculateTotalRecoverable(leads)) * 100,
    };
  });
}
