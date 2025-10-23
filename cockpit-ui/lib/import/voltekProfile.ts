// lib/import/voltekProfile.ts
// Voltek V19.9 Excel profile handler for Leads/Payments

import * as XLSX from "xlsx";
import type { ParsedData, ColumnMapping, G2Fixture } from "./types";

export const VOLTEK_COLUMNS = {
  name: ["name", "client_name", "customer", "lead_name"],
  stage: ["stage", "status", "payment_stage"],
  amount: ["amount", "value", "outstanding", "payment_amount"],
  days_overdue: ["days_overdue", "overdue_days", "overdue"],
  last_contact: ["last_contact", "last_contact_date", "contacted"],
  next_action: ["next_action", "action", "follow_up"],
  paid_at: ["paid_at", "payment_date", "paid_date"],
  days_to_pay: ["days_to_pay", "payment_days", "days"],
};

export function detectVoltekColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [target, possibleSources] of Object.entries(VOLTEK_COLUMNS)) {
    for (const src of possibleSources) {
      const idx = normalizedHeaders.indexOf(src);
      if (idx !== -1) {
        mappings.push({ source: headers[idx], target });
        break;
      }
    }
  }

  return mappings;
}

export function parseExcelFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        if (jsonData.length === 0) {
          reject(new Error("No data found in Excel file"));
          return;
        }

        const columns = Object.keys(jsonData[0] as any);
        resolve({
          rows: jsonData as Array<Record<string, any>>,
          columns,
          profile: "voltek_v19_9",
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

export function parseCSVFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("No data found in CSV file"));
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });
          return row;
        });

        resolve({
          rows,
          columns: headers,
          profile: "voltek_v19_9",
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function applyColumnMapping(
  data: ParsedData,
  mappings: ColumnMapping[]
): Array<Record<string, any>> {
  const mappingMap = new Map(mappings.map((m) => [m.source, m.target]));

  return data.rows.map((row) => {
    const newRow: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const targetKey = mappingMap.get(key) || key;
      // Convert numeric strings to numbers for amount and days fields
      if (["amount", "days_overdue", "days_to_pay"].includes(targetKey)) {
        const num = parseFloat(String(value));
        newRow[targetKey] = isNaN(num) ? value : num;
      } else {
        newRow[targetKey] = value;
      }
    }
    return newRow;
  });
}

export function buildG2Fixture(mappedRows: Array<Record<string, any>>): G2Fixture {
  // Categorize rows
  const critical = mappedRows.filter((r) => r.days_overdue && r.days_overdue > 30);
  const success = mappedRows.filter((r) => r.paid_at && r.days_to_pay != null);
  const reminders = mappedRows.filter((r) => r.next_action && !r.paid_at);

  // Calculate summary
  const total_recoverable = mappedRows
    .filter((r) => !r.paid_at)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const pending_80 = mappedRows.filter((r) => !r.paid_at && r.stage?.includes("80"));
  const pending_20 = mappedRows.filter((r) => !r.paid_at && r.stage?.includes("20"));
  const pending_handover = mappedRows.filter((r) => !r.paid_at && r.stage?.includes("handover"));

  // Calculate KPIs
  const recentSuccessLast7d = success.filter((r) => {
    const paidDate = new Date(r.paid_at);
    const daysAgo = (Date.now() - paidDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });

  const recentSuccessLast30d = success.filter((r) => {
    const paidDate = new Date(r.paid_at);
    const daysAgo = (Date.now() - paidDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const avgDaysToPay =
    success.length > 0
      ? success.reduce((sum, r) => sum + (r.days_to_pay || 0), 0) / success.length
      : 0;

  const escalationRate = mappedRows.length > 0 ? critical.length / mappedRows.length : 0;

  return {
    summary: {
      pending_80_value: pending_80.reduce((sum, r) => sum + (r.amount || 0), 0),
      pending_20_value: pending_20.reduce((sum, r) => sum + (r.amount || 0), 0),
      pending_handover_value: pending_handover.reduce((sum, r) => sum + (r.amount || 0), 0),
      total_recoverable,
    },
    kpi: {
      recovery_rate_7d: mappedRows.length > 0 ? recentSuccessLast7d.length / mappedRows.length : 0,
      recovery_rate_30d: mappedRows.length > 0 ? recentSuccessLast30d.length / mappedRows.length : 0,
      average_days_to_payment: Math.round(avgDaysToPay),
      escalation_rate: escalationRate,
    },
    critical_leads: critical.slice(0, 10).map((r) => ({
      id: r.id,
      name: r.name || "Unknown",
      stage: r.stage || "N/A",
      amount: r.amount || 0,
      days_overdue: r.days_overdue,
      last_contact: r.last_contact,
      next_action: r.next_action,
    })),
    active_reminders: reminders.slice(0, 5).map((r) => ({
      id: r.id || Math.random().toString(36).substr(2, 9),
      name: r.name || "Unknown",
      stage: r.stage || "N/A",
      amount: r.amount || 0,
      days_overdue: r.days_overdue || 0,
      next_action: r.next_action || "Follow up",
    })),
    recent_success: success.slice(0, 5).map((r) => ({
      name: r.name || "Unknown",
      stage: r.stage,
      amount: r.amount || 0,
      days_to_pay: r.days_to_pay || 0,
      paid_at: r.paid_at,
    })),
  };
}

export function generateSampleTemplate(): void {
  const sampleData = [
    {
      name: "Example Lead 1",
      stage: "80% - Final Follow-up",
      amount: 15000,
      days_overdue: 45,
      last_contact: "2025-10-15",
      next_action: "Call customer",
    },
    {
      name: "Example Lead 2",
      stage: "20% - Initial Contact",
      amount: 8500,
      days_overdue: 10,
      last_contact: "2025-10-20",
      next_action: "Send reminder email",
    },
    {
      name: "Example Success",
      stage: "Paid",
      amount: 12000,
      paid_at: "2025-10-18",
      days_to_pay: 25,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  XLSX.writeFile(workbook, "voltek_v19_9_template.xlsx");
}
