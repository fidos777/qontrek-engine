# 🧠 QONTREK ENGINE — Reflex v13.1-A6 Governance Heatmap
# Purpose: Create TowerDashboard_v8.tsx to visualize Reflex governance metrics.

tasks:
  - name: 🎨 Create TowerDashboard_v8.tsx
    path: cockpit/TowerDashboard_v8.tsx
    action: create
    content: |
      import React, { useEffect, useState } from "react";
      import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
      import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

      export default function TowerDashboardV8() {
        const [metrics, setMetrics] = useState(null);
        const [trend, setTrend] = useState([]);

        useEffect(() => {
          async function loadData() {
            try {
              const res = await fetch("/proof/tower_audit_v13.json");
              const data = await res.json();
              setMetrics(data.metrics_summary);

              // simulate trend using local memory for now
              const t = JSON.parse(localStorage.getItem("tower_governance_trend") || "[]");
              t.push({ date: new Date().toLocaleTimeString(), score: data.metrics_summary.governance_score });
              localStorage.setItem("tower_governance_trend", JSON.stringify(t.slice(-10)));
              setTrend(t.slice(-10));
            } catch (err) {
              console.error("Error loading audit data", err);
            }
          }
          loadData();
        }, []);

        if (!metrics) return <div className="p-6 text-gray-500">Loading governance data...</div>;

        return (
          <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="shadow-lg border border-slate-200">
              <CardHeader>
                <CardTitle>Reflex Governance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  <li>🧩 <b>Avg Conversion:</b> {metrics.avg_conversion}</li>
                  <li>💸 <b>Avg Refund:</b> {metrics.avg_refund}</li>
                  <li>⚙️ <b>Efficiency:</b> {metrics.avg_efficiency}</li>
                  <li>🏁 <b>Governance Score:</b> <span className="font-bold text-green-600">{metrics.governance_score}</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-200">
              <CardHeader>
                <CardTitle>Governance Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      }

