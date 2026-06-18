import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus, FileSpreadsheet, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewProjectButton } from "@/components/projects/new-project-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { uploads: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a project to view its traffic data
          </p>
        </div>
        <NewProjectButton />
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Globe className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No projects yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Create a project for each website you want to track.
          </p>
          <NewProjectButton className="mt-6" />
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="group h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                      <Globe className="h-5 w-5 text-orange-500" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-orange-500" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.url && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">{p.url}</p>
                    )}
                    {p.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      {p._count.uploads} upload{p._count.uploads !== 1 ? "s" : ""}
                    </div>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
