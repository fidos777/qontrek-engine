'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Send, MessageCircle, User, Clock, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showInfoToast, showErrorToast } from '@/lib/utils/toast-helpers';
import { logEvent } from '@/lib/utils/logger';
import type { G2Lead } from '@/types/gates';

type LeadDetailModalProps = {
  lead: G2Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailModalProps) {
  if (!lead) return null;

  const getUrgencyColor = (days: number) => {
    if (days > 20) return 'bg-[var(--error-bg)] text-[var(--error)]';
    if (days > 14) return 'bg-[var(--warning-bg)] text-[var(--warning)]';
    return 'bg-[var(--info-bg)] text-[var(--info)]';
  };

  const handleCall = () => {
    if (!lead.phone) {
      showErrorToast('No phone number available for this lead.');
      return;
    }
    logEvent('lead_action_call', { leadId: lead.id, name: lead.name, phone: lead.phone });
    showInfoToast(`Initiating call to ${lead.name}...`);
    onOpenChange(false);
  };

  const handleSMS = () => {
    if (!lead.phone) {
      showErrorToast('No phone number available for this lead.');
      return;
    }
    logEvent('lead_action_sms', { leadId: lead.id, name: lead.name, phone: lead.phone });
    showInfoToast(`Preparing SMS for ${lead.name}...`);
    onOpenChange(false);
  };

  const handleWhatsApp = () => {
    if (!lead.phone) {
      showErrorToast('No phone number available for this lead.');
      return;
    }
    logEvent('lead_action_whatsapp', { leadId: lead.id, name: lead.name, phone: lead.phone });
    showInfoToast(`Opening WhatsApp for ${lead.name}...`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[1000] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <User className="text-[var(--primary)]" />
            {lead.name}
          </DialogTitle>
          <DialogDescription>
            Lead details and recommended actions.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Status Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={lead.stage === '80%' ? 'warning' : 'secondary'}>
              {lead.stage} Stage
            </Badge>
            {lead.days_overdue > 14 && (
              <Badge variant="destructive">
                {lead.days_overdue} days overdue
              </Badge>
            )}
            <Badge variant="outline">ID: {lead.id}</Badge>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-br from-[var(--success-bg)] to-[var(--success-bg)] p-4 rounded-lg border border-[var(--success)]">
            <div className="text-sm text-[var(--text-2)] mb-1">Outstanding Amount</div>
            <div className="text-3xl font-bold text-[var(--success)]">
              {formatCurrency(lead.amount)}
            </div>
            {lead.system_size && (
              <div className="text-sm text-[var(--text-2)] mt-2">
                System Size: {lead.system_size}kW • Project Value:{' '}
                {formatCurrency(lead.project_value || 0)}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[var(--stroke)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-[var(--text-2)]" size={16} />
                <div className="text-sm font-semibold">Last Contact</div>
              </div>
              <div className={`text-lg font-bold ${getUrgencyColor(lead.days_overdue)}`}>
                {lead.last_contact}
              </div>
            </div>

            <div className="border border-[var(--stroke)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-[var(--text-2)]" size={16} />
                <div className="text-sm font-semibold">Days Overdue</div>
              </div>
              <div className={`text-lg font-bold ${getUrgencyColor(lead.days_overdue)}`}>
                {lead.days_overdue} days
              </div>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-[var(--info-bg)] border border-[var(--info)] rounded-lg p-4">
            <div className="text-sm font-semibold text-[var(--info)] mb-1">
              Next Action Required
            </div>
            <div className="text-[var(--text-1)]">{lead.next_action}</div>
          </div>

          {/* Contact Information */}
          <div className="border border-[var(--stroke)] rounded-lg p-4">
            <div className="text-sm font-semibold mb-2">Contact Details</div>
            <div className="text-[var(--text-1)]">Phone: {lead.phone || 'Not provided'}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[var(--stroke)]">
            <Button
              onClick={handleCall}
              className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              <Phone size={16} className="mr-2" />
              Call Now
            </Button>
            <Button onClick={handleSMS} variant="outline" className="flex-1">
              <Send size={16} className="mr-2" />
              Send SMS
            </Button>
            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="flex-1 border-[var(--success)] text-[var(--success)] hover:bg-[var(--success-bg)]"
            >
              <MessageCircle size={16} className="mr-2" />
              WhatsApp
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
