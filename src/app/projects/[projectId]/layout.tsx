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
    <div className="space-y-6">
      {/* Project breadcrumb + sub-nav */}
      <div className="bg-white px-6 shadow-sm rounded-xl border" style={{ borderColor: "#e8edf5" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b py-3 text-xs" style={{ borderColor: "#eef1f6" }}>
          <Link href="/" className="hover:text-[#0f2f61]" style={{ color: "#5d6a80" }}>
            Projects
          </Link>
          <ChevronRight className="h-3 w-3" style={{ color: "#b9c2d0" }} />
          <span className="font-medium" style={{ color: "#0f2f61" }}>{project.name}</span>
          {project.url && (
            <>
              <ChevronRight className="h-3 w-3" style={{ color: "#b9c2d0" }} />
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "#C9A961" }}
              >
                {project.url}
              </a>
            </>
          )}
        </div>

        {/* Sub-nav — underline tab style */}
        <nav className="flex items-center gap-5 overflow-x-auto pt-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              href={`${base}${href}`}
              label={label}
              icon={Icon}
            />
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
