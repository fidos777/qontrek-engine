/**
 * Prepare WhatsApp template payloads with deterministic idempotency keys.
 */
const crypto = require('crypto');

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

return items.map((item) => {
  const data = item.json || {};

  const brand = data.brand || 'Voltek';
  const defaultLocale = data.default_locale || data.brand_default_locale || 'ms_MY';
  const requestedLocale = data.locale || data.requested_locale || '';
  const requestId = data.request_id || data.requestId || data.requestID;
  const templateName = data.template?.name || data.template_name;
  const purpose = data.purpose || data.flow || 'whatsapp_template_send';

  if (!requestId) {
    throw new Error('request_id is required for payload_builder');
  }
  if (!templateName) {
    throw new Error('template.name is required for payload_builder');
  }

  const components = data.components || data.template?.components || [];
  const localeSeed = requestedLocale || defaultLocale || '';
  const idempotencySeed = [brand, requestId, templateName, localeSeed, purpose].join('|');
  const idempotencyKey = crypto.createHash('sha1').update(idempotencySeed).digest('hex');

  const languageCode = (data.template?.language || localeSeed || 'en_US').split('_')[0];

  const sendPayload = {
    messaging_product: 'whatsapp',
    to: data.customer_phone || data.to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: asArray(components),
    },
  };

  item.json = {
    ...data,
    brand,
    default_locale: defaultLocale,
    locale_requested: requestedLocale,
    locale_seed: localeSeed,
    request_id: requestId,
    template_name: templateName,
    purpose,
    idempotency_key: idempotencyKey,
    send_payload: sendPayload,
  };

  return item;
});
