// TEST FIXTURE: must contain ^\+[1-9]\d{7,14}$ and 'invalid_phone'
const E164_STRICT = /^\+[1-9]\d{7,14}$/;
export const INVALID_PHONE_CODE = 'invalid_phone';
export function isPhoneValid(number) {
  return E164_STRICT.test(String(number || ''));
}
