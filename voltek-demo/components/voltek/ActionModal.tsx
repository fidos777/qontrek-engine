// components/voltek/ActionModal.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Phone, MessageCircle, Send } from "lucide-react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "call" | "sms" | "whatsapp";
  lead: {
    id: string;
    name: string;
    phone: string;
    amount: number;
    stage: string;
  };
}

export function ActionModal({ isOpen, onClose, action, lead }: ActionModalProps) {
  if (!isOpen) return null;

  const actionConfig = {
    call: {
      icon: <Phone className="text-blue-600" size={32} />,
      title: "Place Call",
      description: `In production: Opens dialer to call ${lead.name}`,
      preview: `
Script:
1. "Hi ${lead.name}, this is from Voltek Energy Solutions"
2. "Calling about your solar installation payment (${lead.stage})"
3. "Amount pending: RM ${lead.amount.toLocaleString()}"
4. "Can we process this payment today?"
      `,
      productionAction: `tel:${lead.phone}`
    },
    sms: {
      icon: <Send className="text-green-600" size={32} />,
      title: "Send Payment Link",
      description: `In production: Sends SMS to ${lead.name}`,
      preview: `
SMS Content:
"Hi ${lead.name}, reminder for your Voltek solar installation payment of RM ${lead.amount.toLocaleString()}. 
Click to pay: [secure-link]
Questions? Call us at +60 3-1234 5678"
      `,
      productionAction: `sms:${lead.phone}`
    },
    whatsapp: {
      icon: <MessageCircle className="text-green-600" size={32} />,
      title: "Send WhatsApp",
      description: `In production: Opens WhatsApp to message ${lead.name}`,
      preview: `
WhatsApp Message:
"Hi ${lead.name} 👋

This is a friendly reminder from Voltek Energy Solutions.

Your solar installation payment is pending:
💰 Amount: RM ${lead.amount.toLocaleString()}
📋 Stage: ${lead.stage}

Click here to complete payment: [secure-link]

Need help? Reply to this message!"
      `,
      productionAction: `https://wa.me/${lead.phone.replace(/\D/g, '')}`
    }
  };

  const config = actionConfig[action];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-white">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {config.icon}
              <div>
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">PREVIEW:</div>
            <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
              {config.preview}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
            <div className="text-xs font-semibold text-blue-800 mb-1">
              🚀 IN PRODUCTION:
            </div>
            <div className="text-xs text-blue-700">
              This action would execute: <code className="bg-blue-100 px-1 py-0.5 rounded">{config.productionAction}</code>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onClose} className="flex-1">
              Got it!
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
