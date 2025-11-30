export async function solarApi(action: string, params: any = {}) {
  const res = await fetch('/api/mcp/solar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Solar API error');
  return data;
}

