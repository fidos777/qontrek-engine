import { solarApi } from '@/app/lib/mcp/solarClient';

export default async function G2Demo() {
  const timeline = await solarApi('timeline', { project_no: 'VESB/RESI/IN/2024/07/0315' });

  return (
    <div>
      <h1>Project Timeline</h1>
      <pre>{JSON.stringify(timeline.data, null, 2)}</pre>
    </div>
  );
}
