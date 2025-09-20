/**
 * n8n Function node to normalize WhatsApp template send payloads.
 *
 * Expected incoming item fields (item.json):
 * - brand: tenant/brand identifier (e.g. "Voltek")
 * - locale: optional locale override (falls back to brand default)
 * - request_id: unique identifier for the originating workflow/request
 * - template: { name: string, language?: string }
 * - components: WhatsApp template component array
 * - timestamp: optional ISO timestamp used when generating idempotency key
 */
const crypto = require('crypto');

return items.map(item => {
  const data = item.json || {};

  const brand = data.brand || 'Voltek';
  const locale = data.locale || data.default_locale || 'ms_MY';
  const requestId = data.request_id || data.requestId || data.requestID;

  if (!requestId) {
    throw new Error('request_id is required to build WhatsApp payload');
  }

  const templateName = data.template?.name || data.template_name;
  const templateLanguage = data.template?.language || data.template_language || 'ms';

  if (!templateName) {
    throw new Error('template.name is required to build WhatsApp payload');
  }

  const timestamp = data.timestamp || new Date().toISOString();
  const components = data.components || data.template?.components || [];

  const idempotencySeed = `${requestId}|${templateName}|${timestamp}`;
  const idempotencyKey = crypto
    .createHash('sha1')
    .update(idempotencySeed)
    .digest('hex');

  const payload = {
    brand,
    locale,
    request_id: requestId,
    idempotency_key: idempotencyKey,
    template: {
      name: templateName,
      language: templateLanguage,
    },
    components,
    ops_flow: data.ops_flow || 'flow_b_send_meter',
  };

  return { json: payload };
});
