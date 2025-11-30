// ============================================
// SOLAR STAGE BUCKETS COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Display payment stage buckets (80%, 20%, Handover)
// ============================================

'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolarStageBucketsData, StageBucket } from '@/lib/widgets/schemas/solar';

interface SolarStageBucketsProps {
  data?: SolarStageBucketsData;
  loading?: boolean;
  error?: string;
  className?: string;
}

const BUCKET_CONFIG: Record<string, {
  icon: typeof Clock;
  gradient: string;
  textColor: string;
  bgColor: string;
}> = {
  'Pending 80%': {
    icon: Clock,
    gradient: 'from-orange-500 to-amber-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
  'Pending 20%': {
    icon: CheckCircle,
    gradient: 'from-yellow-500 to-amber-400',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  'Pending Handover': {
    icon: Truck,
    gradient: 'from-sky-500 to-blue-500',
    textColor: 'text-sky-700',
    bgColor: 'bg-sky-50',
  },
};

function BucketCard({ bucket, index }: { bucket: StageBucket; index: number }) {
  const config = BUCKET_CONFIG[bucket.label] || BUCKET_CONFIG['Pending 80%'];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className={cn('overflow-hidden', config.bgColor)}>
        <div className={cn('h-1 bg-gradient-to-r', config.gradient)} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className={cn('flex items-center gap-2 text-sm font-medium', config.textColor)}>
                <Icon className="h-4 w-4" />
                {bucket.label}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                RM {bucket.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {bucket.count} {bucket.count === 1 ? 'project' : 'projects'}
              </div>
            </div>
            
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-semibold',
              config.bgColor,
              config.textColor
            )}>
              {bucket.percentage.toFixed(1)}%
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full bg-gradient-to-r rounded-full', config.gradient)}
              initial={{ width: 0 }}
              animate={{ width: `${bucket.percentage}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SolarStageBuckets({ data, loading, error, className }: SolarStageBucketsProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-2 w-full bg-gray-200 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className={cn('bg-red-50 border-red-200', className)}>
        <CardContent className="p-4">
          <div className="text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }
  
  const buckets = data?.buckets ?? [];
  
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {buckets.map((bucket, index) => (
        <BucketCard key={bucket.label} bucket={bucket} index={index} />
      ))}
    </div>
  );
}

export default SolarStageBuckets;
