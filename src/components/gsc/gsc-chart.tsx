"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "@/lib/use-dark-mode";

interface GscChartData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export function GscChart({ data }: { data: GscChartData[] }) {
  const dark = useDarkMode();

  const formatted = data.map((d) => ({
    ...d,
    date: d.date ? d.date.substring(5) : d.date,
  }));

  const gridColor    = dark ? "#1a2a40" : "#eef1f6";
  const tickColor    = dark ? "#5d7494" : "#8a96aa";
  const tooltipBg    = dark ? "#111d2e" : "#ffffff";
  const tooltipBorder= dark ? "#1e3048" : "#e8edf5";
  const tooltipText  = dark ? "#c8d8f0" : "#0f2f61";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a4480" stopOpacity={dark ? 0.35 : 0.18} />
            <stop offset="95%" stopColor="#1a4480" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A961" stopOpacity={dark ? 0.4 : 0.3} />
            <stop offset="95%" stopColor="#C9A961" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            background: tooltipBg,
            color: tooltipText,
          }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : Number(value);
            return [v.toLocaleString(), String(name)];
          }}
        />
        <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, color: tickColor }} />
        <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#C9A961" strokeWidth={2} fill="url(#impressionsGradient)" dot={false} />
        <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#1a4480" strokeWidth={2} fill="url(#clicksGradient)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
