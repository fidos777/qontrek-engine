// ============================================
// SOLAR RECENT WINS COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Show recent successful recoveries
// ============================================

'use client';

import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolarRecentWinsData } from '@/lib/widgets/schemas/solar';
import { formatRelativeTime } from '@/lib/widgets/schemas/solar';

interface SolarRecentWinsProps {
  data?: SolarRecentWinsData;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function SolarRecentWins({ data, loading, error, className }: SolarRecentWinsProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Recoveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-2 rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded" />
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
  
  const successes = data?.successes ?? [];
  const totalRecovered = data?.total_recovered ?? 0;
  const avgDays = data?.avg_days_to_pay ?? 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Recoveries
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" />
            RM {totalRecovered.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="flex items-center gap-4 pb-3 mb-3 border-b text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            Avg: {avgDays} days to pay
          </div>
        </div>
        
        {/* Success List */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {successes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No recent recoveries
            </div>
          ) : (
            successes.map((success, index) => (
              <motion.div
                key={success.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate text-sm">
                    {success.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {success.stage} • {success.days_to_pay} days
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-700 text-sm">
                    RM {success.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatRelativeTime(success.paid_at)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolarRecentWins;
