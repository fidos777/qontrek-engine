import { execEngine } from "../utils";

export async function refreshProof(params: { tenantId: string }) {
  return execEngine("refreshProof", params);
}
