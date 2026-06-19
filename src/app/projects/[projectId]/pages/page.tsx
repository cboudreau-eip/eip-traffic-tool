import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PagesTable, type PageRow } from "@/components/pages/pages-table";
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

  // Two most recent GSC uploads
  const gscUploads = await prisma.upload.findMany({
    where: { projectId, fileType: "gsc" },
    orderBy: { uploadedAt: "desc" },
    take: 2,
    select: { id: true, uploadedAt: true, filename: true },
  });

  if (gscUploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <FileSearch className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">No GSC data yet</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
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

  const [current, previous] = gscUploads;

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

  // Most recent GA4 upload for sessions
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

  // Build lookup maps
  const prevMap = new Map(previousPages.map((p) => [p.page, p]));

  // GA4 keyed by both full URL and path for flexible matching
  const ga4ByPath = new Map<string, number>();
  for (const g of ga4Pages) {
    if (!g.pagePath) continue;
    ga4ByPath.set(g.pagePath, (g._sum.sessions ?? 0));
    // Also store by path without leading slash variants
    const withSlash = g.pagePath.startsWith("/") ? g.pagePath : "/" + g.pagePath;
    ga4ByPath.set(withSlash, (g._sum.sessions ?? 0));
  }

  const rows: PageRow[] = currentPages
    .filter((p) => p.page)
    .map((p) => {
      const page = p.page!;
      const prev = prevMap.get(page);
      const path = toPath(page);

      // Try matching GA4 by full URL, then by path
      const sessions =
        ga4ByPath.get(page) ??
        ga4ByPath.get(path) ??
        null;

      return {
        page,
        isNew: !prev,
        clicks: p._sum.clicks ?? 0,
        impressions: p._sum.impressions ?? 0,
        ctr: p._avg.ctr ?? 0,
        position: p._avg.position ?? 0,
        sessions,
        prevClicks: prev ? (prev._sum.clicks ?? 0) : null,
        prevImpressions: prev ? (prev._sum.impressions ?? 0) : null,
        prevCtr: prev ? (prev._avg.ctr ?? 0) : null,
        prevPosition: prev ? (prev._avg.position ?? 0) : null,
      };
    });

  const newCount = rows.filter((r) => r.isNew).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {previous ? (
              <>
                Comparing <span className="font-medium text-gray-700">{current.filename}</span>{" "}
                vs <span className="font-medium text-gray-700">{previous.filename}</span>
                {newCount > 0 && (
                  <span className="ml-2 inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                    {newCount} new
                  </span>
                )}
              </>
            ) : (
              <>
                {current.filename} · {format(new Date(current.uploadedAt), "MMM d, yyyy")} ·{" "}
                <span className="text-orange-500">Upload again next week to see changes</span>
              </>
            )}
          </p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{rows.length} pages</p>
          {previous && (
            <p className="mt-0.5">
              Last upload {format(new Date(current.uploadedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      <PagesTable
        rows={rows}
        hasComparison={!!previous}
        currentUploadId={current.id}
      />
    </div>
  );
}
