import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Globe, Link2, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SitemapPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const where = { upload: { projectId } };

  const [count, urls, byChangefreq] = await Promise.all([
    prisma.sitemapUrl.count({ where }),
    prisma.sitemapUrl.findMany({ where, take: 200, orderBy: { priority: "desc" } }),
    prisma.sitemapUrl.groupBy({ by: ["changefreq"], where, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
  ]);

  const withLastmod = urls.filter((u) => u.lastmod).length;
  const hasData = count > 0;

  return (
    <div className="space-y-8">
      {!hasData && (
        <div
          className="rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--clr-muted)" }}>No sitemap data yet. Upload an XML sitemap.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total URLs" value={count.toLocaleString()} icon={Globe} />
            <StatCard title="With Last Modified" value={withLastmod.toLocaleString()} icon={Calendar} iconColor="var(--md-secondary)" iconBg="var(--md-secondary-container)" />
            <StatCard title="Change Frequencies" value={byChangefreq.length.toString()} icon={Link2} iconColor="var(--md-success)" iconBg="var(--md-success-container)" />
          </div>

          {byChangefreq.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Change Frequency Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {byChangefreq.map((b) => (
                    <div
                      key={b.changefreq ?? "none"}
                      className="rounded-lg border px-4 py-3 text-center"
                      style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface-2)" }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "var(--clr-primary)" }}>{b._count.id}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--clr-muted)" }}>{b.changefreq ?? "unset"}</p>
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
                    <tr style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface-2)" }}>
                      <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--clr-muted)" }}>URL</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Last Modified</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Change Freq</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: "var(--clr-muted)" }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((u) => (
                      <tr key={u.id} className="row-hover transition-colors" style={{ borderBottom: "1px solid var(--clr-border-2)" }}>
                        <td className="max-w-sm truncate px-4 py-2.5 text-xs text-md-secondary hover:underline">
                          <a href={u.loc} target="_blank" rel="noopener noreferrer">{u.loc}</a>
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-muted)" }}>{u.lastmod ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right text-xs capitalize" style={{ color: "var(--clr-muted)" }}>{u.changefreq ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right text-xs" style={{ color: "var(--clr-muted)" }}>{u.priority ?? "—"}</td>
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
