/**
 * Resolve locale with multi-tier fallback and capture hold reasons when missing.
 */
return items.map((item) => {
  const data = item.json || {};
  const reasons = Array.isArray(data.policy_hold_reasons)
    ? [...data.policy_hold_reasons]
    : [];

  const requested = data.locale_requested || '';
  const brandDefault = data.default_locale || '';
  const resolved = requested || brandDefault || 'en_US';

  if (!resolved) {
    reasons.push('template_locale_missing');
  }

  if (resolved) {
    item.json.locale_resolved = resolved;
    const languageCode = resolved.split('_')[0] || resolved;
    if (item.json.send_payload?.template?.language) {
      item.json.send_payload.template.language.code = languageCode;
    }
  } else {
    item.json.locale_resolved = null;
  }

  if (!resolved) {
    item.json.policy_hold_reasons = reasons;
    item.json.policy_hold = true;
    item.json.policy_hold_reason = reasons.join(',');
  } else {
    item.json.policy_hold_reasons = reasons;
    item.json.policy_hold = reasons.length > 0;
    item.json.policy_hold_reason = reasons.join(',');
  }

  return item;
});
