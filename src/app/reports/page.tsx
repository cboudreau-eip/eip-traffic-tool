import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/utils";
import { FileText, TrendingUp, Search, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [gscTotals, ga4Totals, topQueries, topPages, sitemapCount, uploadCount] =
    await Promise.all([
      prisma.gscRow.aggregate({
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true },
        _count: { id: true },
      }),
      prisma.ga4Row.aggregate({
        _sum: { sessions: true, users: true, pageViews: true, conversions: true },
        _avg: { bounceRate: true, avgSessionDur: true },
        _count: { id: true },
      }),
      prisma.gscRow.groupBy({
        by: ["query"],
        where: { query: { not: null } },
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true },
        orderBy: { _sum: { clicks: "desc" } },
        take: 10,
      }),
      prisma.gscRow.groupBy({
        by: ["page"],
        where: { page: { not: null } },
        _sum: { clicks: true, impressions: true },
        orderBy: { _sum: { clicks: "desc" } },
        take: 10,
      }),
      prisma.sitemapUrl.count(),
      prisma.upload.count(),
    ]);

  const hasAnyData = gscTotals._count.id > 0 || ga4Totals._count.id > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Summary report across all your uploaded data</p>
        </div>
        <Badge variant="secondary">{uploadCount} files uploaded</Badge>
      </div>

      {!hasAnyData && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">Upload data first to generate reports.</p>
        </div>
      )}

      {hasAnyData && (
        <div className="space-y-6">
          {gscTotals._count.id > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Search className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base">Search Console Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total Clicks", value: formatNumber(gscTotals._sum.clicks ?? 0) },
                    { label: "Total Impressions", value: formatNumber(gscTotals._sum.impressions ?? 0) },
                    { label: "Avg. CTR", value: formatPercent(gscTotals._avg.ctr ?? 0) },
                    { label: "Avg. Position", value: (gscTotals._avg.position ?? 0).toFixed(1) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                {topQueries.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Top 10 Queries
                    </p>
                    <div className="space-y-2">
                      {topQueries.map((q, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-5 shrink-0 text-xs text-gray-400">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                            {q.query}
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {formatNumber(q._sum.clicks ?? 0)} clicks
                          </span>
                          <span className="text-xs text-gray-400">
                            pos {(q._avg.position ?? 0).toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {ga4Totals._count.id > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <CardTitle className="text-base">GA4 Analytics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Sessions", value: formatNumber(ga4Totals._sum.sessions ?? 0) },
                    { label: "Users", value: formatNumber(ga4Totals._sum.users ?? 0) },
                    { label: "Page Views", value: formatNumber(ga4Totals._sum.pageViews ?? 0) },
                    { label: "Conversions", value: formatNumber(ga4Totals._sum.conversions ?? 0) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {sitemapCount > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Globe className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base">Sitemap Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Total Indexed URLs</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{sitemapCount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
