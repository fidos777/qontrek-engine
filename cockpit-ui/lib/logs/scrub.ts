// lib/logs/scrub.ts
// PII redaction for secure logging

/**
 * Redact sensitive information from log entries
 * - Email addresses → [email]
 * - Phone numbers (10-15 digits) → [phone]
 * - Credit card numbers → [card]
 * - API keys/tokens → [key]
 */
export function redact(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (typeof value !== "string") {
        return value;
      }

      let scrubbed = value;

      // Redact email addresses
      scrubbed = scrubbed.replace(
        /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
        "[email]"
      );

      // Redact phone numbers (10-15 digits)
      scrubbed = scrubbed.replace(/\b\d{10,15}\b/g, "[phone]");

      // Redact credit card patterns (13-19 digits with optional spaces/dashes)
      scrubbed = scrubbed.replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/g,
        "[card]"
      );

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
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i, // Email
    /\b\d{10,15}\b/, // Phone
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/, // Credit card
    /\bpassword\b/i, // Password field
    /\bsecret\b/i, // Secret field
    /\btoken\b/i, // Token field
  ];

  return patterns.some((pattern) => pattern.test(str));
}
