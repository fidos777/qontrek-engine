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

  const enriched = {
    ...data,
    send_status: isSuccess ? 'success' : 'reversed',
    template_log_status: isSuccess ? 'sent' : 'reversed',
    wa_template_status: isSuccess ? 'sent' : 'reversed',
    should_log_credit: isSuccess,
  };

  if (!isSuccess) {
    const reasonSuffix = hasStatus ? String(statusCode) : 'unknown_status_code';
    enriched.reversal_reason = `http_${reasonSuffix}`;
  } else if ('reversal_reason' in enriched) {
    delete enriched.reversal_reason;
  }

  return { json: enriched };
});
