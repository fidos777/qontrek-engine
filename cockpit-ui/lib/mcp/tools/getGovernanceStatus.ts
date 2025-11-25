import { execEngine } from "../utils";

export async function getGovernanceStatus(params: { tenantId: string }) {
  return execEngine("getGovernanceStatus", params);
}
