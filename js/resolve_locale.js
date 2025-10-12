// TEST FIXTURE: must include 'template_locale_missing' and 'en_US' and 'policy_hold' token
export function resolveLocale(ctx = {}) {
  const loc = ctx?.user?.locale || ctx?.brand?.defaultLocale || 'en_US';
  if (!ctx?.user?.locale && !ctx?.brand?.defaultLocale) {
    return { locale: 'en_US', hold_reason: 'template_locale_missing' }; // policy_hold
  }
  return { locale: loc, hold_reason: null };
}
