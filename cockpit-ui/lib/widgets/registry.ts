/**
 * Widget Registry
 *
 * Central registry for managing widget schemas and components.
 * Provides lookup, registration, and MCP response formatting.
 */

import type { ComponentType } from 'react';
import type { z } from 'zod';
import type {
  WidgetSchema,
  WidgetRegistryEntry,
  WidgetComponentProps,
  WidgetListResponse,
  WidgetCategory,
} from './types';
import { WidgetSchemaBase } from './types';

/**
 * Creates a validator from a widget schema.
 * Returns the base schema validator since all widgets share the same structure.
 */
function createValidatorFromSchema(_schema: WidgetSchema): z.ZodSchema {
  return WidgetSchemaBase;
}

/**
 * WidgetRegistry - Singleton registry for all widgets
 *
 * Usage:
 *   widgetRegistry.register(trustMeterSchema);
 *   const entry = widgetRegistry.get('trust_meter');
 *   const whatsappWidgets = widgetRegistry.getByCategory('whatsapp');
 */
class WidgetRegistry {
  private widgets: Map<string, WidgetRegistryEntry> = new Map();

  /**
   * Register a widget schema with optional React component
   */
  register(
    schema: WidgetSchema,
    component?: ComponentType<WidgetComponentProps>
  ): void {
    this.widgets.set(schema.type, {
      schema,
      component,
      validator: createValidatorFromSchema(schema),
    });
  }

  /**
   * Get a widget entry by type
   */
  get(type: string): WidgetRegistryEntry | undefined {
    return this.widgets.get(type);
  }

  /**
   * Check if a widget type is registered
   */
  has(type: string): boolean {
    return this.widgets.has(type);
  }

  /**
   * Get all registered widget schemas
   */
  getAll(): WidgetSchema[] {
    return Array.from(this.widgets.values()).map((w) => w.schema);
  }

  /**
   * Get widget schemas by category
   */
  getByCategory(category: WidgetCategory): WidgetSchema[] {
    return this.getAll().filter((w) => w.category === category);
  }

  /**
   * Get widget types (just the type strings)
   */
  getTypes(): string[] {
    return Array.from(this.widgets.keys());
  }

  /**
   * Get count of registered widgets
   */
  get size(): number {
    return this.widgets.size;
  }

  /**
   * Clear all registered widgets (useful for testing)
   */
  clear(): void {
    this.widgets.clear();
  }

  /**
   * Unregister a specific widget type
   */
  unregister(type: string): boolean {
    return this.widgets.delete(type);
  }

  /**
   * Bulk register multiple schemas
   */
  registerAll(schemas: WidgetSchema[]): void {
    for (const schema of schemas) {
      this.register(schema);
    }
  }

  /**
   * Format registry for MCP response
   * Returns a list of available widget types with metadata
   */
  toMCPResponse(): WidgetListResponse {
    return {
      widgets: this.getAll().map((w) => ({
        type: w.type,
        title: w.title,
        category: w.category,
      })),
    };
  }

  /**
   * Validate that a widget type exists and return its schema
   * Throws if not found
   */
  getOrThrow(type: string): WidgetRegistryEntry {
    const entry = this.get(type);
    if (!entry) {
      throw new Error(`Widget type '${type}' not registered`);
    }
    return entry;
  }

  /**
   * Get schemas grouped by category
   */
  getGroupedByCategory(): Record<WidgetCategory, WidgetSchema[]> {
    const grouped: Record<WidgetCategory, WidgetSchema[]> = {
      metrics: [],
      data: [],
      communication: [],
      governance: [],
      whatsapp: [],
    };

    for (const schema of this.getAll()) {
      grouped[schema.category].push(schema);
    }

    return grouped;
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistry();

// Export class for testing
export { WidgetRegistry };
