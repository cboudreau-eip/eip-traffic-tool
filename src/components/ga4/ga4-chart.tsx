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

  const gridColor    = dark ? "#1a2a40" : "#f0f0f0";
  const tickColor    = dark ? "#5d7494" : "#9ca3af";
  const tooltipBg    = dark ? "#111d2e" : "#ffffff";
  const tooltipBorder= dark ? "#1e3048" : "#e5e7eb";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ga4sessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={dark ? 0.25 : 0.15} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ga4users" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={dark ? 0.25 : 0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            color: dark ? "#c8d8f0" : "#111827",
          }}
          formatter={(v) => typeof v === "number" ? v.toLocaleString() : String(v)}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: tickColor }} />
        <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#f97316" strokeWidth={2} fill="url(#ga4sessions)" />
        <Area type="monotone" dataKey="users" name="Users" stroke="#6366f1" strokeWidth={2} fill="url(#ga4users)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
