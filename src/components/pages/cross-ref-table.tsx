"use client";

import { useState, useMemo } from "react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Zap, TrendingDown, AlertCircle, RadioTower } from "lucide-react";

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
type Coverage = "all" | "both" | "gsc_only" | "ga4_only" | "opportunities";
type FlagKey = "quick_win" | "ctr_gap" | "bounce" | "not_tracked";

interface Column {
  key: SortKey;
  label: string;
  numeric: boolean;
  source: "page" | "gsc" | "ga4";
}

interface FlagConfig {
  label: string;
  description: string;
  bg: string;
  color: string;
  icon: React.ElementType;
  iconColor: string;
}

const FLAGS: Record<FlagKey, FlagConfig> = {
  quick_win:   { label: "Quick win",   description: "Ranking on page 1 but CTR < 2% — title or meta description could be stronger", bg: "#dcfce7", color: "#15803d", icon: Zap,          iconColor: "#16a34a" },
  ctr_gap:     { label: "CTR gap",     description: "High impressions but very few clicks — low search visibility despite exposure",  bg: "#fef9c3", color: "#92400e", icon: TrendingDown,  iconColor: "#ca8a04" },
  bounce:      { label: "Bounce",      description: "Most visitors leave immediately — content may not match search intent",          bg: "#fee2e2", color: "#b91c1c", icon: AlertCircle,   iconColor: "#dc2626" },
  not_tracked: { label: "Not tracked", description: "Getting search clicks but no GA4 data — possible analytics tracking gap",       bg: "#ede9fe", color: "#6b21a8", icon: RadioTower,    iconColor: "#7c3aed" },
};

const COLUMNS: Column[] = [
  { key: "page",        label: "Page",        numeric: false, source: "page" },
  { key: "clicks",      label: "Clicks",      numeric: true,  source: "gsc"  },
  { key: "impressions", label: "Impressions", numeric: true,  source: "gsc"  },
  { key: "ctr",         label: "CTR",         numeric: true,  source: "gsc"  },
  { key: "position",    label: "Position",    numeric: true,  source: "gsc"  },
  { key: "sessions",    label: "Sessions",    numeric: true,  source: "ga4"  },
  { key: "users",       label: "Users",       numeric: true,  source: "ga4"  },
  { key: "bounceRate",  label: "Bounce",      numeric: true,  source: "ga4"  },
];

const SOURCE_COLORS: Record<string, string> = {
  gsc: "#1a4480",
  ga4: "#f97316",
};

const PAGE_SIZE = 25;

function getFlag(row: CrossRefRow): FlagKey | null {
  if (row.hasGsc && row.position > 0 && row.position <= 10 && row.impressions >= 500 && row.ctr < 0.02)
    return "quick_win";
  if (row.hasGsc && row.impressions >= 1000 && row.ctr < 0.01)
    return "ctr_gap";
  if (row.hasGa4 && row.sessions >= 50 && row.bounceRate > 0.7)
    return "bounce";
  if (row.hasGsc && !row.hasGa4 && row.clicks >= 10)
    return "not_tracked";
  return null;
}

function CoverageChip({ hasGsc, hasGa4 }: { hasGsc: boolean; hasGa4: boolean }) {
  if (hasGsc && hasGa4)
    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">Both</span>;
  if (hasGsc)
    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">GSC</span>;
  return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">GA4</span>;
}

function FlagChip({ flagKey }: { flagKey: FlagKey }) {
  const f = FLAGS[flagKey];
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ background: f.bg, color: f.color }}
      title={f.description}
    >
      {f.label}
    </span>
  );
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

  const flagCounts = useMemo(() => {
    const counts: Record<FlagKey, number> = { quick_win: 0, ctr_gap: 0, bounce: 0, not_tracked: 0 };
    for (const row of rows) {
      const f = getFlag(row);
      if (f) counts[f]++;
    }
    return counts;
  }, [rows]);

  const opportunityCount = useMemo(() => rows.filter((r) => getFlag(r) !== null).length, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (coverage === "both")         result = result.filter((r) => r.hasGsc && r.hasGa4);
    if (coverage === "gsc_only")     result = result.filter((r) => r.hasGsc && !r.hasGa4);
    if (coverage === "ga4_only")     result = result.filter((r) => !r.hasGsc && r.hasGa4);
    if (coverage === "opportunities") result = result.filter((r) => getFlag(r) !== null);
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

  const bothCount = rows.filter((r) => r.hasGsc && r.hasGa4).length;
  const gscCount  = rows.filter((r) => r.hasGsc && !r.hasGa4).length;
  const ga4Count  = rows.filter((r) => !r.hasGsc && r.hasGa4).length;

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--clr-muted)" }}>
        No data yet — upload a GSC export and a GA4 export to see cross-reference data.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Opportunity summary cards */}
      {opportunityCount > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(FLAGS) as FlagKey[]).map((key) => {
            const f = FLAGS[key];
            const Icon = f.icon;
            const count = flagCounts[key];
            return (
              <button
                key={key}
                onClick={() => { setCoverage("opportunities"); setPage(1); }}
                disabled={count === 0}
                className="flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-40"
                style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}
                onMouseEnter={(e) => { if (count > 0) e.currentTarget.style.background = "var(--clr-surface-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}
                title={f.description}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: f.bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: f.iconColor }} />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: "var(--clr-primary)" }}>{count}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--clr-muted)" }}>{f.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all",           label: `All (${rows.length})` },
            { key: "opportunities", label: `Opportunities (${opportunityCount})` },
            { key: "both",          label: `Both (${bothCount})` },
            { key: "gsc_only",      label: `GSC only (${gscCount})` },
            { key: "ga4_only",      label: `GA4 only (${ga4Count})` },
          ] as Array<{ key: Coverage; label: string }>
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
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--clr-muted)" }}>
                Flag
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
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: SOURCE_COLORS[source] }} />
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
            {pageRows.map((row, i) => {
              const flag = getFlag(row);
              return (
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
                  <td className="px-4 py-2.5">
                    {flag ? <FlagChip flagKey={flag} /> : <span className="text-xs" style={{ color: "var(--clr-border)" }}>—</span>}
                  </td>
                  <td
                    className="max-w-[240px] truncate px-4 py-2.5 text-xs font-medium font-mono transition-colors group-hover:text-[var(--clr-gold)]"
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
              );
            })}
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
      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--clr-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1a4480]" /> GSC = Search Console
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f97316]" /> GA4 = Analytics
        </span>
        <span className="flex items-center gap-1.5" title="Position 1–10, CTR &lt; 2%">
          <Zap className="h-3 w-3 text-green-600" /> Quick win: page 1 ranking, low CTR
        </span>
        <span className="flex items-center gap-1.5" title="Impressions ≥ 1000, CTR &lt; 1%">
          <TrendingDown className="h-3 w-3 text-yellow-600" /> CTR gap: high exposure, few clicks
        </span>
        <span className="flex items-center gap-1.5" title="Sessions ≥ 50, bounce &gt; 70%">
          <AlertCircle className="h-3 w-3 text-red-600" /> Bounce: high exit rate
        </span>
        <span className="flex items-center gap-1.5" title="GSC clicks ≥ 10, no GA4 data">
          <RadioTower className="h-3 w-3 text-purple-600" /> Not tracked: clicks without analytics
        </span>
      </div>
    </div>
  );
}
