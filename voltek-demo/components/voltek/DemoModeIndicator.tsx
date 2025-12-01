// components/voltek/DemoModeIndicator.tsx
import { AlertCircle } from "lucide-react";
import { voltekTheme } from "@/config/voltek-theme";

export function DemoModeIndicator() {
  if (!voltekTheme.brand.demo_mode) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border-2 border-amber-500 rounded-lg p-3 shadow-lg max-w-xs">
      <div className="flex items-start gap-2">
        <AlertCircle className="text-amber-700 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <div className="font-semibold text-amber-900 text-sm">Demo Mode</div>
          <div className="text-xs text-amber-700 mt-1">
            Using Voltek sample data • Trust Index: 100%
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Production: Real-time updates enabled
          </div>
        </div>
      </div>
    </div>
  );
}
