'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useVoltekData } from '@/lib/hooks/useVoltekData';
import {
  VoltekLead,
  formatMYR,
  formatPercentage,
  formatRelativeTime,
  getStatusColor,
  generateWhatsAppLink,
  generateSMSLink,
  generateTelLink,
} from '@/lib/utils/voltekCalculations';
import {
  VoltekErrorDisplay,
  VoltekLoadingSkeleton,
} from '@/components/voltek/VoltekErrorDisplay';
import {
  Toast,
  toastHelpers,
  getToastColors,
} from '@/lib/utils/toast-helpers';

// Toast Container Component
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const colors = getToastColors(toast.type);
        return (
          <div
            key={toast.id}
            className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 max-w-sm animate-slide-in`}
            role="alert"
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${colors.icon}`}>
                {toast.type === 'success' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${colors.text}`}>{toast.title}</p>
                {toast.message && (
                  <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className={`ml-4 ${colors.text} hover:opacity-75`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Lead Modal Component
function LeadModal({
  lead,
  onClose,
  onAction,
}: {
  lead: VoltekLead;
  onClose: () => void;
  onAction: (action: string, lead: VoltekLead) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {/* Lead ID & Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-mono text-gray-500">{lead.id}</span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  lead.status
                )}`}
              >
                {lead.status.toUpperCase()}
              </span>
            </div>

            {/* Company & Contact */}
            <div className="mb-4">
              <h4 className="text-xl font-semibold text-gray-900">
                {lead.company}
              </h4>
              <p className="text-gray-600">{lead.contact}</p>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-500">Outstanding Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatMYR(lead.amount)}
              </div>
              {lead.overdue_days > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  {lead.overdue_days} days overdue
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-700">{lead.phone}</span>
              </div>
              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">{lead.email}</span>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Next Action */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Next Action
              </div>
              <p className="text-sm text-blue-600 font-medium">{lead.next_action}</p>
            </div>

            {/* Last Contact */}
            <div className="text-xs text-gray-500">
              Last contacted: {formatRelativeTime(lead.last_contact)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onAction('call', lead)}
                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </button>
              <button
                onClick={() => onAction('sms', lead)}
                className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                SMS
              </button>
              <button
                onClick={() => onAction('whatsapp', lead)}
                className="flex items-center justify-center px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function VoltekDashboard() {
  const { data, loading, error, refetch } = useVoltekData();
  const [selectedLead, setSelectedLead] = useState<VoltekLead | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast function
  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    if (toast.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    }
  }, []);

  // Remove toast function
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle action buttons
  const handleAction = useCallback(
    (action: string, lead: VoltekLead) => {
      switch (action) {
        case 'call':
          window.open(generateTelLink(lead.phone), '_self');
          addToast(toastHelpers.callInitiated(lead.contact));
          break;
        case 'sms':
          window.open(
            generateSMSLink(
              lead.phone,
              `Hi ${lead.contact}, this is a reminder about your outstanding payment of ${formatMYR(lead.amount)}.`
            ),
            '_self'
          );
          addToast(toastHelpers.smsSent(lead.contact));
          break;
        case 'whatsapp':
          window.open(
            generateWhatsAppLink(
              lead.phone,
              `Hi ${lead.contact}, this is a reminder about your outstanding payment of ${formatMYR(lead.amount)}. Please let us know when we can expect the payment. Thank you.`
            ),
            '_blank'
          );
          addToast(toastHelpers.whatsappOpened(lead.contact));
          break;
      }
    },
    [addToast]
  );

  if (loading) {
    return <VoltekLoadingSkeleton />;
  }

  if (error) {
    return <VoltekErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!data) {
    return null;
  }

  const { summary, leads } = data;
  const criticalLeads = leads.filter((l) => l.status === 'critical');
  const pendingLeads = leads.filter((l) => l.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Voltek Recovery Dashboard
            </h1>
            <p className="text-gray-600">Lead qualification and payment recovery</p>
          </div>
          <Link
            href="/gates/voltek/import"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Leads
          </Link>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="text-sm text-gray-500">Total Recoverable</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatMYR(summary.total_recoverable)}
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="text-sm text-gray-500">
              Pending ({summary.pending_percentage}%)
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatMYR(summary.pending_amount)}
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="text-sm text-gray-500">Critical Leads</div>
            <div className="text-2xl font-bold text-red-600">
              {summary.critical_count}
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="text-sm text-gray-500">Recovery Rate (30d)</div>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(summary.recovery_rate_30d)}
            </div>
          </div>
        </div>

        {/* Critical Leads Section */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Critical Leads ({criticalLeads.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Overdue
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criticalLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      {lead.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {lead.company}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.contact}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatMYR(lead.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {lead.overdue_days}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAction('call', lead)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Call"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAction('sms', lead)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="SMS"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAction('whatsapp', lead)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="WhatsApp"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leads Section */}
        {pendingLeads.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Leads ({pendingLeads.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Overdue
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {lead.id}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {lead.company}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {lead.contact}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatMYR(lead.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          {lead.overdue_days}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAction('call', lead)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Call"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction('sms', lead)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="SMS"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction('whatsapp', lead)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="WhatsApp"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lead Modal */}
        {selectedLead && (
          <LeadModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onAction={handleAction}
          />
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>

      {/* Custom styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}} />
    </div>
  );
}
