// ============================================
// SOLAR PIPELINE CHART COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Visualize pipeline by payment stage
// ============================================

'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolarPipelineChartData } from '@/lib/widgets/schemas/solar';
import { STAGE_COLORS } from '@/lib/widgets/schemas/solar';

interface SolarPipelineChartProps {
  data?: SolarPipelineChartData;
  loading?: boolean;
  error?: string;
  className?: string;
}

const DEFAULT_COLORS = ['#f97316', '#eab308', '#0ea5e9'];

export function SolarPipelineChart({ data, loading, error, className }: SolarPipelineChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Pipeline by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-full bg-gray-200 rounded" />
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
  
  const stages = data?.stages ?? [];
  const maxValue = Math.max(...stages.map(s => s.value), 1);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pipeline by Stage</CardTitle>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">
              RM {(data?.total_value ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const color = STAGE_COLORS[stage.stage] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            const widthPercent = (stage.value / maxValue) * 100;
            
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {stage.stage}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({stage.count} projects)
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    RM {stage.value.toLocaleString()}
                  </div>
                </div>
                
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <motion.div
                    className="h-full rounded-lg flex items-center justify-end pr-2"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
                  >
                    {widthPercent > 15 && (
                      <span className="text-xs font-semibold text-white">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 justify-center">
          {stages.map((stage, index) => {
            const color = STAGE_COLORS[stage.stage] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            return (
              <div key={stage.stage} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{stage.stage}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolarPipelineChart;
