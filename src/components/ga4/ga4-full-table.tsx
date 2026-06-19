"use client";

import { useState, useMemo } from "react";
import { formatNumber, formatPercent, formatDuration } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface Ga4FullRow {
  pagePath: string;
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDur: number;
  conversions: number;
}

type SortKey = keyof Ga4FullRow;

interface Column {
  key: SortKey;
  label: string;
  numeric: boolean;
  format: (v: Ga4FullRow) => string;
}

const COLUMNS: Column[] = [
  { key: "pagePath",     label: "Page Path",       numeric: false, format: (r) => r.pagePath },
  { key: "sessions",     label: "Sessions",         numeric: true,  format: (r) => formatNumber(r.sessions) },
  { key: "users",        label: "Users",            numeric: true,  format: (r) => formatNumber(r.users) },
  { key: "newUsers",     label: "New Users",        numeric: true,  format: (r) => formatNumber(r.newUsers) },
  { key: "pageViews",    label: "Page Views",       numeric: true,  format: (r) => formatNumber(r.pageViews) },
  { key: "bounceRate",   label: "Bounce Rate",      numeric: true,  format: (r) => formatPercent(r.bounceRate) },
  { key: "avgSessionDur",label: "Avg. Duration",    numeric: true,  format: (r) => formatDuration(r.avgSessionDur) },
  { key: "conversions",  label: "Conversions",      numeric: true,  format: (r) => formatNumber(r.conversions) },
];

export function Ga4FullTable({ rows }: { rows: Ga4FullRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("sessions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "pagePath" ? "asc" : "desc");
    }
  }

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return rows.filter((r) => !q || r.pagePath.toLowerCase().includes(q));
  }, [rows, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string") {
        const cmp = (av as string).localeCompare(bv as string);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "#8a96aa" }}>
        No GA4 data yet. Upload a GA4 export.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Filter by page path..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f2f61]"
        style={{ borderColor: "#e8edf5", color: "#0f2f61" }}
      />

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e8edf5" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f0f4fa", borderBottom: "2px solid #e8edf5" }}>
              {COLUMNS.map(({ key, label, numeric }) => {
                const active = sortKey === key;
                return (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-[#e8edf5]"
                    style={{
                      textAlign: numeric ? "right" : "left",
                      color: active ? "#0f2f61" : "#5d6a80",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ justifyContent: numeric ? "flex-end" : "flex-start" }}
                    >
                      {label}
                      {active ? (
                        sortDir === "desc" ? (
                          <ChevronDown className="h-3 w-3" style={{ color: "#C9A961" }} />
                        ) : (
                          <ChevronUp className="h-3 w-3" style={{ color: "#C9A961" }} />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.pagePath + i}
                className="group transition-colors"
                style={{
                  borderBottom: "1px solid #f0f4fa",
                }}
              >
                <td
                  className="max-w-[280px] truncate px-4 py-2.5 text-xs font-medium group-hover:text-[#C9A961] transition-colors"
                  style={{ color: "#0f2f61" }}
                  title={row.pagePath}
                >
                  {row.pagePath}
                </td>
                <td
                  className="px-4 py-2.5 text-right text-xs font-semibold"
                  style={{ color: "#0f2f61" }}
                >
                  {formatNumber(row.sessions)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatNumber(row.users)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatNumber(row.newUsers)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatNumber(row.pageViews)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatPercent(row.bounceRate)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatDuration(row.avgSessionDur)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "#5d6a80" }}>
                  {formatNumber(row.conversions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="border-t px-4 py-2 text-xs"
          style={{ borderColor: "#e8edf5", color: "#8a96aa" }}
        >
          {sorted.length.toLocaleString()} of {rows.length.toLocaleString()} page
          {rows.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
