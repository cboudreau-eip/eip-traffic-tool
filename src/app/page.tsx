import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";
import {
  MousePointerClick,
  Eye,
  Users,
  TrendingUp,
  Upload,
  FileSpreadsheet,
  Globe,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const FILE_TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "outline"> = {
  gsc: "default",
  ga4: "success",
  sitemap: "secondary",
  custom: "outline",
};

const FILE_TYPE_LABELS: Record<string, string> = {
  gsc: "Search Console",
  ga4: "GA4",
  sitemap: "Sitemap",
  custom: "Custom",
};

export default async function DashboardPage() {
  const [uploads, gscTotals, ga4Totals] = await Promise.all([
    prisma.upload.findMany({ orderBy: { uploadedAt: "desc" }, take: 5 }),
    prisma.gscRow.aggregate({
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
    }),
    prisma.ga4Row.aggregate({
      _sum: { sessions: true, users: true, pageViews: true },
      _avg: { bounceRate: true },
    }),
  ]);

  const totalClicks = gscTotals._sum.clicks ?? 0;
  const totalImpressions = gscTotals._sum.impressions ?? 0;
  const avgCtr = gscTotals._avg.ctr ?? 0;
  const avgPosition = gscTotals._avg.position ?? 0;
  const totalSessions = ga4Totals._sum.sessions ?? 0;
  const totalUsers = ga4Totals._sum.users ?? 0;

  const hasData = uploads.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your web traffic and search performance
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            Upload Data
          </Link>
        </Button>
      </div>

      {!hasData && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Upload className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Upload your Google Search Console exports, GA4 reports, or sitemaps to get started.
          </p>
          <Button asChild className="mt-6">
            <Link href="/upload">Get started</Link>
          </Button>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Clicks"
              value={formatNumber(totalClicks)}
              icon={MousePointerClick}
              iconColor="text-orange-500"
            />
            <StatCard
              title="Impressions"
              value={formatNumber(totalImpressions)}
              icon={Eye}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Avg. CTR"
              value={formatPercent(avgCtr)}
              icon={TrendingUp}
              iconColor="text-green-500"
            />
            <StatCard
              title="Avg. Position"
              value={avgPosition > 0 ? avgPosition.toFixed(1) : "—"}
              icon={Globe}
              iconColor="text-purple-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Sessions"
              value={formatNumber(totalSessions)}
              icon={Users}
              iconColor="text-orange-500"
            />
            <StatCard
              title="Users"
              value={formatNumber(totalUsers)}
              icon={Users}
              iconColor="text-indigo-500"
            />
            <StatCard
              title="Page Views"
              value={formatNumber(ga4Totals._sum.pageViews ?? 0)}
              icon={Eye}
              iconColor="text-teal-500"
            />
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Uploads</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/upload" className="flex items-center gap-1 text-xs text-gray-500">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No uploads yet.</p>
          ) : (
            <div className="space-y-2">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{u.filename}</p>
                    <p className="text-xs text-gray-500">
                      {u.rowCount.toLocaleString()} rows &middot;{" "}
                      {formatDistanceToNow(u.uploadedAt, { addSuffix: true })}
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
