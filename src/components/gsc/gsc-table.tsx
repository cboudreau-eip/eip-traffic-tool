"use client";

import { formatNumber, formatPercent } from "@/lib/utils";

interface GscTableRow {
  label: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function GscTable({ rows, labelHeader }: { rows: GscTableRow[]; labelHeader: string }) {
  if (!rows.length) return (
    <p className="px-6 py-8 text-center text-sm" style={{ color: "var(--clr-muted)" }}>No data.</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface-2)" }}>
            <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--clr-muted)" }}>{labelHeader}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Clicks</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Impressions</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>CTR</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="row-hover transition-colors"
              style={{ borderBottom: "1px solid var(--clr-border-2)" }}
            >
              <td className="max-w-xs truncate px-4 py-2.5 text-xs" style={{ color: "var(--clr-secondary)" }} title={row.label}>
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-primary)" }}>
                {formatNumber(row.clicks)}
              </td>
              <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                {formatNumber(row.impressions)}
              </td>
              <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                {formatPercent(row.ctr)}
              </td>
              <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-secondary)" }}>
                {row.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
