// lib/logs/scrub.ts
// PII redaction for secure logging

/**
 * Redact sensitive information from log entries
 * - Email addresses → [email]
 * - Phone numbers (10-15 digits, +60 Malaysia) → [phone]
 * - Credit card numbers → [card]
 * - API keys/tokens → [key]
 * - JWT tokens → [jwt]
 * - Bearer tokens → [bearer]
 * - IPv4/IPv6 addresses → [ip]
 * - IBAN numbers → [iban]
 */
export function redact(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (typeof value !== "string") {
        return value;
      }

      let scrubbed = value;

      // Redact JWT tokens (eyJ... format)
      scrubbed = scrubbed.replace(
        /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
        "[jwt]"
      );

      // Redact Bearer tokens
      scrubbed = scrubbed.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [bearer]");

      // Redact email addresses
      scrubbed = scrubbed.replace(
        /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
        "[email]"
      );

      // Redact Malaysia phone numbers (+60 format)
      scrubbed = scrubbed.replace(/\+60\s?\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}/g, "[phone]");
      scrubbed = scrubbed.replace(/\b0\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}\b/g, "[phone]");

      // Redact generic phone numbers (10-15 digits)
      scrubbed = scrubbed.replace(/\b\d{10,15}\b/g, "[phone]");

      // Redact credit card patterns (13-19 digits with optional spaces/dashes)
      scrubbed = scrubbed.replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/g,
        "[card]"
      );

      // Redact IBAN (International Bank Account Number)
      scrubbed = scrubbed.replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, "[iban]");

      // Redact IPv4 addresses
      scrubbed = scrubbed.replace(
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        (match) => {
          // Only redact valid IP ranges
          const parts = match.split(".");
          if (parts.every((p) => Number(p) >= 0 && Number(p) <= 255)) {
            return "[ip]";
          }
          return match;
        }
      );

      // Redact IPv6 addresses
      scrubbed = scrubbed.replace(
        /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
        "[ip]"
      );
      scrubbed = scrubbed.replace(/\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/g, "[ip]"); // Shortened IPv6

      // Redact potential API keys/tokens (long alphanumeric strings)
      scrubbed = scrubbed.replace(
        /\b[A-Za-z0-9]{32,}\b/g,
        (match) => {
          // Only redact if it looks like a key (no spaces, mixed case/numbers)
          if (/[A-Z]/.test(match) && /[a-z]/.test(match) && /\d/.test(match)) {
            return "[key]";
          }
          return match;
        }
      );

      return scrubbed;
    })
  );
}

/**
 * Scrub specific fields from an object
 */
export function scrubFields(obj: any, fields: string[]): any {
  const scrubbed = { ...obj };

  for (const field of fields) {
    if (field in scrubbed) {
      scrubbed[field] = "[redacted]";
    }
  }

  return scrubbed;
}

/**
 * Check if a string contains sensitive information
 */
export function containsSensitiveData(str: string): boolean {
  const patterns = [
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\./,  // JWT
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i, // Bearer token
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i, // Email
    /\+60\s?\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}/, // Malaysia phone
    /\b\d{10,15}\b/, // Phone
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/, // Credit card
    /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/, // IBAN
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/, // IPv4
    /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/, // IPv6
    /\bpassword\b/i, // Password field
    /\bsecret\b/i, // Secret field
    /\btoken\b/i, // Token field
  ];

  return patterns.some((pattern) => pattern.test(str));
}
