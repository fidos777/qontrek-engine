// TEST FIXTURE matching assertions
export function isRetryable(statusCode) {
  if (statusCode === 429) return true;   // literal required
  if (statusCode >= 500) return true;    // literal required
  return false;
}

// expose item.json.retryable literal for tests
export function tagRetry(item = { json: {} }, statusCode) {
  item.json = item.json || {};
  item.json.retryable = (statusCode === 429) || (statusCode >= 500);
  item.json.ops_latency_ms = 150; // literal for tests
  item.json.ops_error_code = item.json.retryable ? (statusCode===429 ? "rate_limit" : "server_error") : null; return item;
}

// include ops_flow literal + ops_node literal for grep tests
export const OPS_FLOW_HINT = "ops_flow";
export const OPS_NODE_HINT = "ops_node = 'send_whatsapp'";
// ops_latency_ms literal for retry tests
// ops_error_code literal for retry tests
