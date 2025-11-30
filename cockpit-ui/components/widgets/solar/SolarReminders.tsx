// ============================================
// SOLAR REMINDERS COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Show pending action reminders
// ============================================

'use client';

import { motion } from 'framer-motion';
import { Bell, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SolarRemindersData } from '@/lib/widgets/schemas/solar';
import type { ActiveReminder } from '@/types/solar';
import { isOverdue, isDueToday, PRIORITY_COLORS } from '@/lib/widgets/schemas/solar';

interface SolarRemindersProps {
  data?: SolarRemindersData;
  loading?: boolean;
  error?: string;
  className?: string;
  onReminderClick?: (reminder: ActiveReminder) => void;
}

const PRIORITY_STYLES = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-orange-100 text-orange-700 border-orange-200',
  LOW: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function SolarReminders({ 
  data, 
  loading, 
  error, 
  className,
  onReminderClick
}: SolarRemindersProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Active Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-16 bg-gray-200 rounded-full" />
                  <div className="h-4 w-12 bg-gray-200 rounded-full" />
                </div>
                <div className="h-4 w-full bg-gray-200 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
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
          <div className="text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }
  
  const reminders = data?.reminders ?? [];
  const highPriorityCount = data?.high_priority_count ?? 0;
  const todayCount = data?.today_count ?? 0;
  const overdueCount = data?.overdue_count ?? 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Active Reminders
          </CardTitle>
          <Badge variant="secondary">{reminders.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b text-xs">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" />
              {overdueCount} overdue
            </div>
          )}
          {todayCount > 0 && (
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              {todayCount} today
            </div>
          )}
          {highPriorityCount > 0 && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {highPriorityCount} high priority
            </div>
          )}
        </div>
        
        {/* Reminder List */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No active reminders
            </div>
          ) : (
            reminders.map((reminder, index) => {
              const overdue = isOverdue(reminder.due_date);
              const today = isDueToday(reminder.due_date);
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    overdue && 'border-red-200 bg-red-50/50',
                    today && !overdue && 'border-orange-200 bg-orange-50/50',
                    !overdue && !today && 'hover:bg-gray-50'
                  )}
                  onClick={() => onReminderClick?.(reminder)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', PRIORITY_STYLES[reminder.priority])}
                    >
                      {reminder.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {reminder.stage}
                    </Badge>
                    {overdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                    {today && !overdue && (
                      <Badge className="text-xs bg-orange-500">
                        Today
                      </Badge>
                    )}
                  </div>
                  
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {reminder.lead_name}
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {reminder.next_action}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(reminder.due_date).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolarReminders;
