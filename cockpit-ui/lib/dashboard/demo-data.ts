// lib/dashboard/demo-data.ts
// Demo data generators for widgets

import type { WidgetType, WidgetConfig, WidgetData } from "@/lib/widgets/types";

/**
 * Generate demo data based on widget type
 */
export function generateDemoData(
  widgetType: WidgetType,
  config: WidgetConfig
): WidgetData {
  switch (widgetType) {
    case "kpi_card":
      return generateKPICardData(config);
    case "trust_meter":
      return generateTrustMeterData();
    case "pipeline_funnel":
      return generatePipelineFunnelData(config);
    case "recovery_chart":
      return generateRecoveryChartData();
    case "lead_table":
      return generateLeadTableData(config);
    case "reminder_list":
      return generateReminderListData();
    case "success_feed":
      return generateSuccessFeedData();
    case "governance_strip":
      return generateGovernanceStripData();
    case "lead_heatmap":
      return generateLeadHeatmapData();
    case "wa_session_card":
      return generateWASessionCardData();
    case "wa_conversation_timeline":
      return generateWAConversationTimelineData();
    case "wa_cost_breakdown":
      return generateWACostBreakdownData();
    case "wa_send_panel":
      return generateWASendPanelData();
    default:
      return {};
  }
}

function generateKPICardData(config: WidgetConfig): WidgetData {
  const metricKey = "metric_key" in config ? config.metric_key : "";

  const demoValues: Record<string, { value: number; trend?: number }> = {
    total_leads: { value: 150, trend: 0.12 },
    hot_leads: { value: 32, trend: 0.08 },
    warm_leads: { value: 68, trend: -0.05 },
    cold_leads: { value: 50, trend: 0.02 },
    conversion_rate: { value: 0.21, trend: 0.03 },
    total_recoverable: { value: 152500, trend: -0.08 },
    recovery_rate_7d: { value: 0.32, trend: 0.05 },
    recovery_rate_30d: { value: 0.58, trend: 0.02 },
    pending_cases: { value: 14, trend: -0.15 },
    total_revenue: { value: 2850000, trend: 0.15 },
    total_outstanding: { value: 485000, trend: -0.03 },
    collection_rate: { value: 0.87, trend: 0.02 },
    avg_margin: { value: 0.42, trend: 0.01 },
    active_policies: { value: 234, trend: 0.08 },
    premium_mtd: { value: 125000, trend: 0.12 },
    renewal_rate: { value: 0.78, trend: 0.03 },
    orders_today: { value: 47, trend: 0.22 },
    revenue_today: { value: 18500, trend: 0.18 },
    avg_order_value: { value: 394, trend: 0.05 },
    cart_abandonment_rate: { value: 0.32, trend: -0.04 },
    active_shipments: { value: 89, trend: 0.1 },
    on_time_rate: { value: 0.94, trend: 0.02 },
    fleet_utilization: { value: 0.78, trend: 0.05 },
    pending_pickups: { value: 12, trend: -0.2 },
    appointments_today: { value: 28, trend: 0.08 },
    new_patients_mtd: { value: 45, trend: 0.15 },
    revenue_mtd: { value: 85000, trend: 0.12 },
    no_show_rate: { value: 0.08, trend: -0.02 },
  };

  const data = demoValues[metricKey] || { value: 0 };
  return {
    value: data.value,
    trend: data.trend,
    trend_label: "vs last period",
  };
}

function generateTrustMeterData(): WidgetData {
  return {
    score: 78,
    breakdown: [
      { key: "compliance", label: "Compliance", value: 85, weight: 0.3 },
      { key: "security", label: "Security", value: 72, weight: 0.25 },
      { key: "accuracy", label: "Accuracy", value: 80, weight: 0.25 },
      { key: "timeliness", label: "Timeliness", value: 75, weight: 0.2 },
    ],
    last_updated: new Date().toISOString(),
  };
}

function generatePipelineFunnelData(config: WidgetConfig): WidgetData {
  const stages = "stages" in config ? config.stages : [];

  return {
    stages: stages.map((stage, index) => ({
      key: stage.key,
      count: Math.floor(100 * Math.pow(0.7, index)),
      value: Math.floor(500000 * Math.pow(0.7, index)),
    })),
    conversions: stages.slice(0, -1).map((stage, index) => ({
      from: stage.key,
      to: stages[index + 1]?.key || "",
      rate: 0.65 + Math.random() * 0.2,
    })),
  };
}

function generateRecoveryChartData(): WidgetData {
  const now = new Date();
  const series = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    const recovered = 15000 + Math.random() * 10000;
    const outstanding = 25000 + Math.random() * 15000;
    return {
      date: date.toISOString().split("T")[0],
      recovered: Math.floor(recovered),
      outstanding: Math.floor(outstanding),
      rate: recovered / (recovered + outstanding),
    };
  });

  return {
    series,
    summary: {
      total_recovered: series.reduce((sum, s) => sum + s.recovered, 0),
      total_outstanding: series.reduce((sum, s) => sum + s.outstanding, 0),
      average_rate: series.reduce((sum, s) => sum + s.rate, 0) / series.length,
    },
  };
}

function generateLeadTableData(config: WidgetConfig): WidgetData {
  const companies = [
    "TechCorp Sdn Bhd",
    "Green Energy Solutions",
    "Metro Builders",
    "Alpha Logistics",
    "Sunrise Trading",
    "Bright Future Consultancy",
    "Horizon Industries",
    "Prime Holdings",
    "Mega Solar Systems",
    "Pacific Trading Co",
  ];

  const contacts = [
    "Ahmad bin Hassan",
    "Siti Nurhaliza",
    "David Tan",
    "Lee Mei Ling",
    "Kumar Rajesh",
    "Nurul Huda",
    "Wong Kah Wei",
    "Fatimah Abdullah",
    "Ravi Krishnan",
    "Chen Li Hua",
  ];

  const statuses = ["hot", "warm", "cold"];
  const stages = ["OVERDUE", "CRITICAL", "PENDING", "ACTIVE"];
  const sources = ["Website Form", "LinkedIn", "Referral", "Google Ads", "Cold Outreach"];

  const rows = Array.from({ length: 10 }, (_, i) => {
    const now = new Date();
    const created = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const lastContact = new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000);

    return {
      id: `L${String(i + 1).padStart(3, "0")}`,
      company: companies[i % companies.length],
      name: companies[i % companies.length],
      contact: contacts[i % contacts.length],
      status: statuses[i % statuses.length],
      stage: stages[i % stages.length],
      score: 40 + Math.floor(Math.random() * 55),
      amount: 5000 + Math.floor(Math.random() * 30000),
      source: sources[i % sources.length],
      response_time: (2 + Math.random() * 6).toFixed(1),
      overdue_days: Math.floor(Math.random() * 30),
      created_at: created.toISOString(),
      last_contact: lastContact.toISOString(),
      last_reminder_at: lastContact.toISOString(),
    };
  });

  return {
    rows,
    total: rows.length,
    page: 1,
    page_size: 10,
  };
}

function generateReminderListData(): WidgetData {
  const channels = ["email", "whatsapp", "sms", "call"] as const;
  const statuses = ["queued", "sent", "failed"] as const;

  const recipients = [
    { name: "Alpha Engineering", email: "alpha.finance@alphaeng.my", phone: "+60-12-345-6678" },
    { name: "Seri Mutiara Builders", email: "accounts@serimutiarabuilders.com", phone: "+60-13-234-5567" },
    { name: "Metro Solar Sdn Bhd", email: "finance@metrosolar.my", phone: "+60-11-987-6543" },
    { name: "Bina Maju Trading", email: "billing@binamaju.com", phone: "+60-14-876-5432" },
    { name: "Kemuncak Glass", email: "admin@kemuncakglass.my", phone: "+60-16-765-4321" },
  ];

  const reminders = recipients.map((recipient, i) => {
    const channel = channels[i % channels.length];
    const scheduled = new Date();
    scheduled.setHours(scheduled.getHours() + Math.floor(Math.random() * 24));

    return {
      id: `REM-${String(i + 1).padStart(3, "0")}`,
      recipient: channel === "email" ? recipient.email : recipient.phone,
      channel,
      scheduled_at: scheduled.toISOString(),
      status: statuses[i % statuses.length],
      entity_name: recipient.name,
      message_preview: "Payment reminder for invoice #INV-2025-001...",
    };
  });

  return { reminders };
}

function generateSuccessFeedData(): WidgetData {
  const names = [
    "Bina Maju Trading",
    "Kemuncak Glass",
    "Horizon Tech",
    "Pacific Solutions",
    "Dynamic Systems",
  ];

  const items = names.map((name, i) => {
    const completedAt = new Date();
    completedAt.setHours(completedAt.getHours() - Math.floor(Math.random() * 48));

    return {
      id: `SUC-${String(i + 1).padStart(3, "0")}`,
      entity_name: name,
      value: 5000 + Math.floor(Math.random() * 20000),
      completed_at: completedAt.toISOString(),
      metric_label: "Days to pay",
      metric_value: 5 + Math.floor(Math.random() * 10),
      badge: i === 0 ? "Fastest" : undefined,
    };
  });

  return { items };
}

function generateGovernanceStripData(): WidgetData {
  const gateIds = ["G13", "G14", "G15", "G16", "G17", "G18", "G19", "G20", "G21"];
  const gateNames = [
    "Data Privacy",
    "Audit Trail",
    "Access Control",
    "Encryption",
    "Backup",
    "Retention",
    "Consent",
    "Breach Response",
    "Training",
  ];
  const statuses = ["pass", "pass", "partial", "pass", "pending", "pass", "pass", "partial", "pass"] as const;

  const gates = gateIds.map((id, i) => ({
    id,
    name: gateNames[i],
    status: statuses[i],
    last_checked: new Date().toISOString(),
    evidence_count: Math.floor(Math.random() * 10) + 1,
  }));

  return {
    gates,
    summary: {
      passed: gates.filter((g) => g.status === "pass").length,
      total: gates.length,
    },
  };
}

function generateLeadHeatmapData(): WidgetData {
  const xLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const yLabels = ["Hot", "Warm", "Cold"];

  const cells = xLabels.flatMap((x) =>
    yLabels.map((y) => ({
      x,
      y,
      value: Math.floor(Math.random() * 20),
    }))
  );

  return {
    cells,
    x_labels: xLabels,
    y_labels: yLabels,
    max_value: Math.max(...cells.map((c) => c.value)),
  };
}

function generateWASessionCardData(): WidgetData {
  return {
    session_id: "wa-session-abc123",
    phone_number: "+60-12-345-6789",
    status: "active",
    started_at: new Date(Date.now() - 3600000).toISOString(),
    last_activity: new Date(Date.now() - 300000).toISOString(),
    message_count: 15,
    cost: 2.5,
  };
}

function generateWAConversationTimelineData(): WidgetData {
  const messages = [
    { direction: "outbound", content: "Hi, this is a reminder about your outstanding payment.", status: "read" },
    { direction: "inbound", content: "Thank you for the reminder. I will make the payment by end of week." },
    { direction: "outbound", content: "That's great! Let me know if you need the bank details.", status: "delivered" },
    { direction: "inbound", content: "Yes please, can you share the details?" },
    { direction: "outbound", content: "Bank: Maybank\nAccount: 1234567890\nName: Qontrek Sdn Bhd", status: "sent" },
  ].map((msg, i) => ({
    id: `msg-${i + 1}`,
    direction: msg.direction as "inbound" | "outbound",
    content: msg.content,
    timestamp: new Date(Date.now() - (5 - i) * 600000).toISOString(),
    status: msg.status as "sent" | "delivered" | "read" | undefined,
    media_type: "text" as const,
  }));

  return {
    messages,
    session_info: {
      contact_name: "Ahmad bin Hassan",
      phone_number: "+60-12-345-6789",
    },
  };
}

function generateWACostBreakdownData(): WidgetData {
  return {
    total_cost: 45.5,
    breakdown: [
      { category: "Marketing", count: 120, cost: 18.0 },
      { category: "Payment Reminders", count: 85, cost: 12.75 },
      { category: "Customer Support", count: 65, cost: 9.75 },
      { category: "Order Updates", count: 35, cost: 5.0 },
    ],
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    period_end: new Date().toISOString(),
  };
}

function generateWASendPanelData(): WidgetData {
  return {
    recent_contacts: [
      { phone: "+60-12-345-6789", name: "Ahmad bin Hassan", last_contact: new Date(Date.now() - 3600000).toISOString() },
      { phone: "+60-13-234-5678", name: "Siti Nurhaliza", last_contact: new Date(Date.now() - 7200000).toISOString() },
      { phone: "+60-14-345-6780", name: "David Tan", last_contact: new Date(Date.now() - 86400000).toISOString() },
    ],
    templates: [
      {
        id: "tpl-1",
        name: "Payment Reminder",
        preview: "Hi {{name}}, this is a friendly reminder about your outstanding payment of {{amount}}.",
        variables: ["name", "amount"],
      },
      {
        id: "tpl-2",
        name: "Follow Up",
        preview: "Hi {{name}}, thank you for your interest. Would you like to schedule a call?",
        variables: ["name"],
      },
      {
        id: "tpl-3",
        name: "Thank You",
        preview: "Hi {{name}}, thank you for your payment. Your receipt will be emailed shortly.",
        variables: ["name"],
      },
    ],
  };
}
