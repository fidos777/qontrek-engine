'use client';

import { motion } from 'framer-motion';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(
  () => import('./Dashboard').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-32 w-full rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-24 w-full rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-24 w-full rounded-lg bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
}

export function DashboardClient() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[var(--bg-app)]"
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </motion.div>
  );
}
