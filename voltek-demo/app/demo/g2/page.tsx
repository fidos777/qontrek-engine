'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageSquare,
  MessageCircle,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { GovernanceHeaderStrip } from '@/components/voltek/GovernanceHeaderStrip';
import { ConfidenceMeterAnimated } from '@/components/voltek/ConfidenceMeterAnimated';
import { RateLimitMeterPie } from '@/components/voltek/RateLimitMeterPie';
import { HologramBadge } from '@/components/voltek/HologramBadge';
import { ProofFreshnessIndicator } from '@/components/voltek/ProofFreshnessIndicator';
import { AISuggestionBadge } from '@/components/voltek/AISuggestionBadge';

import { useCountUpValue } from '@/lib/hooks/useCountUpValue';
import { usePaymentSuccess } from '@/lib/hooks/usePaymentSuccess';
import { useProofSync } from '@/lib/hooks/useProofSync';
import { useAISuggestions } from '@/lib/hooks/useAISuggestions';
import { governanceEvents } from '@/lib/events/governance-events';
import { liftOnHover, bounceAnimation } from '@/lib/utils/motion';
import { createToast, Toast, getToastColor } from '@/lib/utils/toast-helpers';

import g2Data from '@/tests/fixtures/g2-data.json';

interface Lead {
  id: string;
  name: string;
  company: string;
  stage: string;
  amount: number;
  overdue_days: number;
  last_reminder_at: string;
  phone: string;
  email: string;
  priority: string;
}

export default function Gate2DemoPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataLoadedAt, setDataLoadedAt] = useState<Date>(new Date());

  // S-1: Animated KPI values
  const totalRecoverable = useCountUpValue(g2Data.summary.total_recoverable, 2000, 300);
  const pendingCases = useCountUpValue(g2Data.summary.kpi.pending_cases, 1000, 500);
  const handoverQueue = useCountUpValue(g2Data.summary.kpi.handover_queue, 800, 700);

  // S-2: Payment success confetti
  usePaymentSuccess(g2Data.recent_success.length);

  // S-2: Proof sync status
  const syncStatus = useProofSync();

  // S-3: AI Suggestions
  const { getSuggestionForLead } = useAISuggestions();

  // Formatters
  const fmMYR = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  });
  const fmDT = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Load data and dispatch proof sync event
  useEffect(() => {
    setDataLoadedAt(new Date());

    // Dispatch proof sync event
    window.dispatchEvent(new CustomEvent('proof.updated'));

    // Show proof sync toast
    addToast('info', 'Proof synchronized from governance layer');

    // Emit governance event
    governanceEvents.emit({
      type: 'proof.sync',
      data: { freshness: 0, source: 'initial-load' },
    });
  }, []);

  // Toast management
  const addToast = (type: Toast['type'], message: string) => {
    const toast = createToast(type, message);
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration);
  };

  // Action handlers (S-2)
  const handleCall = (lead: Lead) => {
    addToast('success', `Initiating call to ${lead.name}...`);
    governanceEvents.emit({
      type: 'recovery.success',
      data: { leadId: lead.id, amount: lead.amount },
    });
  };

  const handleSMS = (lead: Lead) => {
    addToast('success', `SMS sent to ${lead.name}`);
  };

  const handleWhatsApp = (lead: Lead) => {
    addToast('success', `WhatsApp message sent to ${lead.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gate 2 — Payment Recovery
            </h1>
            <p className="text-sm text-gray-500">Demo Mode</p>
          </div>
          <div className="flex items-center gap-3">
            {/* S-3: Proof Freshness Indicator */}
            <ProofFreshnessIndicator lastUpdated={dataLoadedAt} />
          </div>
        </div>

        {/* S-3: Governance Header Strip */}
        <GovernanceHeaderStrip />
      </div>

      {/* KPI Row (S-1: Animated) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div {...liftOnHover}>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Recoverable</div>
            <div className="text-2xl font-bold text-gray-900">
              {fmMYR.format(totalRecoverable)}
            </div>
          </Card>
        </motion.div>

        <motion.div {...liftOnHover}>
          <Card className="p-4">
            <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(g2Data.summary.kpi.recovery_rate_7d * 100)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Avg days to pay: {g2Data.summary.kpi.average_days_to_payment}
            </div>
          </Card>
        </motion.div>

        <motion.div {...liftOnHover}>
          <Card className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Cases</div>
                <div className="text-xl font-semibold">{pendingCases}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Handover Queue</div>
                <div className="text-xl font-semibold">{handoverQueue}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* S-1: Trust Index with pulse */}
        <motion.div {...liftOnHover}>
          <Card className="p-4">
            <ConfidenceMeterAnimated
              value={g2Data.summary.kpi.trust_index}
              label="Trust Index"
            />
          </Card>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Leads (S-1: Hover lift, S-2: Click modal) */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Critical Leads</h2>
          <div className="space-y-2">
            {g2Data.critical_leads.map((lead) => {
              const aiSuggestion = getSuggestionForLead(lead.id);
              return (
                <motion.div
                  key={lead.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  {...liftOnHover}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.company}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {lead.stage} • {fmMYR.format(lead.amount)}
                      </div>
                      {/* S-3: AI Suggestion Badge */}
                      {aiSuggestion && (
                        <div className="mt-2">
                          <AISuggestionBadge
                            action={aiSuggestion.action}
                            confidence={aiSuggestion.confidence}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* S-1: Bouncing URGENT badge */}
                      {lead.priority === 'urgent' && (
                        <motion.span
                          className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded"
                          {...bounceAnimation}
                        >
                          URGENT
                        </motion.span>
                      )}
                      <span className="text-sm text-orange-600">
                        {lead.overdue_days}d overdue
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Reminders */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Active Reminders</h2>
            <div className="space-y-2">
              {g2Data.active_reminders.map((reminder, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <div className="font-medium text-sm">{reminder.recipient}</div>
                    <div className="text-xs text-gray-500">
                      {reminder.channel} •{' '}
                      {fmDT.format(new Date(reminder.scheduled_at))}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                    {reminder.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Success */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Recent Success</h2>
            <div className="space-y-2">
              {g2Data.recent_success.map((success, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div>
                    <div className="font-medium text-sm">{success.name}</div>
                    <div className="text-xs text-gray-500">
                      {fmDT.format(new Date(success.paid_at))} •{' '}
                      {success.days_to_pay} days
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {fmMYR.format(success.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Rate Limit Meter */}
          <Card className="p-4">
            <RateLimitMeterPie used={127} limit={200} label="API Calls Today" />
          </Card>
        </div>
      </div>

      {/* Footer with S-3: Hologram Badge */}
      <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500">
        <HologramBadge text="Tower Federation Certified" />
        <span>•</span>
        <span>Last sync: {fmDT.format(dataLoadedAt)}</span>
      </div>

      {/* S-2: Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md m-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedLead.name}</h3>
                  <p className="text-sm text-gray-500">{selectedLead.company}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold">
                    {fmMYR.format(selectedLead.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stage</span>
                  <span>{selectedLead.stage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overdue</span>
                  <span className="text-orange-600">
                    {selectedLead.overdue_days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span>{selectedLead.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-sm">{selectedLead.email}</span>
                </div>
              </div>

              {/* Action Buttons (S-2: Toast triggers) */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCall(selectedLead)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button
                  onClick={() => handleSMS(selectedLead)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </button>
                <button
                  onClick={() => handleWhatsApp(selectedLead)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* S-2: Toast Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`${getToastColor(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
