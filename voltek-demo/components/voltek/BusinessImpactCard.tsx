// components/voltek/BusinessImpactCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BusinessImpactProps {
  totalPipeline: number;
  highPriorityCount: number;
  avgDays: number;
  successRate: number;
}

export function BusinessImpactCard({
  totalPipeline,
  highPriorityCount,
  avgDays,
  successRate
}: BusinessImpactProps) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-green-600" size={24} />
          Projected Recovery Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Total Recoverable Pipeline</div>
            <div className="text-3xl font-bold text-green-700">
              {formatCurrency(totalPipeline)}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">High Priority</div>
              <div className="text-xl font-semibold">{highPriorityCount}</div>
              <div className="text-xs text-muted-foreground">leads</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Avg Days</div>
              <div className="text-xl font-semibold">{avgDays.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">overdue</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
              <div className="text-xl font-semibold">{successRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">recovery</div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground pt-3 border-t border-green-200">
            📊 Based on real Voltek pipeline data
            <br />
            🕐 Updated: {new Date().toLocaleString('ms-MY')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
