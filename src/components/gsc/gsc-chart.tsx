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

  // Material 3 palette — primary (clicks) & tertiary (impressions)
  const primary      = dark ? "#D0BCFF" : "#6750A4";
  const tertiary     = dark ? "#EFB8C8" : "#7D5260";
  const gridColor    = dark ? "#49454F" : "#E7E0EC";
  const tickColor    = dark ? "#CAC4D0" : "#79747E";
  const tooltipBg    = dark ? "#211F26" : "#FEF7FF";
  const tooltipBorder= dark ? "#49454F" : "#CAC4D0";
  const tooltipText  = dark ? "#E6E0E9" : "#1D1B20";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primary} stopOpacity={dark ? 0.35 : 0.18} />
            <stop offset="95%" stopColor={primary} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={tertiary} stopOpacity={dark ? 0.4 : 0.3} />
            <stop offset="95%" stopColor={tertiary} stopOpacity={0.03} />
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
        <Area type="monotone" dataKey="impressions" name="Impressions" stroke={tertiary} strokeWidth={2} fill="url(#impressionsGradient)" dot={false} />
        <Area type="monotone" dataKey="clicks" name="Clicks" stroke={primary} strokeWidth={2} fill="url(#clicksGradient)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
