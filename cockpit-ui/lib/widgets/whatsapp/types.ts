/**
 * WhatsApp Widget Types
 *
 * Type definitions specific to WhatsApp Business API widgets.
 * Includes session management, templates, and messaging types.
 */

import { z } from 'zod';

// WhatsApp session status
export const SessionStatus = z.enum(['active', 'expiring', 'expired']);
export type SessionStatus = z.infer<typeof SessionStatus>;

// WhatsApp message category (affects pricing)
export const MessageCategory = z.enum(['marketing', 'utility', 'service', 'authentication']);
export type MessageCategory = z.infer<typeof MessageCategory>;

// Template status from Meta
export const TemplateStatus = z.enum(['approved', 'pending', 'rejected', 'disabled']);
export type TemplateStatus = z.infer<typeof TemplateStatus>;

// Contact schema
export const WhatsAppContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  company: z.string().optional(),
  avatar_url: z.string().optional(),
});
export type WhatsAppContact = z.infer<typeof WhatsAppContactSchema>;

// Session schema (24-hour window tracking)
export const WhatsAppSessionSchema = z.object({
  id: z.string(),
  contact: WhatsAppContactSchema,
  status: SessionStatus,
  category: MessageCategory,
  started_at: z.string(),
  expires_at: z.string(),
  expires_in: z.string(),           // Human-readable countdown
  messages_sent: z.number(),
  messages_received: z.number(),
  last_message_at: z.string().optional(),
});
export type WhatsAppSession = z.infer<typeof WhatsAppSessionSchema>;

// Template component types
export const TemplateComponentType = z.enum(['header', 'body', 'footer', 'buttons']);
export type TemplateComponentType = z.infer<typeof TemplateComponentType>;

// Template component
export const TemplateComponentSchema = z.object({
  type: TemplateComponentType,
  text: z.string().optional(),
  format: z.string().optional(),    // For header: TEXT, IMAGE, VIDEO, DOCUMENT
  example: z.array(z.string()).optional(),
});
export type TemplateComponent = z.infer<typeof TemplateComponentSchema>;

// Template schema
export const WhatsAppTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  category: MessageCategory,
  status: TemplateStatus,
  components: z.array(TemplateComponentSchema),
  variables: z.array(z.string()),
  cost_per_message: z.number(),     // USD
  last_updated: z.string().optional(),
});
export type WhatsAppTemplate = z.infer<typeof WhatsAppTemplateSchema>;

// Message direction
export const MessageDirection = z.enum(['inbound', 'outbound']);
export type MessageDirection = z.infer<typeof MessageDirection>;

// Message status
export const MessageStatus = z.enum(['sent', 'delivered', 'read', 'failed', 'pending']);
export type MessageStatus = z.infer<typeof MessageStatus>;

// Conversation message
export const ConversationMessageSchema = z.object({
  id: z.string(),
  direction: MessageDirection,
  content: z.string(),
  timestamp: z.string(),
  status: MessageStatus.optional(),
  template_name: z.string().optional(),
  media_url: z.string().optional(),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// Cost breakdown by category
export const CategoryCostSchema = z.object({
  count: z.number(),
  cost_usd: z.number(),
});
export type CategoryCost = z.infer<typeof CategoryCostSchema>;

// Cost summary
export const CostSummarySchema = z.object({
  period: z.string(),               // e.g., "2024-11"
  total_conversations: z.number(),
  total_cost_usd: z.number(),
  total_cost_myr: z.number(),
  exchange_rate: z.number(),
  by_category: z.object({
    marketing: CategoryCostSchema.optional(),
    utility: CategoryCostSchema.optional(),
    service: CategoryCostSchema.optional(),
    authentication: CategoryCostSchema.optional(),
  }),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

// AI Action insight
export const ActionInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['follow_up', 'payment_reminder', 'proposal', 'check_in', 'escalate']),
  priority: z.enum(['high', 'medium', 'low']),
  lead_id: z.string(),
  lead_name: z.string(),
  suggestion: z.string(),
  reason: z.string(),
  suggested_template: z.string().optional(),
  confidence: z.number(),           // 0-100
  expires_at: z.string().optional(),
});
export type ActionInsight = z.infer<typeof ActionInsightSchema>;

// Quick send payload
export const QuickSendPayloadSchema = z.object({
  contact_id: z.string(),
  template_id: z.string().optional(),
  message: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});
export type QuickSendPayload = z.infer<typeof QuickSendPayloadSchema>;

// WhatsApp widget data envelope
export interface WhatsAppWidgetData {
  sessions?: WhatsAppSession[];
  templates?: WhatsAppTemplate[];
  cost_summary?: CostSummary;
  messages?: ConversationMessage[];
  insights?: ActionInsight[];
  contact?: WhatsAppContact;
}
