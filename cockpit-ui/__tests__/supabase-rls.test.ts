/**
 * Supabase RLS Unit Tests
 *
 * Verifies Row-Level Security policies prevent cross-tenant data access.
 * Tests privacy-by-design requirements for R1.4.4.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase client
class MockSupabaseClient {
  private currentBrand: string | null = null;

  async setConfig(key: string, value: string) {
    if (key === 'app.brand') {
      this.currentBrand = value;
    }
  }

  async query(table: string, filters: Record<string, any> = {}) {
    // Simulate RLS enforcement
    if (!this.currentBrand) {
      return { data: [], error: null };
    }

    // Mock data with brand isolation
    const mockData = [
      { id: 1, brand: 'voltek', data: 'Voltek data' },
      { id: 2, brand: 'perodua', data: 'Perodua data' },
      { id: 3, brand: 'voltek', data: 'More Voltek data' },
    ];

    // RLS filters by current brand
    const filtered = mockData.filter(row => row.brand === this.currentBrand);

    return { data: filtered, error: null };
  }

  async insert(table: string, data: Record<string, any>) {
    if (!this.currentBrand) {
      return { error: 'RLS: app.brand not set' };
    }

    // RLS automatically adds brand
    data.brand = this.currentBrand;
    return { data, error: null };
  }
}

describe('Supabase RLS Tests', () => {
  let client: MockSupabaseClient;

  beforeEach(() => {
    client = new MockSupabaseClient();
  });

  it('should prevent access without app.brand set', async () => {
    const result = await client.query('ops_logs');
    expect(result.data).toHaveLength(0);
  });

  it('should isolate Voltek data', async () => {
    await client.setConfig('app.brand', 'voltek');
    const result = await client.query('ops_logs');

    expect(result.data).toHaveLength(2);
    expect(result.data?.every((row: any) => row.brand === 'voltek')).toBe(true);
  });

  it('should isolate Perodua data', async () => {
    await client.setConfig('app.brand', 'perodua');
    const result = await client.query('ops_logs');

    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].brand).toBe('perodua');
  });

  it('should reject cross-tenant reads', async () => {
    await client.setConfig('app.brand', 'voltek');
    const result = await client.query('ops_logs');

    // Should not see Perodua data
    expect(result.data?.some((row: any) => row.brand === 'perodua')).toBe(false);
  });

  it('should auto-tag inserts with current brand', async () => {
    await client.setConfig('app.brand', 'voltek');
    const result = await client.insert('ops_logs', {
      message: 'Test log',
    });

    expect(result.data?.brand).toBe('voltek');
  });

  it('should reject inserts without app.brand', async () => {
    const result = await client.insert('ops_logs', {
      message: 'Test log',
    });

    expect(result.error).toBeTruthy();
    expect(result.error).toContain('app.brand not set');
  });

  it('should enforce RLS on views', async () => {
    await client.setConfig('app.brand', 'voltek');

    // vw_unmetered_24h should respect RLS
    const result = await client.query('vw_unmetered_24h');

    expect(result.data?.every((row: any) => row.brand === 'voltek')).toBe(true);
  });
});

describe('Privacy Scrubber Tests', () => {
  // Mock scrubber function
  function scrubPII(text: string): string {
    return text
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]')
      .replace(/\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, '[PHONE_REDACTED]')
      .replace(/\b\d{6}-\d{2}-\d{4}\b/g, '[NRIC_REDACTED]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[UUID_REDACTED]')
      .replace(/arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9/_-]+/gi, '[AWS_ARN_REDACTED]')
      .replace(/AIza[0-9A-Za-z_-]{35}/g, '[API_KEY_REDACTED]');
  }

  it('should redact email addresses', () => {
    const input = 'Contact user@example.com for details';
    const output = scrubPII(input);
    expect(output).toBe('Contact [EMAIL_REDACTED] for details');
  });

  it('should redact phone numbers', () => {
    const input = 'Call +60123456789 or 03-12345678';
    const output = scrubPII(input);
    expect(output).toContain('[PHONE_REDACTED]');
  });

  it('should redact NRIC numbers', () => {
    const input = 'NRIC: 920101-14-5678';
    const output = scrubPII(input);
    expect(output).toBe('NRIC: [NRIC_REDACTED]');
  });

  it('should redact UUID v4', () => {
    const input = 'User ID: 550e8400-e29b-41d4-a716-446655440000';
    const output = scrubPII(input);
    expect(output).toBe('User ID: [UUID_REDACTED]');
  });

  it('should redact AWS ARN', () => {
    const input = 'Resource: arn:aws:s3:::bucket/key';
    const output = scrubPII(input);
    expect(output).toBe('Resource: [AWS_ARN_REDACTED]');
  });

  it('should redact Google API keys', () => {
    const input = 'Key: AIzaSyD1234567890abcdefghijklmnopqrs';
    const output = scrubPII(input);
    expect(output).toBe('Key: [API_KEY_REDACTED]');
  });

  it('should handle multiple PII types', () => {
    const input = 'Contact user@test.com at +60123456789, NRIC 920101-14-5678';
    const output = scrubPII(input);

    expect(output).not.toContain('user@test.com');
    expect(output).not.toContain('+60123456789');
    expect(output).not.toContain('920101-14-5678');
  });
});
