import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    source: "mock",
    summary: {
      total_recoverable: 152500,
      kpi: {
        recovery_rate_7d: 0.32,
        avg_days_to_pay: 11,
        pending_cases: 14,
        handover_queue: 5,
      },
    },
    data: {
      critical_leads: [
        {
          name: "Alpha Engineering",
          stage: "OVERDUE",
          amount: 18500,
          overdue_days: 19,
          last_reminder: "14 Oct 2025, 11:20",
        },
        {
          name: "Seri Mutiara Builders",
          stage: "OVERDUE",
          amount: 22800,
          overdue_days: 22,
          last_reminder: "12 Oct 2025, 17:15",
        },
        {
          name: "Metro Solar Sdn Bhd",
          stage: "OVERDUE",
          amount: 9900,
          overdue_days: 17,
          last_reminder: "15 Oct 2025, 09:40",
        },
      ],
      recent_success: [
        { name: "Bina Maju Trading", amount: 12500, paid_at: "2025-10-19T08:16:00Z" },
        { name: "Kemuncak Glass", amount: 7800, paid_at: "2025-10-18T04:55:00Z" },
      ],
    },
  });
}

