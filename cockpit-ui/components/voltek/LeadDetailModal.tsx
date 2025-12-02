"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { showSuccessToast, showInfoToast } from "@/lib/utils/toast-helpers";

interface Lead {
  name: string;
  value: string;
  days: number;
  stage: string;
  email?: string;
  phone?: string;
  kWp?: number;
  paymentStage?: string;
}

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  if (!lead) return null;

  const handleWhatsApp = () => {
    const phone = lead.phone?.replace(/[^\d]/g, '') || "60123456789";
    const message = `Hi ${lead.name}, regarding your ${lead.kWp}kWp solar project worth ${lead.value}...`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    showInfoToast(`Opening WhatsApp for ${lead.name}...`);
    setTimeout(() => {
      window.open(url, '_blank');
    }, 500);
  };

  const handleCall = () => {
    const phone = lead.phone || "+60123456789";
    showInfoToast(`Calling ${lead.name}...`);
    setTimeout(() => {
      window.location.href = `tel:${phone}`;
    }, 500);
  };

  const handleEmail = () => {
    showInfoToast(`Opening email to ${lead.name}...`);
    setTimeout(() => {
      window.location.href = `mailto:${lead.email || 'contact@example.com'}`;
    }, 500);
  };

  const handleMarkResolved = () => {
    showSuccessToast(`${lead.name} marked as resolved!`, { confetti: true });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between bg-white rounded-t-xl">
                <div>
                  <h2 className="text-xl font-bold">{lead.name}</h2>
                  <p className="text-sm text-gray-600">Lead Details</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary">{lead.stage}</Badge>
                    {lead.paymentStage && (
                      <Badge className={
                        lead.paymentStage === "20%" ? "bg-green-100 text-green-700" :
                        lead.paymentStage === "80%" ? "bg-blue-100 text-blue-700" :
                        "bg-orange-100 text-orange-700"
                      }>
                        💳 {lead.paymentStage}
                      </Badge>
                    )}
                    {lead.days > 20 && <Badge variant="destructive">URGENT</Badge>}
                  </div>
                  <span className="text-xl font-bold text-blue-600">{lead.value}</span>
                </div>

                {lead.days > 20 && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                    ⚠️ Stuck for {lead.days} days - immediate attention needed
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-500 text-xs">System Size</div>
                    <div className="font-semibold">⚡ {lead.kWp || 0} kWp</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-500 text-xs">Days Overdue</div>
                    <div className="font-semibold">{lead.days} days</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <div className="text-gray-500 text-xs">Contact</div>
                    <div className="font-semibold text-xs">{lead.phone || "N/A"}</div>
                    <div className="text-gray-500 text-xs mt-1">{lead.email || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-gray-50 rounded-b-xl space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCall}
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleEmail}
                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
                <button
                  onClick={handleMarkResolved}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                >
                  ✓ Mark Resolved
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
