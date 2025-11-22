'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  error: string;
}

export function VoltekErrorDisplay({ error }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg-app,#f9fafb)] p-6 flex items-center justify-center">
      <Card className="max-w-md p-6 border-[var(--error,#ef4444)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-[var(--error,#ef4444)] flex-shrink-0 mt-1" size={24} />
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-[var(--text-1,#111827)]">
              Unable to Load Dashboard
            </h3>
            <p className="text-sm text-[var(--text-2,#6b7280)]">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
