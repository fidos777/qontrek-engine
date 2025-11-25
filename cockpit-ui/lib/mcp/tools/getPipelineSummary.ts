import { execEngine } from "../utils";

export async function getPipelineSummary(params: { tenantId: string }) {
  return execEngine("getPipelineSummary", params);
}
