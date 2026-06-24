import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PagesTable, type PageRow } from "@/components/pages/pages-table";
import { CrossRefTable, type CrossRefRow } from "@/components/pages/cross-ref-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function toPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export default async function PagesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  // Two most recent GSC uploads for comparison view
  const gscUploads = await prisma.upload.findMany({
    where: { projectId, fileType: "gsc" },
    orderBy: { uploadedAt: "desc" },
    take: 2,
    select: { id: true, uploadedAt: true, filename: true },
  });

  // Cross-reference: all pages from ALL uploads, aggregated
  const [allGscPages, allGa4Pages] = await Promise.all([
    prisma.gscRow.groupBy({
      by: ["page"],
      where: { upload: { projectId }, page: { not: null } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: "desc" } },
      take: 500,
    }),
    prisma.ga4Row.groupBy({
      by: ["pagePath"],
      where: { upload: { projectId }, pagePath: { not: null } },
      _sum: { sessions: true, users: true },
      _avg: { bounceRate: true },
      orderBy: { _sum: { sessions: "desc" } },
      take: 500,
    }),
  ]);

  // Build cross-reference map: normalize GSC full URLs to paths, merge with GA4
  const crossRefMap = new Map<string, CrossRefRow>();

  for (const g of allGscPages) {
    const path = toPath(g.page ?? "");
    crossRefMap.set(path, {
      page: path,
      clicks:      g._sum.clicks ?? 0,
      impressions: g._sum.impressions ?? 0,
      ctr:         g._avg.ctr ?? 0,
      position:    g._avg.position ?? 0,
      sessions:    0,
      users:       0,
      bounceRate:  0,
      hasGsc: true,
      hasGa4: false,
    });
  }

  for (const g of allGa4Pages) {
    const raw  = g.pagePath ?? "";
    const path = raw.startsWith("/") ? raw : "/" + raw;
    const existing = crossRefMap.get(path);
    if (existing) {
      existing.sessions   = g._sum.sessions ?? 0;
      existing.users      = g._sum.users ?? 0;
      existing.bounceRate = g._avg.bounceRate ?? 0;
      existing.hasGa4     = true;
    } else {
      crossRefMap.set(path, {
        page:        path,
        clicks:      0,
        impressions: 0,
        ctr:         0,
        position:    0,
        sessions:    g._sum.sessions ?? 0,
        users:       g._sum.users ?? 0,
        bounceRate:  g._avg.bounceRate ?? 0,
        hasGsc: false,
        hasGa4: true,
      });
    }
  }

  const crossRefRows = Array.from(crossRefMap.values());
  const hasCrossRefData = allGscPages.length > 0 || allGa4Pages.length > 0;

  // If no GSC data at all, show empty state
  if (gscUploads.length === 0 && !hasCrossRefData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-24 text-center"
        style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <FileSearch className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold" style={{ color: "var(--clr-primary)" }}>No GSC data yet</h2>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--clr-muted)" }}>
          Upload a Google Search Console export to see per-page traffic data.
        </p>
        <Link
          href={`/projects/${projectId}/upload`}
          className="mt-5 inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Upload data
        </Link>
      </div>
    );
  }

  // Fetch comparison data for the GSC upload comparison view
  let rows: PageRow[] = [];
  let current = gscUploads[0];
  let previous = gscUploads[1];
  let newCount = 0;

  if (current) {
    const [currentPages, previousPages] = await Promise.all([
      prisma.gscRow.groupBy({
        by: ["page"],
        where: { uploadId: current.id, page: { not: null } },
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true },
        orderBy: { _sum: { clicks: "desc" } },
        take: 1000,
      }),
      previous
        ? prisma.gscRow.groupBy({
            by: ["page"],
            where: { uploadId: previous.id, page: { not: null } },
            _sum: { clicks: true, impressions: true },
            _avg: { ctr: true, position: true },
          })
        : Promise.resolve([]),
    ]);

    const ga4Upload = await prisma.upload.findFirst({
      where: { projectId, fileType: "ga4" },
      orderBy: { uploadedAt: "desc" },
      select: { id: true },
    });

    const ga4Pages = ga4Upload
      ? await prisma.ga4Row.groupBy({
          by: ["pagePath"],
          where: { uploadId: ga4Upload.id, pagePath: { not: null } },
          _sum: { sessions: true },
        })
      : [];

    const prevMap = new Map(previousPages.map((p) => [p.page, p]));
    const ga4ByPath = new Map<string, number>();
    for (const g of ga4Pages) {
      if (!g.pagePath) continue;
      ga4ByPath.set(g.pagePath, g._sum.sessions ?? 0);
      const withSlash = g.pagePath.startsWith("/") ? g.pagePath : "/" + g.pagePath;
      ga4ByPath.set(withSlash, g._sum.sessions ?? 0);
    }

    rows = currentPages
      .filter((p) => p.page)
      .map((p) => {
        const page = p.page!;
        const prev = prevMap.get(page);
        const path = toPath(page);
        const sessions = ga4ByPath.get(page) ?? ga4ByPath.get(path) ?? null;
        return {
          page,
          isNew: !prev,
          clicks:      p._sum.clicks ?? 0,
          impressions: p._sum.impressions ?? 0,
          ctr:         p._avg.ctr ?? 0,
          position:    p._avg.position ?? 0,
          sessions,
          prevClicks:      prev ? (prev._sum.clicks ?? 0)      : null,
          prevImpressions: prev ? (prev._sum.impressions ?? 0) : null,
          prevCtr:         prev ? (prev._avg.ctr ?? 0)         : null,
          prevPosition:    prev ? (prev._avg.position ?? 0)    : null,
        };
      });

    newCount = rows.filter((r) => r.isNew).length;
  }

  return (
    <div className="space-y-8">
      {/* Upload comparison view — only show when there are 2+ GSC uploads to compare */}
      {current && previous && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--clr-secondary)" }}>
            <p>
              Comparing <span className="font-medium" style={{ color: "var(--clr-primary)" }}>{current.filename}</span>{" "}
              vs <span className="font-medium" style={{ color: "var(--clr-primary)" }}>{previous.filename}</span>
              {newCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                  {newCount} new
                </span>
              )}
            </p>
            <div className="text-right">
              <p>{rows.length} pages</p>
              <p className="mt-0.5">Last upload {format(new Date(current.uploadedAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <PagesTable rows={rows} hasComparison currentUploadId={current.id} />
        </div>
      )}

      {/* Cross-reference table */}
      {hasCrossRefData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GSC + GA4 Cross-Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs" style={{ color: "var(--clr-muted)" }}>
              All pages across all your uploads — showing which pages appear in Search Console, Google Analytics, or both.
              Pages that appear only in GA4 have analytics traffic but no search presence. Pages only in GSC have search impressions but no analytics data.
            </p>
            <CrossRefTable rows={crossRefRows} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
