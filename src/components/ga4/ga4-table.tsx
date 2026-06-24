"use client";

import { formatNumber, formatPercent } from "@/lib/utils";

interface Ga4TableRow {
  label: string;
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
  conversions?: number;
}

export function Ga4Table({
  rows,
  labelHeader,
  showConversions,
}: {
  rows: Ga4TableRow[];
  labelHeader: string;
  showConversions?: boolean;
}) {
  if (!rows.length) return (
    <p className="px-6 py-8 text-center text-sm" style={{ color: "var(--clr-muted)" }}>No data.</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface-2)" }}>
            <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--clr-muted)" }}>{labelHeader}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Sessions</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Users</th>
            {!showConversions && (
              <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Bounce</th>
            )}
            {showConversions && (
              <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Conv.</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--clr-border-2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clr-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <td className="max-w-xs truncate px-4 py-2.5 text-xs" style={{ color: "var(--clr-secondary)" }} title={row.label}>
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-primary)" }}>
                {formatNumber(row.sessions)}
              </td>
              <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                {formatNumber(row.users)}
              </td>
              {!showConversions && (
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                  {formatPercent(row.bounceRate)}
                </td>
              )}
              {showConversions && (
                <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                  {formatNumber(row.conversions ?? 0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
