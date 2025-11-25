/**
 * Send WhatsApp message via integration
 */
export async function sendWhatsApp(params: {
  tenantId: string;
  to: string;
  message: string;
  templateId?: string;
}) {
  // Mock WhatsApp send - in production this would call WhatsApp Business API
  if (!params.to || !params.message) {
    return {
      success: false,
      error: 'Missing required fields: to, message',
    };
  }

  return {
    success: true,
    tenantId: params.tenantId,
    message: {
      id: `wa_msg_${Date.now()}`,
      to: params.to,
      status: 'queued',
      templateId: params.templateId || null,
      queuedAt: new Date().toISOString(),
    },
  };
}
