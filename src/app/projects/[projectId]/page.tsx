import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";
import { MousePointerClick, Eye, Users, TrendingUp, Upload, FileSpreadsheet, Globe, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const FILE_TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "outline"> = {
  gsc: "default", ga4: "success", sitemap: "secondary", custom: "outline",
};
const FILE_TYPE_LABELS: Record<string, string> = {
  gsc: "Search Console", ga4: "GA4", sitemap: "Sitemap", custom: "Custom",
};

export default async function ProjectDashboard({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const uploadWhere = { projectId };
  const gscWhere = { upload: { projectId } };
  const ga4Where = { upload: { projectId } };

  const [uploads, gscTotals, ga4Totals] = await Promise.all([
    prisma.upload.findMany({ where: uploadWhere, orderBy: { uploadedAt: "desc" }, take: 5 }),
    prisma.gscRow.aggregate({ where: gscWhere, _sum: { clicks: true, impressions: true }, _avg: { ctr: true, position: true } }),
    prisma.ga4Row.aggregate({ where: ga4Where, _sum: { sessions: true, users: true, pageViews: true }, _avg: { bounceRate: true } }),
  ]);

  const hasData = uploads.length > 0;
  const base = `/projects/${projectId}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clr-gold)" }}>Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold" style={{ color: "var(--clr-primary)" }}>{project.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--clr-secondary)" }}>Traffic overview for this project</p>
        </div>
        <Button asChild>
          <Link href={`${base}/upload`}>
            <Upload className="h-4 w-4" />
            Upload Data
          </Link>
        </Button>
      </div>

      {!hasData && (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-md-primary-container">
            <Upload className="h-6 w-6 text-md-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold" style={{ color: "var(--clr-primary)" }}>No data yet</h2>
          <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--clr-muted)" }}>
            Upload GSC exports, GA4 reports, or sitemaps to get started.
          </p>
          <Button asChild className="mt-6">
            <Link href={`${base}/upload`}>Upload data</Link>
          </Button>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Clicks" value={formatNumber(gscTotals._sum.clicks ?? 0)} icon={MousePointerClick} />
            <StatCard title="Impressions" value={formatNumber(gscTotals._sum.impressions ?? 0)} icon={Eye} iconColor="var(--md-on-secondary-container)" iconBg="var(--md-secondary-container)" />
            <StatCard title="Avg. CTR" value={formatPercent(gscTotals._avg.ctr ?? 0)} icon={TrendingUp} iconColor="var(--md-on-success-container)" iconBg="var(--md-success-container)" />
            <StatCard title="Avg. Position" value={(gscTotals._avg.position ?? 0) > 0 ? (gscTotals._avg.position ?? 0).toFixed(1) : "—"} icon={Globe} iconColor="var(--md-on-primary-container)" iconBg="var(--md-primary-container)" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Sessions" value={formatNumber(ga4Totals._sum.sessions ?? 0)} icon={Users} />
            <StatCard title="Users" value={formatNumber(ga4Totals._sum.users ?? 0)} icon={Users} iconColor="var(--md-on-tertiary-container)" iconBg="var(--md-tertiary-container)" />
            <StatCard title="Page Views" value={formatNumber(ga4Totals._sum.pageViews ?? 0)} icon={Eye} iconColor="var(--md-on-secondary-container)" iconBg="var(--md-secondary-container)" />
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Uploads</CardTitle>
          <Link
            href={`${base}/upload`}
            className="flex items-center gap-1 text-xs transition-colors hover:text-md-primary"
            style={{ color: "var(--clr-muted)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--clr-muted)" }}>No uploads yet.</p>
          ) : (
            <div className="space-y-2">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--clr-border-2)", background: "var(--clr-surface-2)" }}
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" style={{ color: "var(--clr-muted)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--clr-primary)" }}>{u.filename}</p>
                    <p className="text-xs" style={{ color: "var(--clr-muted)" }}>
                      {u.rowCount.toLocaleString()} rows · {formatDistanceToNow(u.uploadedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={FILE_TYPE_COLORS[u.fileType] ?? "outline"}>
                    {FILE_TYPE_LABELS[u.fileType] ?? u.fileType}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
