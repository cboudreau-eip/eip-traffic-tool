import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Ga4Chart } from "@/components/ga4/ga4-chart";
import { Ga4Table } from "@/components/ga4/ga4-table";
import { formatNumber, formatPercent, formatDuration } from "@/lib/utils";
import { Users, Eye, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Ga4Page() {
  const [totals, topPages, bySource, byDate] = await Promise.all([
    prisma.ga4Row.aggregate({
      _sum: { sessions: true, users: true, newUsers: true, pageViews: true, conversions: true },
      _avg: { bounceRate: true, avgSessionDur: true },
      _count: { id: true },
    }),
    prisma.ga4Row.groupBy({
      by: ["pagePath"],
      where: { pagePath: { not: null } },
      _sum: { sessions: true, users: true, pageViews: true },
      _avg: { bounceRate: true },
      orderBy: { _sum: { sessions: "desc" } },
      take: 50,
    }),
    prisma.ga4Row.groupBy({
      by: ["sessionSource", "sessionMedium"],
      where: { sessionSource: { not: null } },
      _sum: { sessions: true, users: true, conversions: true },
      orderBy: { _sum: { sessions: "desc" } },
      take: 20,
    }),
    prisma.ga4Row.groupBy({
      by: ["date"],
      where: { date: { not: null } },
      _sum: { sessions: true, users: true, pageViews: true },
      _avg: { bounceRate: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const hasData = totals._count.id > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GA4 Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sessions, users, page views, and conversion data
        </p>
      </div>

      {!hasData && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No GA4 data yet. Upload a GA4 export to get started.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Sessions" value={formatNumber(totals._sum.sessions ?? 0)} icon={Users} />
            <StatCard title="Users" value={formatNumber(totals._sum.users ?? 0)} icon={Users} iconColor="text-blue-500" />
            <StatCard title="Page Views" value={formatNumber(totals._sum.pageViews ?? 0)} icon={Eye} iconColor="text-green-500" />
            <StatCard title="Bounce Rate" value={formatPercent(totals._avg.bounceRate ?? 0)} icon={TrendingUp} iconColor="text-red-500" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard title="Avg. Session Duration" value={formatDuration(totals._avg.avgSessionDur ?? 0)} icon={Clock} iconColor="text-purple-500" />
            <StatCard title="Conversions" value={formatNumber(totals._sum.conversions ?? 0)} icon={TrendingUp} iconColor="text-orange-500" />
          </div>

          {byDate.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions &amp; Users Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Ga4Chart
                  data={byDate.map((d) => ({
                    date: d.date ?? "",
                    sessions: d._sum.sessions ?? 0,
                    users: d._sum.users ?? 0,
                    pageViews: d._sum.pageViews ?? 0,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Ga4Table
                  rows={topPages.map((r) => ({
                    label: r.pagePath ?? "",
                    sessions: r._sum.sessions ?? 0,
                    users: r._sum.users ?? 0,
                    pageViews: r._sum.pageViews ?? 0,
                    bounceRate: r._avg.bounceRate ?? 0,
                  }))}
                  labelHeader="Page Path"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Ga4Table
                  rows={bySource.map((r) => ({
                    label: `${r.sessionSource ?? "direct"} / ${r.sessionMedium ?? "none"}`,
                    sessions: r._sum.sessions ?? 0,
                    users: r._sum.users ?? 0,
                    pageViews: 0,
                    bounceRate: 0,
                    conversions: r._sum.conversions ?? 0,
                  }))}
                  labelHeader="Source / Medium"
                  showConversions
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
