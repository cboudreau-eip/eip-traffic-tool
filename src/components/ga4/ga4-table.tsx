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
  if (!rows.length) return <p className="px-6 py-8 text-center text-sm text-gray-400">No data.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{labelHeader}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Sessions</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Users</th>
            {!showConversions && (
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Bounce</th>
            )}
            {showConversions && (
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Conv.</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="max-w-xs truncate px-4 py-2.5 text-xs text-gray-700" title={row.label}>
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-900">
                {formatNumber(row.sessions)}
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                {formatNumber(row.users)}
              </td>
              {!showConversions && (
                <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                  {formatPercent(row.bounceRate)}
                </td>
              )}
              {showConversions && (
                <td className="px-4 py-2.5 text-right text-xs text-gray-500">
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
