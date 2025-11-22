'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { VoltekLead } from '@/types/voltek';
import { Phone, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface Props {
  lead: VoltekLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoltekLeadModal({ lead, open, onOpenChange }: Props) {
  if (!lead) return null;

  const priorityColors = {
    HIGH: 'text-red-600 bg-red-100',
    MEDIUM: 'text-yellow-600 bg-yellow-100',
    LOW: 'text-green-600 bg-green-100',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[lead.priority]}`}>
              {lead.priority} Priority
            </span>
            <span className="text-sm text-gray-500">
              {lead.stage}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-lg font-bold">RM {lead.outstanding_amount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">System Size</p>
              <p className="text-lg font-bold">{lead.system_size} kW</p>
            </div>
          </div>

          {/* Overdue Alert */}
          {lead.days_overdue > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{lead.days_overdue} days overdue</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Contact</h4>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400" />
              <span>{lead.contact_name}</span>
              <span className="text-gray-400">•</span>
              <a href={`tel:${lead.contact_phone}`} className="text-blue-600 hover:underline">
                {lead.contact_phone}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Actions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-500">Last: </span>
                  {lead.last_action}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-500">Next: </span>
                  <span className="font-medium">{lead.next_action}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`tel:${lead.contact_phone}`)}
            >
              <Phone size={14} className="mr-2" />
              Call Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
