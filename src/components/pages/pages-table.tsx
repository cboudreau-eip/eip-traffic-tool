"use client";

import { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type PageRow = {
  page: string;
  isNew: boolean;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessions: number | null;
  prevClicks: number | null;
  prevImpressions: number | null;
  prevCtr: number | null;
  prevPosition: number | null;
};

type QueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SortKey = "clicks" | "impressions" | "ctr" | "position" | "sessions";
type SortDir = "asc" | "desc";

function pctDelta(current: number, prev: number | null): number | null {
  if (prev === null) return null;
  if (prev === 0) return current > 0 ? Infinity : null;
  return (current - prev) / prev;
}

function DeltaChip({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-xs" style={{ color: "var(--clr-border)" }}>—</span>;
  if (!isFinite(value)) return (
    <span className="inline-flex items-center rounded bg-md-success-container px-1.5 py-0.5 text-xs font-medium text-md-on-success-container">new</span>
  );
  const isPositive = invert ? value < 0 : value > 0;
  const abs = Math.abs(value * 100);
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium",
      isPositive ? "bg-md-success-container text-md-on-success-container" : "bg-md-error-container text-md-on-error-container"
    )}>
      {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {abs > 999 ? "999+" : abs.toFixed(0)}%
    </span>
  );
}

function MetricCell({
  current,
  prev,
  format = "number",
  invert = false,
}: {
  current: number;
  prev: number | null;
  format?: "number" | "pct" | "pos";
  invert?: boolean;
}) {
  const d = pctDelta(current, prev);
  const display =
    format === "pct"
      ? (current * 100).toFixed(1) + "%"
      : format === "pos"
      ? current.toFixed(1)
      : formatNumber(current);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-medium" style={{ color: "var(--clr-primary)" }}>{display}</span>
      {prev !== null && <DeltaChip value={d} invert={invert} />}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide"
      style={{ color: active ? "var(--md-primary)" : "var(--clr-muted)" }}
    >
      {label}
      {active ? (
        dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export function PagesTable({
  rows,
  hasComparison,
  currentUploadId,
}: {
  rows: PageRow[];
  hasComparison: boolean;
  currentUploadId: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const filtered = search
      ? rows.filter((r) => r.page.toLowerCase().includes(search.toLowerCase()))
      : rows;

    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir === "desc"
        ? (bv as number) - (av as number)
        : (av as number) - (bv as number);
    });
  }, [rows, sortKey, sortDir, search]);

  function pathOnly(url: string) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Filter pages…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border px-3 py-1.5 text-sm outline-none"
        style={{
          borderColor: "var(--clr-border)",
          background: "var(--clr-surface)",
          color: "var(--clr-primary)",
        }}
      />

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface-2)" }}>
              <th className="w-8 py-3 pl-3" />
              <th className="py-3 pl-2 text-left">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--clr-muted)" }}>Page</span>
              </th>
              <th className="py-3 pr-4 text-right">
                <SortableHeader label="Clicks" sortKey="clicks" current={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="py-3 pr-4 text-right">
                <SortableHeader label="Impressions" sortKey="impressions" current={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="py-3 pr-4 text-right">
                <SortableHeader label="CTR" sortKey="ctr" current={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="py-3 pr-4 text-right">
                <SortableHeader label="Position" sortKey="position" current={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              {rows.some((r) => r.sessions !== null) && (
                <th className="py-3 pr-4 text-right">
                  <SortableHeader label="Sessions" sortKey="sessions" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <ExpandableRow
                key={row.page}
                row={row}
                hasComparison={hasComparison}
                showSessions={rows.some((r) => r.sessions !== null)}
                uploadId={currentUploadId}
                pathOnly={pathOnly}
              />
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--clr-muted)" }}>No pages match your filter.</div>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--clr-muted)" }}>{sorted.length} of {rows.length} pages</p>
    </div>
  );
}

function ExpandableRow({
  row,
  hasComparison,
  showSessions,
  uploadId,
  pathOnly,
}: {
  row: PageRow;
  hasComparison: boolean;
  showSessions: boolean;
  uploadId: string;
  pathOnly: (url: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [queries, setQueries] = useState<QueryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && queries === null) {
      setLoading(true);
      const res = await fetch(
        `/api/gsc/page-queries?uploadId=${encodeURIComponent(uploadId)}&page=${encodeURIComponent(row.page)}`
      );
      const data = await res.json();
      setQueries(data.queries ?? []);
      setLoading(false);
    }
    setOpen((v) => !v);
  }

  const path = pathOnly(row.page);

  return (
    <>
      <tr
        className="group transition-colors"
        style={{ borderBottom: "1px solid var(--clr-border-2)", background: open ? "var(--clr-surface-2)" : "" }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--clr-surface-2)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = ""; }}
      >
        <td className="py-3 pl-3">
          <button
            onClick={toggle}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--clr-muted)" }} />
            ) : open ? (
              <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--clr-muted)" }} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--clr-muted)" }} />
            )}
          </button>
        </td>
        <td className="py-3 pl-2 pr-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-mono" style={{ color: "var(--clr-secondary)" }} title={row.page}>
                  {path}
                </span>
                {row.isNew && hasComparison && (
                  <span className="shrink-0 inline-flex items-center rounded bg-md-success-container px-1.5 py-0.5 text-xs font-medium text-md-on-success-container">
                    new
                  </span>
                )}
                <a
                  href={row.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 hover:text-md-primary" style={{ color: "var(--clr-muted)" }} />
                </a>
              </div>
            </div>
          </div>
        </td>
        <td className="py-3 pr-4">
          <MetricCell current={row.clicks} prev={hasComparison ? row.prevClicks : null} format="number" />
        </td>
        <td className="py-3 pr-4">
          <MetricCell current={row.impressions} prev={hasComparison ? row.prevImpressions : null} format="number" />
        </td>
        <td className="py-3 pr-4">
          <MetricCell current={row.ctr} prev={hasComparison ? row.prevCtr : null} format="pct" />
        </td>
        <td className="py-3 pr-4">
          <MetricCell current={row.position} prev={hasComparison ? row.prevPosition : null} format="pos" invert />
        </td>
        {showSessions && (
          <td className="py-3 pr-4">
            {row.sessions !== null ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-medium" style={{ color: "var(--clr-primary)" }}>{formatNumber(row.sessions)}</span>
              </div>
            ) : (
              <span className="text-xs flex justify-end" style={{ color: "var(--clr-border)" }}>—</span>
            )}
          </td>
        )}
      </tr>
      {open && (
        <tr>
          <td colSpan={showSessions ? 7 : 6} className="pb-3 pl-12 pr-4 pt-0">
            {queries === null || loading ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--clr-muted)" }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Loading queries…
              </div>
            ) : queries.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--clr-muted)" }}>No query data for this page.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface-2)", color: "var(--clr-muted)" }}>
                      <th className="py-2 pl-3 text-left font-medium">Query</th>
                      <th className="py-2 pr-3 text-right font-medium">Clicks</th>
                      <th className="py-2 pr-3 text-right font-medium">Impressions</th>
                      <th className="py-2 pr-3 text-right font-medium">CTR</th>
                      <th className="py-2 pr-3 text-right font-medium">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries.map((q) => (
                      <tr key={q.query} style={{ borderBottom: "1px solid var(--clr-border-2)" }}>
                        <td className="py-1.5 pl-3" style={{ color: "var(--clr-secondary)" }}>{q.query}</td>
                        <td className="py-1.5 pr-3 text-right" style={{ color: "var(--clr-secondary)" }}>{formatNumber(q.clicks)}</td>
                        <td className="py-1.5 pr-3 text-right" style={{ color: "var(--clr-muted)" }}>{formatNumber(q.impressions)}</td>
                        <td className="py-1.5 pr-3 text-right" style={{ color: "var(--clr-muted)" }}>{(q.ctr * 100).toFixed(1)}%</td>
                        <td className="py-1.5 pr-3 text-right" style={{ color: "var(--clr-muted)" }}>{q.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
