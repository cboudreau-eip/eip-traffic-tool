import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DropZone } from "@/components/upload/drop-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DeleteUploadButton } from "@/components/upload/delete-button";

export const dynamic = "force-dynamic";

const FILE_TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "outline"> = {
  gsc: "default", ga4: "success", sitemap: "secondary", custom: "outline",
};
const FILE_TYPE_LABELS: Record<string, string> = {
  gsc: "Search Console", ga4: "GA4 Analytics", sitemap: "Sitemap", custom: "Custom",
};

export default async function UploadPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const uploads = await prisma.upload.findMany({
    where: { projectId },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported File Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Google Search Console", desc: "Query, page, clicks, impressions, CTR, position", ext: ".xlsx .csv" },
              { label: "GA4 Analytics", desc: "Sessions, users, page views, bounce rate, conversions", ext: ".xlsx .csv" },
              { label: "XML Sitemap", desc: "URLs, last modified, change frequency, priority", ext: ".xml" },
              { label: "Custom Spreadsheet", desc: "Any xlsx, xls, csv, or tsv file", ext: ".xlsx .xls .csv .tsv" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--clr-border)", background: "var(--clr-surface-2)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--clr-primary)" }}>{item.label}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--clr-muted)" }}>{item.desc}</p>
                <p className="mt-2 font-mono text-xs text-orange-500">{item.ext}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <DropZone projectId={projectId} />
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Uploads ({uploads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="row-hover flex items-center gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--clr-border-2)" }}
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
                  <DeleteUploadButton id={u.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
