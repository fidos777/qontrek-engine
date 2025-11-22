"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const VoltekDashboard = dynamic(
  () => import('./VoltekDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--bg-app)] p-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
  }
);

export function VoltekDashboardClient() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[var(--bg-app)]"
    >
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <VoltekDashboard />
      </Suspense>
    </motion.div>
  );
}
