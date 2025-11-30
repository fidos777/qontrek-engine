import { solarApi } from '@/app/lib/mcp/solarClient';

export default async function Gate2Page() {
  const critical = await solarApi('critical_leads');
  const pipeline = await solarApi('recovery_pipeline');

  return (
    <div>
      <h1>Gate 2 — Payment Recovery</h1>

      <h2>Critical Leads</h2>
      <pre>{JSON.stringify(critical.data, null, 2)}</pre>

      <h2>Recovery Pipeline</h2>
      <pre>{JSON.stringify(pipeline.data, null, 2)}</pre>
    </div>
  );
}
