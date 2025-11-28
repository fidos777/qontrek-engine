/**
 * WhatsApp Widget Mock Data
 *
 * Malaysian demo data for WhatsApp Business API widgets.
 * Used for development, testing, and fallback scenarios.
 */

import type {
  WhatsAppSession,
  WhatsAppTemplate,
  CostSummary,
  ConversationMessage,
  ActionInsight,
  WhatsAppContact,
} from './types';

// Demo contacts
export const mockContacts: WhatsAppContact[] = [
  {
    id: 'lead-001',
    name: 'Ahmad Razak',
    phone: '+60123456789',
    company: 'Seri Mutiara Builders',
  },
  {
    id: 'lead-002',
    name: 'Siti Nurhaliza',
    phone: '+60198765432',
    company: 'Metro Solar Sdn Bhd',
  },
  {
    id: 'lead-003',
    name: 'Raj Kumar',
    phone: '+60176543210',
    company: 'KL Property Group',
  },
  {
    id: 'lead-004',
    name: 'Tan Wei Ming',
    phone: '+60112223333',
    company: 'Sunshine Industries',
  },
  {
    id: 'lead-005',
    name: 'Fatimah Abdullah',
    phone: '+60134445555',
    company: 'Nusantara Holdings',
  },
];

// Demo sessions
export const mockSessions: WhatsAppSession[] = [
  {
    id: 'sess-001',
    contact: mockContacts[0],
    status: 'active',
    category: 'service',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 72000000).toISOString(),
    expires_in: '20h 15m',
    messages_sent: 3,
    messages_received: 2,
    last_message_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'sess-002',
    contact: mockContacts[1],
    status: 'expiring',
    category: 'utility',
    started_at: new Date(Date.now() - 79200000).toISOString(),
    expires_at: new Date(Date.now() + 7200000).toISOString(),
    expires_in: '2h 05m',
    messages_sent: 5,
    messages_received: 3,
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'sess-003',
    contact: mockContacts[2],
    status: 'active',
    category: 'marketing',
    started_at: new Date(Date.now() - 14400000).toISOString(),
    expires_at: new Date(Date.now() + 72000000).toISOString(),
    expires_in: '20h 00m',
    messages_sent: 1,
    messages_received: 1,
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Demo templates
export const mockTemplates: WhatsAppTemplate[] = [
  {
    id: 'tpl-payment-reminder',
    name: 'payment_reminder_v2',
    language: 'ms',
    category: 'utility',
    status: 'approved',
    components: [
      { type: 'header', text: 'Peringatan Pembayaran' },
      {
        type: 'body',
        text: 'Salam {{1}}, ini adalah peringatan mesra untuk pembayaran tertunggak sebanyak RM{{2}}. Sila buat pembayaran sebelum {{3}}.',
      },
      { type: 'footer', text: 'Voltek Energy Solutions' },
    ],
    variables: ['name', 'amount', 'due_date'],
    cost_per_message: 0.0435,
    last_updated: '2024-11-15T10:00:00Z',
  },
  {
    id: 'tpl-followup',
    name: 'sales_followup_v1',
    language: 'en',
    category: 'marketing',
    status: 'approved',
    components: [
      {
        type: 'body',
        text: 'Hi {{1}}, thank you for your interest in our solar solutions. Our team would like to schedule a site visit. Would {{2}} work for you?',
      },
    ],
    variables: ['name', 'proposed_date'],
    cost_per_message: 0.0625,
    last_updated: '2024-11-10T14:30:00Z',
  },
  {
    id: 'tpl-quotation-sent',
    name: 'quotation_sent_v1',
    language: 'en',
    category: 'utility',
    status: 'approved',
    components: [
      { type: 'header', text: 'Your Solar Quotation' },
      {
        type: 'body',
        text: 'Hi {{1}}, we have prepared a customized solar quotation for your property at {{2}}. Total estimated savings: RM{{3}}/month. Please review the attached document.',
      },
      { type: 'footer', text: 'Valid for 30 days' },
    ],
    variables: ['name', 'address', 'savings'],
    cost_per_message: 0.0435,
    last_updated: '2024-11-08T09:15:00Z',
  },
  {
    id: 'tpl-appointment-confirm',
    name: 'appointment_confirmation_v1',
    language: 'ms',
    category: 'utility',
    status: 'approved',
    components: [
      { type: 'header', text: 'Pengesahan Temujanji' },
      {
        type: 'body',
        text: 'Salam {{1}}, temujanji anda telah disahkan pada {{2}} jam {{3}}. Lokasi: {{4}}. Sila hubungi kami jika ada perubahan.',
      },
      { type: 'footer', text: 'Terima kasih - Voltek Energy' },
    ],
    variables: ['name', 'date', 'time', 'location'],
    cost_per_message: 0.0435,
    last_updated: '2024-11-05T16:45:00Z',
  },
  {
    id: 'tpl-installation-complete',
    name: 'installation_complete_v1',
    language: 'en',
    category: 'service',
    status: 'approved',
    components: [
      { type: 'header', text: 'Installation Complete!' },
      {
        type: 'body',
        text: 'Dear {{1}}, congratulations! Your solar system installation at {{2}} is now complete. System capacity: {{3}}kWp. Welcome to clean energy!',
      },
      { type: 'footer', text: 'Thank you for choosing Voltek' },
    ],
    variables: ['name', 'address', 'capacity'],
    cost_per_message: 0.0,
    last_updated: '2024-11-01T11:00:00Z',
  },
];

// Demo cost summary
export const mockCostSummary: CostSummary = {
  period: '2024-11',
  total_conversations: 156,
  total_cost_usd: 12.45,
  total_cost_myr: 58.52,
  exchange_rate: 4.7,
  by_category: {
    marketing: { count: 23, cost_usd: 1.44 },
    utility: { count: 89, cost_usd: 3.87 },
    service: { count: 44, cost_usd: 7.14 },
  },
};

// Demo conversation messages
export const mockConversationMessages: ConversationMessage[] = [
  {
    id: 'msg-001',
    direction: 'outbound',
    content:
      'Salam En. Ahmad, ini adalah peringatan mesra untuk pembayaran tertunggak sebanyak RM15,000. Sila buat pembayaran sebelum 30 November.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'read',
    template_name: 'payment_reminder_v2',
  },
  {
    id: 'msg-002',
    direction: 'inbound',
    content: 'Terima kasih. Saya akan buat pembayaran esok.',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'msg-003',
    direction: 'outbound',
    content:
      'Terima kasih En. Ahmad. Sila hubungi kami jika ada sebarang pertanyaan.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'delivered',
  },
  {
    id: 'msg-004',
    direction: 'inbound',
    content: 'Boleh saya minta invoice sekali lagi?',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-005',
    direction: 'outbound',
    content: 'Sudah tentu. Invoice akan dihantar ke email anda dalam beberapa minit.',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    status: 'sent',
  },
];

// Demo AI action insights
export const mockActionInsights: ActionInsight[] = [
  {
    id: 'insight-001',
    type: 'payment_reminder',
    priority: 'high',
    lead_id: 'lead-001',
    lead_name: 'Ahmad Razak',
    suggestion: 'Send payment reminder - RM15,000 overdue by 5 days',
    reason:
      'Payment was promised yesterday but not received. Customer has good payment history.',
    suggested_template: 'payment_reminder_v2',
    confidence: 92,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'insight-002',
    type: 'follow_up',
    priority: 'medium',
    lead_id: 'lead-002',
    lead_name: 'Siti Nurhaliza',
    suggestion: 'Follow up on quotation sent 3 days ago',
    reason:
      'No response after quotation. Similar leads respond within 2 days on average.',
    suggested_template: 'sales_followup_v1',
    confidence: 78,
    expires_at: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: 'insight-003',
    type: 'check_in',
    priority: 'low',
    lead_id: 'lead-003',
    lead_name: 'Raj Kumar',
    suggestion: 'Check installation satisfaction - 1 week post-install',
    reason: 'Standard 1-week satisfaction check for new installations.',
    suggested_template: 'installation_complete_v1',
    confidence: 85,
    expires_at: new Date(Date.now() + 259200000).toISOString(),
  },
  {
    id: 'insight-004',
    type: 'proposal',
    priority: 'high',
    lead_id: 'lead-004',
    lead_name: 'Tan Wei Ming',
    suggestion: 'Send proposal - hot lead from website inquiry',
    reason:
      'Lead filled detailed inquiry form with budget and timeline. High intent signals.',
    suggested_template: 'quotation_sent_v1',
    confidence: 88,
    expires_at: new Date(Date.now() + 43200000).toISOString(),
  },
  {
    id: 'insight-005',
    type: 'escalate',
    priority: 'high',
    lead_id: 'lead-005',
    lead_name: 'Fatimah Abdullah',
    suggestion: 'Escalate to manager - customer complaint unresolved',
    reason:
      'Customer expressed dissatisfaction 2 days ago. No resolution yet. Risk of churn.',
    confidence: 95,
    expires_at: new Date(Date.now() + 21600000).toISOString(),
  },
];

// Combined mock data export
export const whatsappMockData = {
  contacts: mockContacts,
  sessions: mockSessions,
  templates: mockTemplates,
  cost_summary: mockCostSummary,
  messages: mockConversationMessages,
  insights: mockActionInsights,
};

// Helper to get mock data by widget type
export function getMockDataForWidget(
  widgetType: string
): Record<string, unknown> {
  switch (widgetType) {
    case 'whatsapp:session_card':
      return { session: mockSessions[0] };

    case 'whatsapp:conversation_timeline':
      return {
        conversation: {
          contact: mockContacts[0],
          messages: mockConversationMessages,
        },
      };

    case 'whatsapp:cost_breakdown':
      return { cost: mockCostSummary };

    case 'whatsapp:template_picker':
      return { templates: mockTemplates };

    case 'whatsapp:send_panel':
      return {
        send: {
          recipient: mockContacts[0],
          session_status: 'active',
          session_note: 'Session active - free replies for 20h',
          selected_template: mockTemplates[0],
          message_preview:
            'Salam Ahmad Razak, ini adalah peringatan mesra...',
          variables: { name: 'Ahmad Razak', amount: '15,000', due_date: '30 Nov' },
        },
      };

    case 'whatsapp:contact_card':
      return {
        contact: {
          ...mockContacts[0],
          whatsapp_status: 'active',
          last_contact: new Date(Date.now() - 1800000).toISOString(),
          total_messages: 15,
          lead_value: 45000,
          lead_stage: 'proposal',
        },
      };

    case 'whatsapp:action_insights':
      return { insights: mockActionInsights };

    default:
      return {};
  }
}
