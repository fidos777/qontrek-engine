// TEST FIXTURE matching assertions
// must include: 'template_locale_missing' and 'en_US'
export function resolveLocale(ctx = {}) {
  const loc = ctx?.user?.locale || ctx?.brand?.defaultLocale || 'en_US';
  if (!ctx?.user?.locale && !ctx?.brand?.defaultLocale) {
    return { locale: 'en_US', hold_reason: 'template_locale_missing' };
  }
  return { locale: loc, hold_reason: null };
}
// policy_hold
