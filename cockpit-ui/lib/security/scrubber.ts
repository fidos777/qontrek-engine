/**
 * PII Scrubber
 *
 * Redacts personally identifiable information from logs and payloads.
 * Extended patterns for UUID v4, AWS ARN, Google API keys, and NRIC.
 */

export interface ScrubberOptions {
  patterns?: 'all' | 'basic' | 'extended';
  customPatterns?: Array<{ name: string; pattern: RegExp; replacement: string }>;
}

/**
 * Default PII patterns
 */
export const DEFAULT_PATTERNS = {
  email: {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[EMAIL_REDACTED]',
  },
  phone: {
    pattern: /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
    replacement: '[PHONE_REDACTED]',
  },
  creditCard: {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
  },
};

/**
 * Extended PII patterns
 */
export const EXTENDED_PATTERNS = {
  nric: {
    pattern: /\b\d{6}-\d{2}-\d{4}\b/g,
    replacement: '[NRIC_REDACTED]',
  },
  uuid_v4: {
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    replacement: '[UUID_REDACTED]',
  },
  aws_arn: {
    pattern: /arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9/_-]+/gi,
    replacement: '[AWS_ARN_REDACTED]',
  },
  google_api_key: {
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    replacement: '[API_KEY_REDACTED]',
  },
  jwt_token: {
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replacement: '[JWT_REDACTED]',
  },
  ipv4: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
  },
  aws_access_key: {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: '[AWS_KEY_REDACTED]',
  },
  github_token: {
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    replacement: '[GITHUB_TOKEN_REDACTED]',
  },
};

/**
 * Scrub PII from text
 */
export function scrubPII(text: string, options: ScrubberOptions = {}): string {
  const { patterns = 'extended', customPatterns = [] } = options;

  let scrubbed = text;

  // Apply default patterns
  for (const [name, config] of Object.entries(DEFAULT_PATTERNS)) {
    scrubbed = scrubbed.replace(config.pattern, config.replacement);
  }

  // Apply extended patterns if requested
  if (patterns === 'extended' || patterns === 'all') {
    for (const [name, config] of Object.entries(EXTENDED_PATTERNS)) {
      scrubbed = scrubbed.replace(config.pattern, config.replacement);
    }
  }

  // Apply custom patterns
  for (const custom of customPatterns) {
    scrubbed = scrubbed.replace(custom.pattern, custom.replacement);
  }

  return scrubbed;
}

/**
 * Scrub PII from object (recursive)
 */
export function scrubObject<T extends Record<string, any>>(
  obj: T,
  options: ScrubberOptions = {}
): T {
  const scrubbed: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      scrubbed[key] = scrubPII(value, options);
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubObject(value, options);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed as T;
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  const allPatterns = { ...DEFAULT_PATTERNS, ...EXTENDED_PATTERNS };

  for (const config of Object.values(allPatterns)) {
    if (config.pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Scrub PII from audit mirror payload
 */
export function scrubAuditPayload(payload: Record<string, any>): Record<string, any> {
  return scrubObject(payload, { patterns: 'extended' });
}
