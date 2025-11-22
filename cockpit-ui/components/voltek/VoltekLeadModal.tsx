'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Send, MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { VoltekLead } from '@/types/voltek';

interface VoltekLeadModalProps {
  lead: VoltekLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoltekLeadModal({ lead, open, onOpenChange }: VoltekLeadModalProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stage badge */}
          <div className="flex items-center gap-2">
            <Badge variant={lead.stage === '80% Pending' ? 'warning' : 'secondary'}>
              {lead.stage}
            </Badge>
            {lead.days_overdue > 14 && (
              <Badge variant="destructive">
                {lead.days_overdue} days overdue
              </Badge>
            )}
          </div>

          {/* Outstanding amount */}
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500">Outstanding</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(lead.outstanding_amount)}
            </div>
          </div>

          {/* System info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">System Size</div>
              <div className="font-semibold text-gray-900">
                {lead.system_size}kW
              </div>
            </div>
            <div>
              <div className="text-gray-500">Project Value</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(lead.project_value)}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-sm">
            <div className="text-gray-500">Phone</div>
            <div className="font-semibold text-gray-900">{lead.phone}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button className="flex-1">
              <Phone size={16} className="mr-2" />
              Call
            </Button>
            <Button variant="outline" className="flex-1">
              <Send size={16} className="mr-2" />
              SMS
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageCircle size={16} className="mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
