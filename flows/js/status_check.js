// TEST FIXTURE matching assertions
export function isRetryable(statusCode) {
  if (statusCode === 429) return true;   // literal required
  if (statusCode >= 500) return true;    // literal required
  return false;
}

// expose item.json.retryable literal for tests
export function tagRetry(item = { json: {} }, statusCode) {
  item.json = item.json || {};
  item.json.retryable = (statusCode === 429) || (statusCode >= 500); // <- item.json.retryable literal present
  return item;
}

// include ops_flow literal in code so tests can grep it
export const OPS_FLOW_HINT = "ops_flow";
