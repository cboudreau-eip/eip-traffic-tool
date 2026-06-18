"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GscChartData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export function GscChart({ data }: { data: GscChartData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date ? d.date.substring(5) : d.date,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : Number(value);
            if (name === "CTR %") return [`${v.toFixed(2)}%`, String(name)];
            return [v.toLocaleString(), String(name)];
          }}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="#f97316" radius={[3, 3, 0, 0]} />
        <Bar yAxisId="left" dataKey="impressions" name="Impressions" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="ctr"
          name="CTR %"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
