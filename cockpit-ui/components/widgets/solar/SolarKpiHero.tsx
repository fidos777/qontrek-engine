// ============================================
// SOLAR KPI HERO COMPONENT
// Layer: L5 (Widget UI)
// Purpose: Display total recoverable as hero metric
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SolarKpiHeroData } from '@/lib/widgets/schemas/solar';

interface SolarKpiHeroProps {
  data?: SolarKpiHeroData;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Animated counter hook
function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
}

export function SolarKpiHero({ data, loading, error, className }: SolarKpiHeroProps) {
  const animatedValue = useCountUp(data?.total_recoverable ?? 0);
  
  if (loading) {
    return (
      <Card className={cn('bg-gradient-to-br from-amber-50 to-orange-100', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-amber-200 rounded" />
            <div className="h-12 w-64 bg-amber-200 rounded" />
            <div className="h-4 w-48 bg-amber-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn('bg-red-50 border-red-200', className)}>
        <CardContent className="p-6">
          <div className="text-red-600">Error loading data: {error}</div>
        </CardContent>
      </Card>
    );
  }
  
  const totalRecoverable = data?.total_recoverable ?? 0;
  const totalProjects = data?.total_projects ?? 0;
  const activeProjects = data?.active_projects ?? 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
        'border-amber-200 shadow-lg overflow-hidden relative',
        className
      )}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500 rounded-full blur-3xl" />
        </div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700">
                <Sun className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">
                  Total Recoverable Pipeline
                </span>
              </div>
              
              <motion.div
                className="text-4xl md:text-5xl font-bold text-amber-900"
                key={animatedValue}
              >
                RM {animatedValue.toLocaleString()}
              </motion.div>
              
              <div className="flex items-center gap-4 pt-2 text-sm text-amber-700">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{activeProjects}</span>
                  <span>active of</span>
                  <span className="font-semibold">{totalProjects}</span>
                  <span>projects</span>
                </div>
                
                {data?.change_7d !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    data.change_7d >= 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  )}>
                    {data.change_7d >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(data.change_7d)}% vs last week
                  </div>
                )}
              </div>
            </div>
            
            {/* Mini sparkline placeholder */}
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="text-xs text-amber-600 font-medium">7-Day Trend</div>
              <div className="w-24 h-12 bg-amber-200/50 rounded flex items-end gap-0.5 p-1">
                {[40, 55, 45, 60, 50, 70, 65].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-amber-500 rounded-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SolarKpiHero;
