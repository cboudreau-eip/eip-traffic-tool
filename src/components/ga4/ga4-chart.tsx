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

interface Ga4ChartData {
  date: string;
  sessions: number;
  users: number;
  pageViews: number;
}

export function Ga4Chart({ data }: { data: Ga4ChartData[] }) {
  const dark = useDarkMode();

  const formatted = data.map((d) => ({
    ...d,
    date: d.date ? d.date.substring(5) : d.date,
  }));

  // Material 3 palette — primary (sessions) & tertiary (users)
  const primary      = dark ? "#D0BCFF" : "#6750A4";
  const tertiary     = dark ? "#EFB8C8" : "#7D5260";
  const gridColor    = dark ? "#49454F" : "#E7E0EC";
  const tickColor    = dark ? "#CAC4D0" : "#79747E";
  const tooltipBg    = dark ? "#211F26" : "#FEF7FF";
  const tooltipBorder= dark ? "#49454F" : "#CAC4D0";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ga4sessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primary} stopOpacity={dark ? 0.25 : 0.15} />
            <stop offset="95%" stopColor={primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ga4users" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={tertiary} stopOpacity={dark ? 0.25 : 0.15} />
            <stop offset="95%" stopColor={tertiary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            background: tooltipBg,
            color: dark ? "#E6E0E9" : "#1D1B20",
          }}
          formatter={(v) => typeof v === "number" ? v.toLocaleString() : String(v)}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: tickColor }} />
        <Area type="monotone" dataKey="sessions" name="Sessions" stroke={primary} strokeWidth={2} fill="url(#ga4sessions)" />
        <Area type="monotone" dataKey="users" name="Users" stroke={tertiary} strokeWidth={2} fill="url(#ga4users)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
