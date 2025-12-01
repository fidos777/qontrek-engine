import ConfidenceMeterAnimated, { ProofChipV3 } from "@/components/trust/ConfidenceMeterAnimated";
import GovernanceHeaderStrip, { RateLimitMeterPie } from "@/components/trust/ui-trust-extras";


// app/demo/g2/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoModeIndicator } from "@/components/voltek/DemoModeIndicator";
import { BusinessImpactCard } from "@/components/voltek/BusinessImpactCard";
import { ActionModal } from "@/components/voltek/ActionModal";
import { logProofLoad, logAction } from "@/lib/telemetry";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { voltekTheme } from "@/config/voltek-theme";
import type { G2Data, G2Lead } from "@/types/gates";
import { 
  Phone, 
  Send, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  TrendingUp 
} from "lucide-react";

export default function Gate2Dashboard() {
  const [data, setData] = useState<G2Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "call" | "sms" | "whatsapp";
    lead: G2Lead | null;
  }>({
    isOpen: false,
    action: "call",
    lead: null
  });

  useEffect(() => {
    async function loadData() {
      try {
        // In demo: Load from public/data/g2_dashboard_v19.1.json
        const response = await fetch("/data/g2_dashboard_v19.1.json");
        if (!response.ok) throw new Error("Failed to load data");
        
        const json = await response.json();
        setData(json);
        
        // Log telemetry
        logProofLoad("g2_dashboard_v19.1.json", "real");
      } catch (e: any) {
        console.error("Load error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAction = (action: "call" | "sms" | "whatsapp", lead: G2Lead) => {
    logAction(action, lead.id, { name: lead.name, amount: lead.amount });
    setModalState({ isOpen: true, action, lead });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Voltek dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle />
                <div>
                  <div className="font-semibold">Error Loading Data</div>
                  <div className="text-sm">{error || "Data not available"}</div>
                  <div className="text-xs mt-2">
                    Make sure g2_dashboard_v19.1.json is in public/data/
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { summary, critical_leads, active_reminders, recent_success, kpi } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: voltekTheme.colors.primary }}>
                {voltekTheme.brand.name}
              </h1>
              <p className="text-sm text-gray-600">{voltekTheme.brand.tagline}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Payment Recovery Dashboard</div>
              <div className="text-xs text-gray-500">Gate 2 • Live Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Business Impact Card */}
        <BusinessImpactCard
          totalPipeline={summary.total_recoverable}
          highPriorityCount={critical_leads.length}
          avgDays={critical_leads.reduce((acc, l) => acc + l.days_overdue, 0) / critical_leads.length}
          successRate={kpi.recovery_rate_7d}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600">Pending 80%</div>
                  <div className="text-2xl font-bold mt-1">{summary.pending_80_count}</div>
                  <div className="text-sm font-medium text-green-600 mt-1">
                    {formatCurrency(summary.pending_80_value)}
                  </div>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Clock className="text-orange-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600">Pending 20%</div>
                  <div className="text-2xl font-bold mt-1">{summary.pending_20_count}</div>
                  <div className="text-sm font-medium text-green-600 mt-1">
                    {formatCurrency(summary.pending_20_value)}
                  </div>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600">Handover</div>
                  <div className="text-2xl font-bold mt-1">{summary.pending_handover_count}</div>
                  <div className="text-sm font-medium text-green-600 mt-1">
                    {formatCurrency(summary.pending_handover_value)}
                  </div>
                </div>
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-green-700 font-medium">Total Recoverable</div>
                  <div className="text-2xl font-bold mt-1 text-green-800">
                    {formatCurrency(summary.total_recoverable)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {summary.pending_80_count + summary.pending_20_count + summary.pending_handover_count} leads total
                  </div>
                </div>
                <div className="bg-green-200 p-2 rounded-lg">
                  <TrendingUp className="text-green-700" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-red-600" />
              Critical Leads (>14 days overdue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {critical_leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="mx-auto mb-2" size={32} />
                  No critical leads
                </div>
              ) : (
                critical_leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between border-b pb-3 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-lg">{lead.name}</div>
                        <Badge variant={lead.stage === "80%" ? "warning" : "secondary"}>
                          {lead.stage}
                        </Badge>
                        {lead.days_overdue > 20 && (
                          <Badge variant="destructive">URGENT</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>💰 {formatCurrency(lead.amount)} • ⏱️ {lead.days_overdue} days overdue</div>
                        <div>📞 Last contact: {lead.last_contact}</div>
                        <div>📋 Next: {lead.next_action}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAction("call", lead)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Phone size={16} className="mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction("sms", lead)}
                      >
                        <Send size={16} className="mr-1" />
                        Send Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction("whatsapp", lead)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <MessageCircle size={16} className="mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Reminders & Recent Success */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="text-blue-600" />
                Active Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {active_reminders.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No active reminders
                  </div>
                ) : (
                  active_reminders.slice(0, 6).map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{reminder.name}</div>
                        <div className="text-sm text-gray-600">
                          {reminder.next_action}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <Badge variant="secondary">{reminder.stage}</Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(reminder.last_reminder)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Success */}
          <Card className="border-green-300 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="text-green-600" />
                Recent Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recent_success.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No recent payments
                  </div>
                ) : (
                  recent_success.slice(0, 6).map((success) => (
                    <div
                      key={success.id}
                      className="flex items-center justify-between py-2 border-b border-green-200 last:border-0"
                    >
                      <div>
                        <div className="font-medium">{success.name}</div>
                        <div className="text-sm text-gray-600">
                          Paid in {success.days_to_pay} days
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-700">
                          {formatCurrency(success.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(success.paid_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recovery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {kpi.recovery_rate_7d.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">7-Day Recovery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {kpi.recovery_rate_30d.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">30-Day Recovery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {kpi.average_days_to_payment.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Days to Payment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {kpi.escalation_rate?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-600">Escalation Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>🔐 Trust Index: 100%</span>
            <span>•</span>
            <span>📊 Real-time Data</span>
            <span>•</span>
            <span>🏛️ Tower Federation Certified</span>
            <span>•</span>
            <span>Powered by Qontrek Engine</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Indicator */}
      <DemoModeIndicator />

      {/* Action Modal */}
      {modalState.lead && (
        <ActionModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          action={modalState.action}
          lead={modalState.lead}
        />
      )}
    </div>
  );
}
