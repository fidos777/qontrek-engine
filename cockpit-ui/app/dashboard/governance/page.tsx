import { solarApi } from '@/app/lib/mcp/solarClient';

export default async function GovernanceDashboard() {
  const kpi = await solarApi('kpi');

  return (
    <div>
      <h1>Governance Dashboard</h1>
      <pre>{JSON.stringify(kpi.data, null, 2)}</pre>
    </div>
  );
}
