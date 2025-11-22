'use client';

import { useState, useEffect } from 'react';
import { VoltekResponseSchema } from '@/types/voltek';
import type { VoltekResponse } from '@/types/voltek';
import { logger } from '@/lib/utils/logger';

export function useVoltekData() {
  const [data, setData] = useState<VoltekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        logger.info('Loading Voltek data...');

        const res = await fetch('/data/voltek_recovery.json', {
          cache: 'no-store', // Always get fresh data
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch data`);
        }

        const raw = await res.json();

        // Validate with Zod
        const validated = VoltekResponseSchema.parse(raw);

        setData(validated);

        logger.info('Voltek data loaded successfully', {
          total_recoverable: validated.summary.total_recoverable,
          lead_count: validated.leads.length,
          version: validated.metadata.version,
        });

      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error loading data';
        logger.error('Data load failed', { error: msg });
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
}
