// ============================================
// SOLAR KPI GRID COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Display recovery performance metrics grid
// ============================================

'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  AlertTriangle,
  Phone,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolarKpiGridData, KpiMetric } from '@/lib/widgets/schemas/solar';

interface SolarKpiGridProps {
  data?: SolarKpiGridData;
  loading?: boolean;
  error?: string;
  className?: string;
}

const ICON_MAP: Record<string, typeof TrendingUp> = {
  'trending-up': TrendingUp,
  'calendar': Calendar,
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'phone': Phone,
};

const COLOR_MAP: Record<string, {
  bg: string;
  text: string;
  icon: string;
}> = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'text-orange-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'text-yellow-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
};

function MetricCard({ metric, index }: { metric: KpiMetric; index: number }) {
  const Icon = ICON_MAP[metric.icon || 'trending-up'] || TrendingUp;
  const colors = COLOR_MAP[metric.color] || COLOR_MAP.green;
  
  const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                    metric.trend === 'down' ? TrendingDown : Minus;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className={cn(
        'rounded-lg p-4 h-full',
        colors.bg
      )}>
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
          
          {metric.trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              metric.trend === 'up' ? 'text-green-600' : 
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              <TrendIcon className="h-3 w-3" />
              {metric.trend_value !== undefined && `${metric.trend_value}%`}
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <div className={cn('text-2xl font-bold', colors.text)}>
            {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
            <span className="text-sm font-normal ml-0.5">{metric.unit}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function SolarKpiGrid({ data, loading, error, className }: SolarKpiGridProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recovery Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-4 h-24">
                <div className="h-6 w-6 bg-gray-200 rounded mb-3" />
                <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
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
  
  const metrics = data?.metrics ?? [];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recovery Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolarKpiGrid;
