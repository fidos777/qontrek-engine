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
  const latency = Number(data.elapsedTime ?? data.executionTime ?? data.time ?? 0);
  const errorCode = isSuccess ? null : (hasStatus ? String(statusCode) : 'unknown');

  item.json.delivery_status = isSuccess ? 'sent' : 'reversed';
  item.json.template_log_status = isSuccess ? 'sent' : 'reversed';
  item.json.should_log_credit = isSuccess;
  item.json.retryable = isRetryable;
  item.json.reversal_reason = reversalReason;
  item.json.ops_status = isSuccess ? 'sent' : isRetryable ? 'retry' : 'reversed';
  item.json.ops_reason = reversalReason || null;
  item.json.ops_flow = item.json.ops_flow || 'flow_b_send_meter';
  item.json.ops_node = 'send_whatsapp';
  item.json.ops_latency_ms = Number.isFinite(latency) ? latency : 0;
  item.json.ops_error_code = errorCode;
  item.json.ops_error_msg = reversalReason || null;

  const metadata = item.json.ops_metadata || {};
  if (reversalReason) {
    metadata.reversal_reason = reversalReason;
  }
  metadata.status_code = hasStatus ? statusCode : null;
  item.json.ops_metadata = metadata;

  return item;
});
