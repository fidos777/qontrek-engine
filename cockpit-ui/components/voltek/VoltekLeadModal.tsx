'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Send, MessageCircle, User, Clock, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showInfoToast, showSuccessToast } from '@/lib/utils/toast-helpers';
import { logEvent } from '@/lib/utils/logger';
import type { VoltekLead } from '@/types/voltek';
import { motion } from 'framer-motion';

interface VoltekLeadModalProps {
  lead: VoltekLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoltekLeadModal({ lead, open, onOpenChange }: VoltekLeadModalProps) {
  if (!lead) return null;

  const getUrgencyColor = (days: number) => {
    if (days > 20) return 'bg-red-100 text-red-700';
    if (days > 14) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const handleCall = () => {
    logEvent('lead_action_call', {
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      outstanding: lead.outstanding_amount,
    });

    showInfoToast(`Initiating call to ${lead.name}...`);

    // Actual tel: link for mobile devices
    window.location.href = `tel:${lead.phone.replace(/\D/g, '')}`;

    // Don't close modal immediately - user might want to add notes
  };

  const handleSMS = () => {
    const template = `Hi ${lead.name.split(' ')[0]}, this is Megat from Voltek Energy. I'm following up on your ${lead.system_size}kW solar installation (${lead.stage}). Outstanding amount: ${formatCurrency(lead.outstanding_amount)}. When would be a good time to discuss payment arrangement?`;

    logEvent('lead_action_sms', {
      leadId: lead.id,
      name: lead.name,
    });

    showInfoToast('Opening SMS app...');

    // SMS link with pre-filled message
    window.location.href = `sms:${lead.phone.replace(/\D/g, '')}?body=${encodeURIComponent(template)}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '6' + cleanPhone : cleanPhone;

    const message = `Hi ${lead.name.split(' ')[0]},

This is Megat from Voltek Energy Solutions.

I'm following up on your solar installation project:
- System Size: ${lead.system_size}kW
- Status: ${lead.stage}
- Outstanding: ${formatCurrency(lead.outstanding_amount)}

${lead.next_action}

When would be a good time to discuss the next steps?

Best regards,
Megat
Voltek Energy Solutions`;

    logEvent('lead_action_whatsapp', {
      leadId: lead.id,
      name: lead.name,
    });

    showSuccessToast('Opening WhatsApp...');

    // WhatsApp Web/App link
    window.open(
      `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[1000] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="text-blue-600" size={24} />
            {lead.name}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={lead.stage === '80% Pending' ? 'warning' : 'secondary'}
              className="rounded-full"
            >
              {lead.stage}
            </Badge>
            {lead.days_overdue > 14 && (
              <Badge variant="destructive" className="rounded-full">
                {lead.days_overdue} days overdue
              </Badge>
            )}
            <Badge
              variant={lead.priority === 'HIGH' ? 'destructive' : 'secondary'}
              className="rounded-full"
            >
              {lead.priority} Priority
            </Badge>
          </div>

          {/* Financial summary */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-500">
            <div className="text-sm text-slate-500 mb-1">
              Outstanding Amount
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {formatCurrency(lead.outstanding_amount)}
            </div>
            <div className="text-sm text-slate-500 mt-2">
              System Size: {lead.system_size}kW | Project Value: {formatCurrency(lead.project_value)}
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-slate-400" size={16} />
                <div className="text-sm font-semibold text-slate-500">
                  Last Contact
                </div>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {new Date(lead.last_contact).toLocaleDateString('en-MY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-slate-400" size={16} />
                <div className="text-sm font-semibold text-slate-500">
                  Days Overdue
                </div>
              </div>
              <div className={`text-lg font-bold rounded px-2 py-1 inline-block ${getUrgencyColor(lead.days_overdue)}`}>
                {lead.days_overdue} days
              </div>
            </div>
          </div>

          {/* Next action */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-blue-600 mb-1">
              Recommended Action
            </div>
            <div className="text-slate-800">{lead.next_action}</div>
          </div>

          {/* Contact info */}
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-slate-500 mb-2">
              Contact Details
            </div>
            <div className="text-slate-800 flex items-center gap-2">
              <Phone size={14} className="text-slate-400" />
              {lead.phone}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={handleCall}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label={`Call ${lead.name}`}
            >
              <Phone size={16} className="mr-2" />
              Call Now
            </Button>
            <Button
              onClick={handleSMS}
              variant="outline"
              className="flex-1"
              aria-label={`Send SMS to ${lead.name}`}
            >
              <Send size={16} className="mr-2" />
              Send SMS
            </Button>
            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              aria-label={`Message ${lead.name} on WhatsApp`}
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
