"use client";
// app/components/RateLimitMeter.tsx
// RateLimitMeter - Per-tenant rate limit gauge

import React, { useState, useEffect } from "react";

export default function RateLimitMeter() {
  const [rate, setRate] = useState<number>(0);
  const [limit] = useState<number>(100); // 100 req/min
  const [tenantId, setTenantId] = useState<string>("default");

  useEffect(() => {
    const fetchRateLimit = async () => {
      try {
        const response = await fetch("/api/mcp/rate-limit");
        const data = await response.json();

        setRate(data.current || 0);
        setTenantId(data.tenant || "default");
      } catch (error) {
        console.error("Rate limit fetch error:", error);
      }
    };

    fetchRateLimit();

    // Update every 5 seconds
    const interval = setInterval(fetchRateLimit, 5000);

    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min(100, (rate / limit) * 100);

  const getColorClass = () => {
    if (percentage >= 90) return "bg-rose-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getTextColor = () => {
    if (percentage >= 90) return "text-rose-700";
    if (percentage >= 70) return "text-amber-700";
    return "text-emerald-700";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-2">Rate Limit</div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-bold ${getTextColor()}`}>{rate}</span>
        <span className="text-sm text-gray-500">/ {limit} req/min</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`Rate limit: ${rate} of ${limit} requests per minute`}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">Tenant: {tenantId}</div>
    </div>
  );
}
