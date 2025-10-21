import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrustPoint = {
  t: string;
  trust: number;
};

export default function TrustChartTile() {
  const [points, setPoints] = useState<TrustPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/proof/dashboard/trust_timeseries.json")
      .then((res) => (res.ok ? res.json() : { points: [] }))
      .then((payload) => {
        if (!cancelled) {
          setPoints(payload?.points ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPoints([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <h3 className="font-bold mb-2">Trust / Uptime (7 days)</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={points}>
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="trust"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
