import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Globe,
  FileText,
  Upload,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gsc", label: "Search Console", icon: Search },
  { href: "/ga4", label: "Analytics", icon: BarChart3 },
  { href: "/sitemap", label: "Sitemap", icon: Globe },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/upload", label: "Upload", icon: Upload },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const base = `/projects/${projectId}`;

  return (
    <div className="space-y-6">
      {/* Project breadcrumb + sub-nav */}
      <div className="rounded-xl border border-gray-200 bg-white px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-gray-100 py-3 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-900">Projects</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-gray-900">{project.name}</span>
          {project.url && (
            <>
              <ChevronRight className="h-3 w-3" />
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                {project.url}
              </a>
            </>
          )}
        </div>

        {/* Sub-nav */}
        <nav className="flex items-center gap-1 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`${base}${href}`}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
