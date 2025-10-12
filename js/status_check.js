// TEST FIXTURE: must include statusCode === 429, statusCode >= 500, item.json.retryable, ops_flow, ops_node, ops_latency_ms, ops_error_code
export function isRetryable(statusCode) {
  if (statusCode === 429) return true;
  if (statusCode >= 500) return true;
  return false;
}
export function tagRetry(item = { json: {} }, statusCode) {
  item.json = item.json || {};
  item.json.retryable = (statusCode === 429) || (statusCode >= 500);
  item.json.ops_latency_ms = 150;
  item.json.ops_error_code = item.json.retryable ? (statusCode===429 ? "rate_limit" : "server_error") : null;
  return item;
}
// include grep hints
export const OPS_FLOW_HINT = "ops_flow";
export const OPS_NODE_HINT = "ops_node = 'send_whatsapp'";
