"use client";

import { useState, useEffect } from "react";
import {
  ProofFreshnessIndicator,
  ProofFreshnessIndicatorCompact,
} from "@/components/voltek/ProofFreshnessIndicator";

export default function Gate2DashboardHeader() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [freshness, setFreshness] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-update freshness every second
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setFreshness(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Collapse indicator after 5 minutes (300s)
  useEffect(() => {
    setCollapsed(freshness >= 300);
  }, [freshness]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      {/* Left side — Title and subtitle */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          Gate 2 — Payment Recovery
        </h1>
        <p className="text-sm text-slate-500">Automated Recovery Dashboard</p>
      </div>

      {/* Right side — Responsive indicator */}
      <div className="flex items-center">
        {!collapsed ? (
          isMobile ? (
            <ProofFreshnessIndicatorCompact
              lastUpdated={lastUpdated}
              className="ml-2 scale-95"
            />
          ) : (
            <ProofFreshnessIndicator
              lastUpdated={lastUpdated}
              className="ml-2"
            />
          )
        ) : (
          // Collapsed "LIVE dot" after 5 minutes
          <div className="flex items-center gap-2 ml-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}

