/**
 * Classify WhatsApp HTTP responses for logging, metering and retry metadata.
 */
return items.map((item) => {
  const data = item.json || {};
  const rawCode = data.statusCode ?? data.code ?? data.status;
  const statusCode = Number(rawCode);
  const hasStatus = Number.isFinite(statusCode);

  const isSuccess = hasStatus && statusCode >= 200 && statusCode < 300;
  const isRetryable = hasStatus && (statusCode === 429 || statusCode >= 500);
  const reversalReason = isSuccess
    ? undefined
    : `http_${hasStatus ? statusCode : 'unknown'}`;

  item.json.delivery_status = isSuccess ? 'sent' : 'reversed';
  item.json.template_log_status = isSuccess ? 'sent' : 'reversed';
  item.json.should_log_credit = isSuccess;
  item.json.retryable = isRetryable;
  item.json.reversal_reason = reversalReason;
  item.json.ops_status = isSuccess ? 'sent' : isRetryable ? 'retry' : 'reversed';
  item.json.ops_reason = reversalReason || null;

  return item;
});
