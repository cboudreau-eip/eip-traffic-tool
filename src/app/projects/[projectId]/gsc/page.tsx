import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GscTable } from "@/components/gsc/gsc-table";
import { GscChart } from "@/components/gsc/gsc-chart";
import { UploadTrendChart } from "@/components/dashboard/upload-trend-chart";
import { formatNumber, formatPercent } from "@/lib/utils";
import { MousePointerClick, Eye, TrendingUp, Globe } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function GscPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const where = { upload: { projectId } };

  const [totals, topQueries, topPages, clicksByDate, gscUploads, gscUploadTotals] = await Promise.all([
    prisma.gscRow.aggregate({ where, _sum: { clicks: true, impressions: true }, _avg: { ctr: true, position: true }, _count: { id: true } }),
    prisma.gscRow.groupBy({ by: ["query"], where: { ...where, query: { not: null } }, _sum: { clicks: true, impressions: true }, _avg: { ctr: true, position: true }, orderBy: { _sum: { clicks: "desc" } }, take: 50 }),
    prisma.gscRow.groupBy({ by: ["page"], where: { ...where, page: { not: null } }, _sum: { clicks: true, impressions: true }, _avg: { ctr: true, position: true }, orderBy: { _sum: { clicks: "desc" } }, take: 50 }),
    prisma.gscRow.groupBy({ by: ["date"], where: { ...where, date: { not: null } }, _sum: { clicks: true, impressions: true }, _avg: { ctr: true }, orderBy: { date: "asc" } }),
    prisma.upload.findMany({ where: { projectId, fileType: "gsc" }, orderBy: { uploadedAt: "asc" }, select: { id: true, uploadedAt: true, filename: true } }),
    prisma.gscRow.groupBy({ by: ["uploadId"], where, _sum: { clicks: true, impressions: true } }),
  ]);

  const hasData = totals._count.id > 0;

  // Build per-upload trend data
  const totalsByUploadId = new Map(gscUploadTotals.map((t) => [t.uploadId, t]));
  const trendData = gscUploads.map((u) => ({
    label: format(u.uploadedAt, "MMM d ''yy"),
    clicks: totalsByUploadId.get(u.id)?._sum.clicks ?? 0,
    impressions: totalsByUploadId.get(u.id)?._sum.impressions ?? 0,
  }));

  return (
    <div className="space-y-8">
      {!hasData && (
        <div
          className="rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--clr-muted)" }}>No GSC data yet. Upload a Search Console export.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Clicks" value={formatNumber(totals._sum.clicks ?? 0)} icon={MousePointerClick} />
            <StatCard title="Impressions" value={formatNumber(totals._sum.impressions ?? 0)} icon={Eye} iconColor="#3b82f6" iconBg="#eff6ff" />
            <StatCard title="Avg. CTR" value={formatPercent(totals._avg.ctr ?? 0)} icon={TrendingUp} iconColor="#22c55e" iconBg="#dcfce7" />
            <StatCard title="Avg. Position" value={(totals._avg.position ?? 0).toFixed(1)} icon={Globe} iconColor="#a855f7" iconBg="#f3e8ff" />
          </div>

          {trendData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance by Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs" style={{ color: "var(--clr-muted)" }}>
                  Total clicks and impressions per export — showing how your site&apos;s search presence has changed over time.
                </p>
                <UploadTrendChart
                  data={trendData}
                  bars={[
                    { key: "clicks",      name: "Clicks",      color: "#1a4480" },
                    { key: "impressions", name: "Impressions",  color: "#C9A961" },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {clicksByDate.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Clicks &amp; Impressions Over Time</CardTitle></CardHeader>
              <CardContent>
                <GscChart data={clicksByDate.map((d) => ({ date: d.date ?? "", clicks: d._sum.clicks ?? 0, impressions: d._sum.impressions ?? 0, ctr: (d._avg.ctr ?? 0) * 100 }))} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Queries</CardTitle></CardHeader>
              <CardContent className="p-0">
                <GscTable rows={topQueries.map((r) => ({ label: r.query ?? "", clicks: r._sum.clicks ?? 0, impressions: r._sum.impressions ?? 0, ctr: r._avg.ctr ?? 0, position: r._avg.position ?? 0 }))} labelHeader="Query" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
              <CardContent className="p-0">
                <GscTable rows={topPages.map((r) => ({ label: r.page ?? "", clicks: r._sum.clicks ?? 0, impressions: r._sum.impressions ?? 0, ctr: r._avg.ctr ?? 0, position: r._avg.position ?? 0 }))} labelHeader="Page" />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
