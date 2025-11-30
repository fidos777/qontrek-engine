"use client";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Recoverable */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-2">Total Recoverable</div>
        <div className="text-4xl font-bold">
          <AnimatedNumber value={152500} prefix="RM " />
        </div>
      </div>

      {/* 7-Day Recovery Rate */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-2">7-Day Recovery Rate</div>
        <div className="text-4xl font-bold">
          <AnimatedNumber value={32} suffix="%" />
        </div>
        <div className="text-xs text-gray-500 mt-1">Avg days to pay: 11</div>
      </div>

      {/* Pending Cases */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-2">Pending Cases</div>
        <div className="text-4xl font-bold">
          <AnimatedNumber value={14} />
        </div>
      </div>

      {/* Handover Queue */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600 mb-2">Handover Queue</div>
        <div className="text-4xl font-bold">
          <AnimatedNumber value={5} />
        </div>
      </div>
    </div>
  );
}

