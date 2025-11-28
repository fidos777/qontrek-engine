// lib/verticals/registry.ts
// VerticalRegistry class for managing vertical templates

import type {
  VerticalTemplate,
  VerticalRegistryEntry,
  VerticalId,
  StageConfig,
  KPIDefinition,
  DashboardLayout,
  WhatsAppTemplateConfig,
  FieldMapping,
  MCPVerticalsResponse,
} from './types';

class VerticalRegistry {
  private verticals: Map<VerticalId, VerticalRegistryEntry> = new Map();

  /**
   * Register a vertical template with its mock data
   */
  register(template: VerticalTemplate, mockData: Record<string, unknown>): void {
    this.verticals.set(template.id, { template, mockData });
  }

  /**
   * Get a vertical registry entry by ID
   */
  get(id: VerticalId): VerticalRegistryEntry | undefined {
    return this.verticals.get(id);
  }

  /**
   * Get a vertical template by ID
   */
  getTemplate(id: VerticalId): VerticalTemplate | undefined {
    return this.verticals.get(id)?.template;
  }

  /**
   * Get mock data for a vertical by ID
   */
  getMockData(id: VerticalId): Record<string, unknown> | undefined {
    return this.verticals.get(id)?.mockData;
  }

  /**
   * Get all registered vertical templates
   */
  getAll(): VerticalTemplate[] {
    return Array.from(this.verticals.values()).map(v => v.template);
  }

  /**
   * Get all registered vertical IDs
   */
  getIds(): VerticalId[] {
    return Array.from(this.verticals.keys());
  }

  /**
   * Check if a vertical is registered
   */
  has(id: VerticalId): boolean {
    return this.verticals.has(id);
  }

  /**
   * Get field label mapping for a specific field
   */
  getFieldMapping(verticalId: VerticalId, genericField: string): FieldMapping | undefined {
    const template = this.getTemplate(verticalId);
    return template?.field_mappings.find(m => m.generic_field === genericField);
  }

  /**
   * Get vertical-specific label for a generic field
   */
  getFieldLabel(verticalId: VerticalId, genericField: string): string | undefined {
    return this.getFieldMapping(verticalId, genericField)?.vertical_label;
  }

  /**
   * Get pipeline stages for a vertical
   */
  getStages(verticalId: VerticalId): StageConfig[] {
    return this.getTemplate(verticalId)?.stages ?? [];
  }

  /**
   * Get stage info by stage ID
   */
  getStage(verticalId: VerticalId, stageId: string): StageConfig | undefined {
    return this.getStages(verticalId).find(s => s.id === stageId);
  }

  /**
   * Get KPI definitions for a vertical
   */
  getKPIs(verticalId: VerticalId): KPIDefinition[] {
    return this.getTemplate(verticalId)?.kpis ?? [];
  }

  /**
   * Get a specific KPI definition
   */
  getKPI(verticalId: VerticalId, kpiId: string): KPIDefinition | undefined {
    return this.getKPIs(verticalId).find(k => k.id === kpiId);
  }

  /**
   * Get dashboard layouts for a vertical
   */
  getDashboards(verticalId: VerticalId): DashboardLayout[] {
    return this.getTemplate(verticalId)?.dashboards ?? [];
  }

  /**
   * Get a specific dashboard layout
   */
  getDashboard(verticalId: VerticalId, dashboardId: string): DashboardLayout | undefined {
    return this.getDashboards(verticalId).find(d => d.id === dashboardId);
  }

  /**
   * Get WhatsApp templates for a vertical
   */
  getWhatsAppTemplates(verticalId: VerticalId): WhatsAppTemplateConfig[] {
    return this.getTemplate(verticalId)?.whatsapp_templates ?? [];
  }

  /**
   * Get a specific WhatsApp template
   */
  getWhatsAppTemplate(verticalId: VerticalId, templateId: string): WhatsAppTemplateConfig | undefined {
    return this.getWhatsAppTemplates(verticalId).find(t => t.id === templateId);
  }

  /**
   * Get WhatsApp templates for a specific use case
   */
  getWhatsAppTemplatesForUseCase(verticalId: VerticalId, useCase: string): WhatsAppTemplateConfig[] {
    return this.getWhatsAppTemplates(verticalId).filter(t =>
      t.use_cases.some(uc => uc.toLowerCase().includes(useCase.toLowerCase()))
    );
  }

  /**
   * Get governance configuration for a vertical
   */
  getGovernance(verticalId: VerticalId) {
    return this.getTemplate(verticalId)?.governance;
  }

  /**
   * Get feature flags for a vertical
   */
  getFeatures(verticalId: VerticalId) {
    return this.getTemplate(verticalId)?.features;
  }

  /**
   * Check if a feature is enabled for a vertical
   */
  isFeatureEnabled(verticalId: VerticalId, feature: keyof VerticalTemplate['features']): boolean {
    const features = this.getFeatures(verticalId);
    return features?.[feature] ?? false;
  }

  /**
   * For MCP: returns available verticals in API-friendly format
   */
  toMCPResponse(): MCPVerticalsResponse {
    return {
      verticals: this.getAll().map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
      })),
    };
  }

  /**
   * Get count of registered verticals
   */
  get size(): number {
    return this.verticals.size;
  }
}

// Singleton instance
export const verticalRegistry = new VerticalRegistry();

// Export class for testing
export { VerticalRegistry };
