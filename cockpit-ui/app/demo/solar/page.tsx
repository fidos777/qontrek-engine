// ============================================
// SOLAR RECOVERY DASHBOARD PAGE
// Path: /app/demo/solar/page.tsx
// Purpose: Main Solar vertical dashboard
// ============================================

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { solarApi } from '@/app/lib/mcp/solarClient';

export default async function SolarDemoPage() {
  const kpi = await solarApi('kpi');

  return (
    <div>
      <h1>Solar Dashboard</h1>
      <pre>{JSON.stringify(kpi.data, null, 2)}</pre>
    </div>
  );
}
