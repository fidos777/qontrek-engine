'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoltekData, VoltekLead } from '@/lib/utils/voltekCalculations';

export interface VoltekResponse {
  ok: boolean;
  rel: string;
  source: 'real' | 'fallback';
  schemaVersion: string;
  data: VoltekData;
}

export interface UseVoltekDataResult {
  data: VoltekData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateLead: (leadId: string, updates: Partial<VoltekLead>) => void;
}

async function fetchVoltekData(): Promise<VoltekResponse> {
  try {
    const res = await fetch('/data/voltek_recovery.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch Voltek data');
    return await res.json();
  } catch (error) {
    // Fallback for development
    if (process.env.NODE_ENV !== 'production') {
      const mod = await import('@/public/data/voltek_recovery.json');
      return mod.default as unknown as VoltekResponse;
    }
    throw new Error('Voltek data endpoint unavailable');
  }
}

export function useVoltekData(): UseVoltekDataResult {
  const [data, setData] = useState<VoltekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchVoltekData();
      setData(response.data);

      // Log telemetry on first successful load
      if (!telemetrySent.current && response.rel && response.source) {
        console.log('[TELEMETRY]', JSON.stringify({
          event: 'proof_load',
          rel: response.rel,
          source: response.source,
          timestamp: new Date().toISOString(),
        }));
        telemetrySent.current = true;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLead = useCallback((leadId: string, updates: Partial<VoltekLead>) => {
    setData((prevData: VoltekData | null) => {
      if (!prevData) return null;

      return {
        ...prevData,
        leads: prevData.leads.map((lead: VoltekLead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      };
    });
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateLead,
  };
}

// Hook for filtering leads
export function useFilteredLeads(leads: VoltekLead[] | undefined, filter: {
  status?: VoltekLead['status'];
  search?: string;
  sortBy?: 'amount' | 'overdue_days' | 'priority';
  sortOrder?: 'asc' | 'desc';
}) {
  return useCallback(() => {
    if (!leads) return [];

    let filtered = [...leads];

    // Filter by status
    if (filter.status) {
      filtered = filtered.filter(lead => lead.status === filter.status);
    }

    // Filter by search term
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.company.toLowerCase().includes(searchLower) ||
        lead.contact.toLowerCase().includes(searchLower) ||
        lead.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[filter.sortBy!];
        const bVal = b[filter.sortBy!];
        const comparison = typeof aVal === 'number' ? aVal - (bVal as number) : 0;
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [leads, filter])();
}
