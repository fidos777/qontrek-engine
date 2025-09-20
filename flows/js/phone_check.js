/**
 * Validate recipient phone number is E.164. Marks policy hold when invalid.
 */
const E164 = /^\+[1-9]\d{7,14}$/;

return items.map((item) => {
  const data = item.json || {};
  const reasons = Array.isArray(data.policy_hold_reasons)
    ? [...data.policy_hold_reasons]
    : [];

  const phone = data.send_payload?.to || data.customer_phone || '';
  const valid = E164.test(phone);

  item.json.recipient_phone = phone;
  item.json.phone_valid = valid;

  if (!valid) {
    if (!reasons.includes('invalid_phone')) {
      reasons.push('invalid_phone');
    }
  }

  item.json.policy_hold_reasons = reasons;
  item.json.policy_hold = reasons.length > 0;
  item.json.policy_hold_reason = reasons.join(',');

  return item;
});
