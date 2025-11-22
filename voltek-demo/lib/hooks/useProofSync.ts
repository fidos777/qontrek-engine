'use client';

import { useEffect, useState } from 'react';

export function useProofSync() {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending'>('pending');

  useEffect(() => {
    const handleProofUpdate = (event: CustomEvent) => {
      setSyncStatus('synced');

      // Reset after 5 seconds
      setTimeout(() => {
        setSyncStatus('pending');
      }, 5000);
    };

    window.addEventListener('proof.updated' as any, handleProofUpdate);

    return () => {
      window.removeEventListener('proof.updated' as any, handleProofUpdate);
    };
  }, []);

  return syncStatus;
}
