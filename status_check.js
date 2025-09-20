/**
 * n8n Function node snippet to classify WhatsApp send responses.
 *
 * Expected input: HTTP node response with `statusCode` (default n8n field).
 * The script annotates each item so downstream Insert nodes know whether
 * to log credits or flag the send as reversed.
 */
return items.map(item => {
  const data = item.json ?? {};
  const rawCode = data.statusCode ?? data.code ?? data.status;
  const statusCode = Number(rawCode);
  const hasStatus = Number.isFinite(statusCode);
  const isSuccess = hasStatus && statusCode >= 200 && statusCode < 300;
  const isRetryable = hasStatus && (statusCode === 429 || statusCode >= 500);
  const reversalReason = isSuccess
    ? undefined
    : `http_${hasStatus ? statusCode : 'unknown_status_code'}`;
  const latency = Number(data.elapsedTime ?? data.executionTime ?? data.time ?? 0);

  const enriched = {
    ...data,
    send_status: isSuccess ? 'success' : 'reversed',
    template_log_status: isSuccess ? 'sent' : 'reversed',
    wa_template_status: isSuccess ? 'sent' : 'reversed',
    should_log_credit: isSuccess,
    retryable: isRetryable,
    ops_flow: data.ops_flow || 'flow_b_send_meter',
    ops_node: 'send_whatsapp',
    ops_status: isSuccess ? 'sent' : isRetryable ? 'retry' : 'reversed',
    ops_latency_ms: Number.isFinite(latency) ? latency : 0,
  };

  if (!isSuccess) {
    const reasonSuffix = hasStatus ? String(statusCode) : 'unknown_status_code';
    enriched.reversal_reason = `http_${reasonSuffix}`;
    enriched.ops_error_code = reasonSuffix;
    enriched.ops_error_msg = enriched.reversal_reason;
  } else {
    delete enriched.reversal_reason;
    enriched.ops_error_code = null;
    enriched.ops_error_msg = null;
  }

  return { json: enriched };
});
