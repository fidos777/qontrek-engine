// TEST FIXTURE matching assertions
export function isRetryable(statusCode) {
  if (statusCode === 429) return true;   // literal required
  if (statusCode >= 500) return true;    // literal required
  return false;
}
// item.json.retryable
