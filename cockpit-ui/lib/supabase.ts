/**
 * Supabase Client with RLS Support
 *
 * Implements Row-Level Security (RLS) pattern for brand isolation.
 * Follows R1.4.4 privacy-by-design requirements.
 */

import { scrubPII } from '@/lib/security/scrubber';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  brand?: string;
}

export interface QueryResult<T = any> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export interface InsertResult<T = any> {
  data: T | null;
  error: string | null;
}

/**
 * Create Supabase client with brand context
 *
 * Usage:
 * ```typescript
 * const client = createSupabaseClient({
 *   url: process.env.SUPABASE_URL!,
 *   anonKey: process.env.SUPABASE_ANON_KEY!,
 *   brand: 'voltek'
 * });
 *
 * // RLS will automatically filter by brand
 * const { data } = await client.query('ops_logs');
 * ```
 */
export function createSupabaseClient(config: SupabaseConfig) {
  const { url, anonKey, brand } = config;

  return {
    /**
     * Set brand context for RLS
     */
    setBrand(newBrand: string) {
      (config as any).brand = newBrand;
    },

    /**
     * Get current brand context
     */
    getBrand(): string | undefined {
      return config.brand;
    },

    /**
     * Query table with RLS enforcement
     */
    async query<T = any>(
      table: string,
      options: {
        select?: string;
        filters?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
      } = {}
    ): Promise<QueryResult<T>> {
      if (!config.brand) {
        return {
          data: [],
          error: 'RLS: app.brand not set',
        };
      }

      try {
        // Build query URL
        let queryUrl = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();

        if (options.select) {
          params.set('select', options.select);
        }

        if (options.limit) {
          params.set('limit', options.limit.toString());
        }

        if (options.offset) {
          params.set('offset', options.offset.toString());
        }

        if (options.orderBy) {
          params.set(
            'order',
            `${options.orderBy.column}.${options.orderBy.ascending ? 'asc' : 'desc'}`
          );
        }

        // Add filters
        if (options.filters) {
          for (const [key, value] of Object.entries(options.filters)) {
            params.set(key, `eq.${value}`);
          }
        }

        const fullUrl = `${queryUrl}?${params.toString()}`;

        const response = await fetch(fullUrl, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            // Set brand context for RLS
            'x-brand': config.brand,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            data: null,
            error: `Query failed: ${errorText}`,
          };
        }

        const data = await response.json();

        return {
          data,
          error: null,
          count: data.length,
        };
      } catch (error) {
        return {
          data: null,
          error: (error as Error).message,
        };
      }
    },

    /**
     * Insert with automatic brand tagging and PII scrubbing
     */
    async insert<T = any>(
      table: string,
      data: Record<string, any>,
      options: {
        scrubPII?: boolean;
        returning?: string;
      } = {}
    ): Promise<InsertResult<T>> {
      if (!config.brand) {
        return {
          data: null,
          error: 'RLS: app.brand not set',
        };
      }

      try {
        // Auto-tag with brand
        const insertData: Record<string, any> = {
          ...data,
          brand: config.brand,
        };

        // Scrub PII if requested
        if (options.scrubPII) {
          for (const [key, value] of Object.entries(insertData)) {
            if (typeof value === 'string') {
              insertData[key] = scrubPII(value);
            }
          }
        }

        const queryUrl = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();

        if (options.returning) {
          params.set('select', options.returning);
        }

        const fullUrl = params.toString()
          ? `${queryUrl}?${params.toString()}`
          : queryUrl;

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'x-brand': config.brand,
            Prefer: options.returning ? 'return=representation' : 'return=minimal',
          },
          body: JSON.stringify(insertData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            data: null,
            error: `Insert failed: ${errorText}`,
          };
        }

        if (options.returning) {
          const result = await response.json();
          return {
            data: Array.isArray(result) ? result[0] : result,
            error: null,
          };
        }

        return {
          data: insertData as T,
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: (error as Error).message,
        };
      }
    },

    /**
     * Update with brand enforcement
     */
    async update<T = any>(
      table: string,
      filters: Record<string, any>,
      data: Record<string, any>,
      options: {
        scrubPII?: boolean;
        returning?: string;
      } = {}
    ): Promise<InsertResult<T>> {
      if (!config.brand) {
        return {
          data: null,
          error: 'RLS: app.brand not set',
        };
      }

      try {
        const updateData: Record<string, any> = { ...data };

        // Scrub PII if requested
        if (options.scrubPII) {
          for (const [key, value] of Object.entries(updateData)) {
            if (typeof value === 'string') {
              updateData[key] = scrubPII(value);
            }
          }
        }

        let queryUrl = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();

        // Add filters
        for (const [key, value] of Object.entries(filters)) {
          params.set(key, `eq.${value}`);
        }

        if (options.returning) {
          params.set('select', options.returning);
        }

        const fullUrl = `${queryUrl}?${params.toString()}`;

        const response = await fetch(fullUrl, {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'x-brand': config.brand,
            Prefer: options.returning ? 'return=representation' : 'return=minimal',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            data: null,
            error: `Update failed: ${errorText}`,
          };
        }

        if (options.returning) {
          const result = await response.json();
          return {
            data: Array.isArray(result) ? result[0] : result,
            error: null,
          };
        }

        return {
          data: updateData as T,
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: (error as Error).message,
        };
      }
    },

    /**
     * Delete with brand enforcement
     */
    async delete(
      table: string,
      filters: Record<string, any>
    ): Promise<{ error: string | null }> {
      if (!config.brand) {
        return {
          error: 'RLS: app.brand not set',
        };
      }

      try {
        let queryUrl = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();

        // Add filters
        for (const [key, value] of Object.entries(filters)) {
          params.set(key, `eq.${value}`);
        }

        const fullUrl = `${queryUrl}?${params.toString()}`;

        const response = await fetch(fullUrl, {
          method: 'DELETE',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'x-brand': config.brand,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            error: `Delete failed: ${errorText}`,
          };
        }

        return { error: null };
      } catch (error) {
        return {
          error: (error as Error).message,
        };
      }
    },

    /**
     * RPC call with brand context
     */
    async rpc<T = any>(
      functionName: string,
      params: Record<string, any> = {}
    ): Promise<QueryResult<T>> {
      if (!config.brand) {
        return {
          data: null,
          error: 'RLS: app.brand not set',
        };
      }

      try {
        const queryUrl = `${url}/rest/v1/rpc/${functionName}`;

        const response = await fetch(queryUrl, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'x-brand': config.brand,
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            data: null,
            error: `RPC failed: ${errorText}`,
          };
        }

        const data = await response.json();

        return {
          data: Array.isArray(data) ? data : [data],
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: (error as Error).message,
        };
      }
    },
  };
}

/**
 * Get Supabase client from environment
 */
export function getSupabaseClient(brand?: string) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return createSupabaseClient({
    url,
    anonKey,
    brand,
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
