import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Ga4Chart } from "@/components/ga4/ga4-chart";
import { Ga4FullTable } from "@/components/ga4/ga4-full-table";
import { Ga4Table } from "@/components/ga4/ga4-table";
import { formatNumber, formatPercent, formatDuration } from "@/lib/utils";
import { Users, Eye, TrendingUp, Clock, MousePointerClick } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Ga4Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const where = { upload: { projectId } };

  const [totals, allPages, bySource, byDate] = await Promise.all([
    prisma.ga4Row.aggregate({
      where,
      _sum: { sessions: true, users: true, newUsers: true, pageViews: true, conversions: true },
      _avg: { bounceRate: true, avgSessionDur: true },
      _count: { id: true },
    }),
    prisma.ga4Row.groupBy({
      by: ["pagePath"],
      where: { ...where, pagePath: { not: null } },
      _sum: { sessions: true, users: true, newUsers: true, pageViews: true, conversions: true },
      _avg: { bounceRate: true, avgSessionDur: true },
      orderBy: { _sum: { sessions: "desc" } },
      take: 500,
    }),
    prisma.ga4Row.groupBy({
      by: ["sessionSource", "sessionMedium"],
      where: { ...where, sessionSource: { not: null } },
      _sum: { sessions: true, users: true, conversions: true },
      orderBy: { _sum: { sessions: "desc" } },
      take: 20,
    }),
    prisma.ga4Row.groupBy({
      by: ["date"],
      where: { ...where, date: { not: null } },
      _sum: { sessions: true, users: true, pageViews: true },
      _avg: { bounceRate: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const hasData = totals._count.id > 0;

  const tableRows = allPages.map((r) => ({
    pagePath: r.pagePath ?? "",
    sessions: r._sum.sessions ?? 0,
    users: r._sum.users ?? 0,
    newUsers: r._sum.newUsers ?? 0,
    pageViews: r._sum.pageViews ?? 0,
    bounceRate: r._avg.bounceRate ?? 0,
    avgSessionDur: r._avg.avgSessionDur ?? 0,
    conversions: r._sum.conversions ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9A961" }}>Analytics</p>
        <h1 className="mt-1 text-3xl font-bold" style={{ color: "#0f2f61" }}>GA4 Traffic Data</h1>
        <p className="mt-1 text-sm" style={{ color: "#5d6a80" }}>
          Sessions, users, page views, and conversions for {project.url ?? project.name}
        </p>
      </div>

      {!hasData && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No GA4 data yet. Upload a GA4 export.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Sessions" value={formatNumber(totals._sum.sessions ?? 0)} icon={Users} />
            <StatCard title="Users" value={formatNumber(totals._sum.users ?? 0)} icon={Users} iconColor="#4f6ef7" iconBg="#eef0fe" />
            <StatCard title="Page Views" value={formatNumber(totals._sum.pageViews ?? 0)} icon={Eye} iconColor="#22c55e" iconBg="#dcfce7" />
            <StatCard title="Conversions" value={formatNumber(totals._sum.conversions ?? 0)} icon={MousePointerClick} iconColor="#f97316" iconBg="#ffedd5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard title="Avg. Session Duration" value={formatDuration(totals._avg.avgSessionDur ?? 0)} icon={Clock} iconColor="#a855f7" iconBg="#f3e8ff" />
            <StatCard title="Avg. Bounce Rate" value={formatPercent(totals._avg.bounceRate ?? 0)} icon={TrendingUp} iconColor="#ef4444" iconBg="#fee2e2" />
          </div>

          {byDate.length > 1 && (
            <Card className="border" style={{ borderColor: "#e8edf5" }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: "#0f2f61" }}>Sessions &amp; Users Over Time</CardTitle>
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

          <Card className="border" style={{ borderColor: "#e8edf5" }}>
            <CardHeader>
              <CardTitle className="text-base" style={{ color: "#0f2f61" }}>Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <Ga4FullTable rows={tableRows} />
            </CardContent>
          </Card>

          {bySource.length > 0 && (
            <Card className="border" style={{ borderColor: "#e8edf5" }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: "#0f2f61" }}>Traffic Sources</CardTitle>
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
          )}
        </>
      )}
    </div>
  );
}
