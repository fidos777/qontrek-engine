// lib/mcp/tools/whatsapp.ts
// IMPORTANT: This wraps the EXISTING WhatsApp implementation from agent_runner.py

export interface WhatsAppResponse {
  success: boolean;
  messageId: string;
  to: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  provider?: string;
  dryRun?: boolean;
  creditUsed?: number;
}

export interface MessageStatus {
  messageId: string;
  status: string;
  deliveredAt?: string;
  readAt?: string;
  creditUsed?: number;
  message?: string;
}

// Match the Malaysian phone formatting from tower_notify_gateway.py
function formatMalaysianPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  // Add Malaysia code if missing
  if (!cleaned.startsWith('60')) {
    cleaned = '60' + cleaned;
  }

  // Format as international without + (WhatChimp expects without +)
  return cleaned;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  templateId?: string
): Promise<WhatsAppResponse> {
  const formattedPhone = formatMalaysianPhone(to);
  console.log(`[WhatsApp] Sending to ${formattedPhone}`);

  // Check DRY_RUN flag (CRITICAL: matches agent_runner.py safety pattern)
  // Default to DRY_RUN=1 for safety
  const isDryRun = process.env.DRY_RUN !== '0';

  // Use WHATCHIMP_KEY (matches agent_runner.py) or fallback to WHATCHIMP_API_TOKEN
  const whatChimpKey = process.env.WHATCHIMP_KEY || process.env.WHATCHIMP_API_TOKEN;
  const whatChimpPhoneId = process.env.WHATCHIMP_PHONE_ID || '775840838934449';
  const defaultTemplateId = templateId || process.env.WHATCHIMP_TEMPLATE_ID || '220934';

  if (!whatChimpKey) {
    console.warn('[WhatsApp] WHATCHIMP_KEY not set, using mock mode');

    return {
      success: true,
      messageId: `mock-wa-${Date.now()}`,
      to: formattedPhone,
      status: 'sent',
      timestamp: new Date().toISOString(),
      provider: 'mock',
      dryRun: true
    };
  }

  if (isDryRun) {
    console.log('[WhatsApp] DRY_RUN enabled, skipping actual send');
    console.log('[WhatsApp] Would send:', { to: formattedPhone, message, templateId: defaultTemplateId });

    return {
      success: true,
      messageId: `dry-run-${Date.now()}`,
      to: formattedPhone,
      status: 'queued',
      timestamp: new Date().toISOString(),
      provider: 'whatchimp',
      dryRun: true
    };
  }

  // REAL WhatChimp API call (matches agent_runner.py:190-237)
  try {
    // Use the EXACT endpoint from tower_notify_gateway.py
    const whatChimpUrl = process.env.WHATCHIMP_API_URL || 'https://app.whatchimp.com/api/v1/whatsapp';
    const endpoint = `${whatChimpUrl}/send/template`;

    // Build payload matching tower_notify_gateway.py structure
    const payload = {
      apiToken: whatChimpKey,
      phone_number_id: whatChimpPhoneId,
      template_id: defaultTemplateId,
      to: formattedPhone,
      // Template variables - message content goes in first variable
      'templateVariable-system-cart-product-list-2': message,
      'templateVariable-system-cart-total-price-3': '',
      'templateVariable-system-shipping-address-4': 'Qontrek MCP',
      'templateVariable-system-delivery-date-5': new Date().toISOString().split('T')[0]
    };

    console.log('[WhatsApp] Sending to WhatChimp:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] WhatChimp API error:', error);

      // Log to wa_template_log with status='reversed' (matches migrations)
      console.log('[WhatsApp] Would log failure to wa_template_log table');

      throw new Error(`WhatsApp API failed (${response.status}): ${error}`);
    }

    const result = await response.json() as { message_id?: string; id?: string };

    // Log successful send (matches wa_template_log pattern)
    console.log('[WhatsApp] Success, would log to wa_template_log table');

    return {
      success: true,
      messageId: result.message_id || result.id || `wc-${Date.now()}`,
      to: formattedPhone,
      status: 'sent',
      timestamp: new Date().toISOString(),
      provider: 'whatchimp',
      dryRun: false,
      creditUsed: 1
    };

  } catch (error) {
    console.error('[WhatsApp] Send failed:', error);
    throw error;
  }
}

export async function getMessageStatus(messageId: string): Promise<MessageStatus> {
  // Would query wa_template_log table for status
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      messageId,
      status: 'unknown',
      message: 'Supabase not configured'
    };
  }

  // Query wa_template_log for message status
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/wa_template_log?message_id=eq.${messageId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json() as Array<{
        status?: string;
        delivered_at?: string;
        read_at?: string;
        credit_used?: number;
      }>;
      if (data && data.length > 0) {
        return {
          messageId,
          status: data[0].status || 'sent',
          deliveredAt: data[0].delivered_at,
          readAt: data[0].read_at,
          creditUsed: data[0].credit_used
        };
      }
    }
  } catch (error) {
    console.error('[WhatsApp] Status check failed:', error);
  }

  return {
    messageId,
    status: 'unknown',
    message: 'Status not available'
  };
}

export async function sendBulkWhatsApp(
  messages: Array<{ to: string; message: string; templateId?: string }>
): Promise<Array<WhatsAppResponse>> {
  const results: WhatsAppResponse[] = [];

  for (const msg of messages) {
    try {
      const result = await sendWhatsAppMessage(msg.to, msg.message, msg.templateId);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        messageId: `error-${Date.now()}`,
        to: msg.to,
        status: 'failed',
        timestamp: new Date().toISOString(),
        provider: 'whatchimp',
        dryRun: false
      });
    }
  }

  return results;
}
