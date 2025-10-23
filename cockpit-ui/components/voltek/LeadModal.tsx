"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface G2Lead {
  name?: string;
  stage?: string;
  amount?: number;
  overdue_days?: number;
  last_reminder_at?: string;
  last_contact?: string;
  paid_at?: string;
  days_to_pay?: number;
  system_size?: string;
  project_value?: number;
  phone?: string;
  email?: string;
}

export interface LeadModalProps {
  lead: G2Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "call" | "sms" | "whatsapp", lead: G2Lead) => void;
}

export function LeadModal({ lead, isOpen, onClose, onAction }: LeadModalProps) {
  if (!lead) return null;

  const fmMYR = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  });
  const fmDT = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Color coding based on overdue days
  const getOverdueColor = (days: number | undefined) => {
    if (!days) return "text-gray-500";
    if (days >= 20) return "text-red-600";
    if (days >= 14) return "text-orange-600";
    return "text-yellow-600";
  };

  const getOverdueBg = (days: number | undefined) => {
    if (!days) return "bg-gray-100";
    if (days >= 20) return "bg-red-100";
    if (days >= 14) return "bg-orange-100";
    return "bg-yellow-100";
  };

  const overdueColor = getOverdueColor(lead.overdue_days);
  const overdueBg = getOverdueBg(lead.overdue_days);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">{lead.name || "Lead Details"}</DialogTitle>
            </DialogHeader>

            {/* Badges */}
            <div className="flex gap-2 mt-4">
              {lead.stage && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {lead.stage}
                </span>
              )}
              {lead.overdue_days && lead.overdue_days > 0 && (
                <span
                  className={`px-3 py-1 ${overdueBg} ${overdueColor} rounded-full text-sm font-medium`}
                >
                  Overdue: {lead.overdue_days} days
                </span>
              )}
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {lead.amount !== undefined && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Outstanding Amount</div>
                  <div className="text-xl font-bold mt-1">
                    {fmMYR.format(lead.amount)}
                  </div>
                </div>
              )}
              {lead.system_size && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">System Size</div>
                  <div className="text-xl font-bold mt-1">{lead.system_size}</div>
                </div>
              )}
              {lead.project_value !== undefined && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Project Value</div>
                  <div className="text-xl font-bold mt-1">
                    {fmMYR.format(lead.project_value)}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <div className="space-y-3">
                {lead.last_contact && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Last Contact</span>
                    <span className="font-medium">
                      {fmDT.format(new Date(lead.last_contact))}
                    </span>
                  </div>
                )}
                {lead.last_reminder_at && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Last Reminder</span>
                    <span className="font-medium">
                      {fmDT.format(new Date(lead.last_reminder_at))}
                    </span>
                  </div>
                )}
                {lead.overdue_days !== undefined && lead.overdue_days > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Days Overdue</span>
                    <span className={`font-bold ${overdueColor}`}>
                      {lead.overdue_days} days
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info & Actions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Contact & Actions</h3>
              {(lead.phone || lead.email) && (
                <div className="space-y-2 mb-4">
                  {lead.phone && (
                    <div className="text-sm">
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="font-medium">{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="text-sm">
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="font-medium">{lead.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onAction("call", lead)}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  📞 Call
                </button>
                <button
                  onClick={() => onAction("sms", lead)}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  💬 Send Link
                </button>
                <button
                  onClick={() => onAction("whatsapp", lead)}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  📱 WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
