import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Globe, Link2, Calendar, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SitemapPage() {
  const [count, urls, byChangefreq] = await Promise.all([
    prisma.sitemapUrl.count(),
    prisma.sitemapUrl.findMany({ take: 200, orderBy: { priority: "desc" } }),
    prisma.sitemapUrl.groupBy({
      by: ["changefreq"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  const hasData = count > 0;
  const withLastmod = urls.filter((u) => u.lastmod).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sitemap</h1>
        <p className="mt-1 text-sm text-gray-500">
          URL inventory from your uploaded sitemaps
        </p>
      </div>

      {!hasData && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No sitemap data yet. Upload an XML sitemap to get started.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total URLs" value={count.toLocaleString()} icon={Globe} />
            <StatCard title="With Last Modified" value={withLastmod.toLocaleString()} icon={Calendar} iconColor="text-blue-500" />
            <StatCard title="Change Frequencies" value={byChangefreq.length.toString()} icon={Link2} iconColor="text-green-500" />
          </div>

          {byChangefreq.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Frequency Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {byChangefreq.map((b) => (
                    <div key={b.changefreq ?? "none"} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                      <p className="text-sm font-semibold text-gray-900">{b._count.id}</p>
                      <p className="text-xs text-gray-500 capitalize">{b.changefreq ?? "unset"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">URL List ({Math.min(200, count)} of {count})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">URL</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Last Modified</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Change Freq</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {urls.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="max-w-sm truncate px-4 py-2.5 text-xs text-blue-600 hover:underline">
                          <a href={u.loc} target="_blank" rel="noopener noreferrer">{u.loc}</a>
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-gray-500">{u.lastmod ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right text-xs capitalize text-gray-500">{u.changefreq ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-gray-500">{u.priority ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
