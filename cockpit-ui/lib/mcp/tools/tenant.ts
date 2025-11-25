/**
 * List available tenants
 */
export async function listTenants(params?: { filter?: string }) {
  // Mock tenant data - in production this would query the database
  const tenants = [
    {
      id: 'voltek',
      name: 'Voltek Industries',
      status: 'active',
      plan: 'enterprise',
      createdAt: '2024-01-15',
    },
    {
      id: 'acme',
      name: 'Acme Corporation',
      status: 'active',
      plan: 'professional',
      createdAt: '2024-03-20',
    },
    {
      id: 'techflow',
      name: 'TechFlow Solutions',
      status: 'active',
      plan: 'starter',
      createdAt: '2024-06-10',
    },
  ];

  const filter = params?.filter?.toLowerCase();
  const filtered = filter
    ? tenants.filter(
        t =>
          t.id.toLowerCase().includes(filter) ||
          t.name.toLowerCase().includes(filter)
      )
    : tenants;

  return {
    success: true,
    tenants: filtered,
    count: filtered.length,
  };
}
