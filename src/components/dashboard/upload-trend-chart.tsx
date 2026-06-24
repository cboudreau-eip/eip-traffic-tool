"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "@/lib/use-dark-mode";

interface TrendPoint {
  label: string;
  [key: string]: string | number;
}

interface BarConfig {
  key: string;
  name: string;
  color: string;
}

export function UploadTrendChart({
  data,
  bars,
}: {
  data: TrendPoint[];
  bars: BarConfig[];
}) {
  const dark = useDarkMode();

  const gridColor    = dark ? "#1a2a40" : "#f0f0f0";
  const tickColor    = dark ? "#5d7494" : "#9ca3af";
  const tooltipBg    = dark ? "#111d2e" : "#ffffff";
  const tooltipBorder= dark ? "#1e3048" : "#e5e7eb";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            background: tooltipBg,
            color: dark ? "#c8d8f0" : "#111827",
          }}
          formatter={(v) => typeof v === "number" ? v.toLocaleString() : String(v)}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: tickColor }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
