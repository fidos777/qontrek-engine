// ============================================
// SOLAR CRITICAL TABLE COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Display critical leads requiring action
// ============================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MessageSquare, 
  Send, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SolarCriticalTableData } from '@/lib/widgets/schemas/solar';
import type { CriticalLead } from '@/types/solar';
import { getUrgencyColor, getUrgencyLevel } from '@/lib/widgets/schemas/solar';

interface SolarCriticalTableProps {
  data?: SolarCriticalTableData;
  loading?: boolean;
  error?: string;
  className?: string;
  onAction?: (action: 'call' | 'sms' | 'whatsapp', lead: CriticalLead) => void;
  onLeadClick?: (lead: CriticalLead) => void;
}

const URGENCY_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STAGE_STYLES = {
  '80%': 'bg-orange-100 text-orange-700',
  '20%': 'bg-yellow-100 text-yellow-700',
  'HANDOVER': 'bg-sky-100 text-sky-700',
};

function LeadRow({ 
  lead, 
  index, 
  onAction, 
  onLeadClick 
}: { 
  lead: CriticalLead; 
  index: number;
  onAction?: (action: 'call' | 'sms' | 'whatsapp', lead: CriticalLead) => void;
  onLeadClick?: (lead: CriticalLead) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const urgencyLevel = getUrgencyLevel(lead.days_overdue);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'border-b last:border-b-0 hover:bg-gray-50 transition-colors',
        urgencyLevel === 'critical' && 'bg-red-50/50'
      )}
    >
      {/* Main row */}
      <div 
        className="grid grid-cols-12 gap-2 p-3 items-center cursor-pointer"
        onClick={() => onLeadClick?.(lead)}
      >
        {/* Name & Project */}
        <div className="col-span-3">
          <div className="font-medium text-gray-900 truncate">{lead.name}</div>
          <div className="text-xs text-gray-500 truncate">{lead.project_no}</div>
        </div>
        
        {/* Amount */}
        <div className="col-span-2 text-right">
          <div className="font-semibold text-gray-900">
            RM {lead.amount.toLocaleString()}
          </div>
          {lead.project_value && (
            <div className="text-xs text-gray-500">
              of RM {lead.project_value.toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Stage */}
        <div className="col-span-1">
          <Badge className={cn('text-xs', STAGE_STYLES[lead.stage] || 'bg-gray-100')}>
            {lead.stage}
          </Badge>
        </div>
        
        {/* Days Overdue */}
        <div className="col-span-2">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            URGENCY_STYLES[urgencyLevel]
          )}>
            {urgencyLevel === 'critical' && <AlertTriangle className="h-3 w-3" />}
            {lead.days_overdue} days
          </div>
        </div>
        
        {/* Last Contact */}
        <div className="col-span-2 text-sm text-gray-600">
          {lead.last_contact || 'Never'}
        </div>
        
        {/* Actions */}
        <div className="col-span-2 flex items-center gap-1 justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('call', lead);
            }}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('sms', lead);
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('whatsapp', lead);
            }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Phone</div>
                  <div className="font-medium">{lead.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">State</div>
                  <div className="font-medium">{lead.state || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">System Size</div>
                  <div className="font-medium">
                    {lead.system_size ? `${lead.system_size} kWp` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Status</div>
                  <div className="font-medium">{lead.status}</div>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <div className="text-gray-500 text-xs">Next Action</div>
                  <div className="font-medium text-blue-700">{lead.next_action}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SolarCriticalTable({ 
  data, 
  loading, 
  error, 
  className,
  onAction,
  onLeadClick
}: SolarCriticalTableProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex gap-4 p-3 border-b">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="p-6">
          <div className="text-red-600">Error loading leads: {error}</div>
        </CardContent>
      </Card>
    );
  }
  
  const leads = data?.leads ?? [];
  const totalValue = data?.total_value ?? 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Leads
            <Badge variant="secondary" className="ml-2">
              {leads.length}
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">RM {totalValue.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-y text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="col-span-3">Customer</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1">Stage</div>
          <div className="col-span-2">Overdue</div>
          <div className="col-span-2">Last Contact</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        {/* Rows */}
        <div className="max-h-[500px] overflow-y-auto">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No critical leads found
            </div>
          ) : (
            leads.map((lead, index) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                index={index}
                onAction={onAction}
                onLeadClick={onLeadClick}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolarCriticalTable;
