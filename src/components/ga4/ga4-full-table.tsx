"use client";

import { useState, useMemo } from "react";
import { formatNumber, formatPercent, formatDuration } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

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
}

const COLUMNS: Column[] = [
  { key: "pagePath",      label: "Page Path",      numeric: false },
  { key: "sessions",      label: "Sessions",        numeric: true  },
  { key: "users",         label: "Users",           numeric: true  },
  { key: "newUsers",      label: "New Users",       numeric: true  },
  { key: "pageViews",     label: "Page Views",      numeric: true  },
  { key: "bounceRate",    label: "Bounce Rate",     numeric: true  },
  { key: "avgSessionDur", label: "Avg. Duration",   numeric: true  },
  { key: "conversions",   label: "Conversions",     numeric: true  },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function formatCell(key: SortKey, row: Ga4FullRow): string {
  if (key === "pagePath")      return row.pagePath;
  if (key === "bounceRate")    return formatPercent(row.bounceRate);
  if (key === "avgSessionDur") return formatDuration(row.avgSessionDur);
  return formatNumber(row[key] as number);
}

export function Ga4FullTable({ rows }: { rows: Ga4FullRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("sessions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter]   = useState("");
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(25);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "pagePath" ? "asc" : "desc");
    }
    setPage(1);
  }

  function handleFilter(value: string) {
    setFilter(value);
    setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const startRow = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow   = Math.min(safePage * pageSize, sorted.length);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "#8a96aa" }}>
        No GA4 data yet. Upload a GA4 export.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter + page size */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by page path..."
          value={filter}
          onChange={(e) => handleFilter(e.target.value)}
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f2f61]"
          style={{ borderColor: "#e8edf5", color: "#0f2f61" }}
        />
        <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: "#5d6a80" }}>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[#0f2f61]"
            style={{ borderColor: "#e8edf5", color: "#0f2f61" }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
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
                        sortDir === "desc"
                          ? <ChevronDown className="h-3 w-3" style={{ color: "#C9A961" }} />
                          : <ChevronUp   className="h-3 w-3" style={{ color: "#C9A961" }} />
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
            {pageRows.map((row, i) => (
              <tr
                key={row.pagePath + i}
                className="group transition-colors"
                style={{ borderBottom: "1px solid #f0f4fa" }}
              >
                <td
                  className="max-w-[280px] truncate px-4 py-2.5 text-xs font-medium group-hover:text-[#C9A961] transition-colors"
                  style={{ color: "#0f2f61" }}
                  title={row.pagePath}
                >
                  {row.pagePath}
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: "#0f2f61" }}>
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

        {/* Pagination footer */}
        <div
          className="flex items-center justify-between border-t px-4 py-2.5"
          style={{ borderColor: "#e8edf5" }}
        >
          <span className="text-xs" style={{ color: "#8a96aa" }}>
            {sorted.length === 0
              ? "No results"
              : `${startRow}–${endRow} of ${sorted.length.toLocaleString()} pages`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
              style={{ color: "#0f2f61" }}
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded p-1 transition-colors disabled:opacity-30 hover:bg-[#f0f4fa]"
              style={{ color: "#0f2f61" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs" style={{ color: "#8a96aa" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="min-w-[28px] rounded px-1.5 py-1 text-xs font-medium transition-colors"
                    style={{
                      background: safePage === p ? "#0f2f61" : "transparent",
                      color: safePage === p ? "#fff" : "#5d6a80",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded p-1 transition-colors disabled:opacity-30 hover:bg-[#f0f4fa]"
              style={{ color: "#0f2f61" }}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
              style={{ color: "#0f2f61" }}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
