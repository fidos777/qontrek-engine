// TEST FIXTURE matching assertions
// requires: "createHash('sha1')" and "[brand, requestId, templateName, localeSeed, purpose].join('|')"
import { createHash } from 'crypto';

const partsToSeed = (brand, requestId, templateName, localeSeed, purpose) =>
  [brand, requestId, templateName, localeSeed, purpose].join('|');
export function buildPayload({
  brand = 'voltek',
  requestId = 'req-000',
  templateName = 'send_meter',
  localeSeed = 'en_US',
  purpose = 'whatsapp',
  tenantId = 'test-tenant'
} = {}) {
  const seed = partsToSeed(brand, requestId, templateName, localeSeed, purpose);
  // multitenant idempotency key
  const idempotency_key = createHash('sha1')
    .update(String(tenantId))
    .update(':')
    .update(seed)
    .digest('hex');
  return { idempotency_key, tenantId, brand, requestId, templateName, localeSeed, purpose };
}
