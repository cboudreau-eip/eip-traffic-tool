import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Globe,
  FileText,
  Upload,
  ChevronRight,
  Lightbulb,
  LayoutList,
} from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pages", label: "Pages", icon: LayoutList },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
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
    <div className="space-y-5">
      {/* Single-row: breadcrumb + divider + tabs */}
      <div
        className="px-5 shadow-sm rounded-xl border"
        style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)" }}
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Compact breadcrumb */}
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <Link
              href="/"
              className="hover:underline"
              style={{ color: "var(--clr-muted)" }}
            >
              Projects
            </Link>
            <ChevronRight className="h-3 w-3" style={{ color: "var(--clr-border)" }} />
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: "var(--clr-primary)" }}
              >
                {project.name}
              </a>
            ) : (
              <span className="font-semibold" style={{ color: "var(--clr-primary)" }}>
                {project.name}
              </span>
            )}
          </div>

          {/* Vertical divider */}
          <div className="h-4 w-px shrink-0" style={{ background: "var(--clr-border)" }} />

          {/* Tabs */}
          <nav className="flex items-center overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={`${base}${href}`} label={label}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}
