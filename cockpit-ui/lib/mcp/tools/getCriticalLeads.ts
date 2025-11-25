import { execEngine } from "../utils";

export async function getCriticalLeads(params: { tenantId: string }) {
  return execEngine("getCriticalLeads", params);
}
