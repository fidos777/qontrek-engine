export interface Gate1Lead {
  id: string;
  name: string;
  intent_score: number;
  last_activity: string;
  next_action: string;
  stage: string;
}

export interface Gate1Nudge {
  time: string;
  lead_name: string;
  nudge_type: string;
  status: string;
}

export interface Gate1SummaryResponse {
  funnel: {
    quotes_sent: number;
    faq_opened: number;
    social_proof_clicked: number;
    site_visit_booked: number;
    conversion_rate: number;
  };
  hot_leads: Gate1Lead[];
  scheduled_nudges: Gate1Nudge[];
}

export function buildGate1Fallback(): Gate1SummaryResponse {
  const now = Date.now();
  return {
    funnel: {
      quotes_sent: 42,
      faq_opened: 33,
      social_proof_clicked: 27,
      site_visit_booked: 18,
      conversion_rate: Math.round((18 / 42) * 100),
    },
    hot_leads: [
      {
        id: "LD-2281",
        name: "Damansara Heights Collective",
        intent_score: 95,
        last_activity: new Date(now - 1000 * 60 * 25).toISOString(),
        next_action: "Call immediately · CFO requested numbers",
        stage: "Site Visit Scheduled",
      },
      {
        id: "LD-2287",
        name: "Northern Logistics Hub",
        intent_score: 92,
        last_activity: new Date(now - 1000 * 60 * 55).toISOString(),
        next_action: "Send revised ROI pack",
        stage: "Proposal Sent",
      },
      {
        id: "LD-2292",
        name: "Putrajaya Civic Centre",
        intent_score: 90,
        last_activity: new Date(now - 1000 * 60 * 80).toISOString(),
        next_action: "Confirm walkthrough for Friday",
        stage: "FAQ Opened",
      },
    ],
    scheduled_nudges: [
      {
        time: new Date(now + 1000 * 60 * 20).toISOString(),
        lead_name: "Damansara Heights Collective",
        nudge_type: "WhatsApp · FAQ follow-up",
        status: "scheduled",
      },
      {
        time: new Date(now + 1000 * 60 * 75).toISOString(),
        lead_name: "Northern Logistics Hub",
        nudge_type: "Email · Social proof",
        status: "scheduled",
      },
      {
        time: new Date(now + 1000 * 60 * 120).toISOString(),
        lead_name: "Putrajaya Civic Centre",
        nudge_type: "WhatsApp · Site visit reminder",
        status: "scheduled",
      },
    ],
  };
}
