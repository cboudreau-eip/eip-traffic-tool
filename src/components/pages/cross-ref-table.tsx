"use client";

import { useState, useMemo } from "react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface CrossRefRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessions: number;
  users: number;
  bounceRate: number;
  hasGsc: boolean;
  hasGa4: boolean;
}

type SortKey = "page" | "clicks" | "impressions" | "ctr" | "position" | "sessions" | "users" | "bounceRate";
type Coverage = "all" | "both" | "gsc_only" | "ga4_only";

interface Column {
  key: SortKey;
  label: string;
  numeric: boolean;
  source: "page" | "gsc" | "ga4";
}

const COLUMNS: Column[] = [
  { key: "page",       label: "Page",        numeric: false, source: "page" },
  { key: "clicks",     label: "Clicks",      numeric: true,  source: "gsc"  },
  { key: "impressions",label: "Impressions", numeric: true,  source: "gsc"  },
  { key: "ctr",        label: "CTR",         numeric: true,  source: "gsc"  },
  { key: "position",   label: "Position",    numeric: true,  source: "gsc"  },
  { key: "sessions",   label: "Sessions",    numeric: true,  source: "ga4"  },
  { key: "users",      label: "Users",       numeric: true,  source: "ga4"  },
  { key: "bounceRate", label: "Bounce",      numeric: true,  source: "ga4"  },
];

const SOURCE_COLORS: Record<string, string> = {
  gsc: "var(--md-primary)",
  ga4: "var(--md-tertiary)",
};

const PAGE_SIZE = 25;

function CoverageChip({ hasGsc, hasGa4 }: { hasGsc: boolean; hasGa4: boolean }) {
  if (hasGsc && hasGa4)
    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-md-success-container text-md-on-success-container">Both</span>;
  if (hasGsc)
    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-md-secondary-container text-md-on-secondary-container">GSC</span>;
  return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-md-primary-container text-md-on-primary-container">GA4</span>;
}

export function CrossRefTable({ rows }: { rows: CrossRefRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter]   = useState("");
  const [coverage, setCoverage] = useState<Coverage>("all");
  const [page, setPage]       = useState(1);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "page" ? "asc" : "desc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = rows;
    if (coverage === "both")    result = result.filter((r) => r.hasGsc && r.hasGa4);
    if (coverage === "gsc_only") result = result.filter((r) => r.hasGsc && !r.hasGa4);
    if (coverage === "ga4_only") result = result.filter((r) => !r.hasGsc && r.hasGa4);
    const q = filter.toLowerCase();
    if (q) result = result.filter((r) => r.page.toLowerCase().includes(q));
    return result;
  }, [rows, filter, coverage]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "page") {
        const cmp = a.page.localeCompare(b.page);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startRow   = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRow     = Math.min(safePage * PAGE_SIZE, sorted.length);

  const bothCount   = rows.filter((r) => r.hasGsc && r.hasGa4).length;
  const gscCount    = rows.filter((r) => r.hasGsc && !r.hasGa4).length;
  const ga4Count    = rows.filter((r) => !r.hasGsc && r.hasGa4).length;

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--clr-muted)" }}>
        No data yet — upload a GSC export and a GA4 export to see cross-reference data.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Coverage summary pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all",      label: `All (${rows.length})` },
            { key: "both",     label: `Both (${bothCount})`,     color: "bg-md-success-container text-md-on-success-container"  },
            { key: "gsc_only", label: `GSC only (${gscCount})`,  color: "bg-md-secondary-container text-md-on-secondary-container"    },
            { key: "ga4_only", label: `GA4 only (${ga4Count})`,  color: "bg-md-primary-container text-md-on-primary-container"},
          ] as Array<{ key: Coverage; label: string; color?: string }>
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setCoverage(opt.key); setPage(1); }}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: coverage === opt.key ? "var(--clr-primary)" : "var(--clr-surface-2)",
              color:      coverage === opt.key ? "var(--clr-surface)"  : "var(--clr-secondary)",
            }}
          >
            {opt.label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Filter by path…"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="ml-auto w-full max-w-xs rounded-lg border px-3 py-1.5 text-xs outline-none"
          style={{
            borderColor: "var(--clr-border)",
            background:  "var(--clr-surface)",
            color:       "var(--clr-primary)",
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--clr-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--clr-surface-2)", borderBottom: "2px solid var(--clr-border)" }}>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--clr-muted)" }}>
                Coverage
              </th>
              {COLUMNS.map(({ key, label, numeric, source }) => {
                const active = sortKey === key;
                return (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="cursor-pointer select-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors"
                    style={{
                      textAlign: numeric ? "right" : "left",
                      color: active ? "var(--clr-primary)" : "var(--clr-secondary)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ justifyContent: numeric ? "flex-end" : "flex-start" }}
                    >
                      {source !== "page" && (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: SOURCE_COLORS[source] }}
                        />
                      )}
                      {label}
                      {active ? (
                        sortDir === "desc"
                          ? <ChevronDown className="h-3 w-3" style={{ color: "var(--clr-gold)" }} />
                          : <ChevronUp   className="h-3 w-3" style={{ color: "var(--clr-gold)" }} />
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
                key={row.page + i}
                className="group transition-colors"
                style={{ borderBottom: "1px solid var(--clr-border-2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td className="px-4 py-2.5">
                  <CoverageChip hasGsc={row.hasGsc} hasGa4={row.hasGa4} />
                </td>
                <td
                  className="max-w-[260px] truncate px-4 py-2.5 text-xs font-medium font-mono transition-colors group-hover:text-[var(--clr-gold)]"
                  style={{ color: "var(--clr-primary)" }}
                  title={row.page}
                >
                  {row.page}
                </td>
                {/* GSC metrics */}
                <td className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: row.hasGsc ? "var(--clr-primary)"   : "var(--clr-border)" }}>
                  {row.hasGsc ? formatNumber(row.clicks) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: row.hasGsc ? "var(--clr-secondary)" : "var(--clr-border)" }}>
                  {row.hasGsc ? formatNumber(row.impressions) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: row.hasGsc ? "var(--clr-secondary)" : "var(--clr-border)" }}>
                  {row.hasGsc ? formatPercent(row.ctr) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: row.hasGsc ? "var(--clr-secondary)" : "var(--clr-border)" }}>
                  {row.hasGsc ? row.position.toFixed(1) : "—"}
                </td>
                {/* GA4 metrics */}
                <td className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: row.hasGa4 ? "var(--clr-primary)"   : "var(--clr-border)" }}>
                  {row.hasGa4 ? formatNumber(row.sessions) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: row.hasGa4 ? "var(--clr-secondary)" : "var(--clr-border)" }}>
                  {row.hasGa4 ? formatNumber(row.users) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: row.hasGa4 ? "var(--clr-secondary)" : "var(--clr-border)" }}>
                  {row.hasGa4 ? formatPercent(row.bounceRate) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div
          className="flex items-center justify-between border-t px-4 py-2.5"
          style={{ borderColor: "var(--clr-border)" }}
        >
          <span className="text-xs" style={{ color: "var(--clr-muted)" }}>
            {sorted.length === 0 ? "No results" : `${startRow}–${endRow} of ${sorted.length.toLocaleString()} pages`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
              style={{ color: "var(--clr-primary)" }}
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded p-1 transition-colors disabled:opacity-30"
              style={{ color: "var(--clr-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e-${i}`} className="px-1 text-xs" style={{ color: "var(--clr-muted)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="min-w-[28px] rounded px-1.5 py-1 text-xs font-medium transition-colors"
                    style={{
                      background: safePage === p ? "var(--clr-primary)" : "transparent",
                      color:      safePage === p ? "var(--clr-surface)"  : "var(--clr-secondary)",
                    }}
                  >{p}</button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded p-1 transition-colors disabled:opacity-30"
              style={{ color: "var(--clr-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
              style={{ color: "var(--clr-primary)" }}
            >»</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--clr-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-md-primary" /> GSC = Search Console data
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-md-tertiary" /> GA4 = Analytics data
        </span>
      </div>
    </div>
  );
}
