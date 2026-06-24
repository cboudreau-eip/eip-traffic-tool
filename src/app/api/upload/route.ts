import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const GSC_FIELD_MAP: Record<string, string> = {
  query: "query",
  "top queries": "query",
  page: "page",
  "top pages": "page",
  toppages: "page",
  "landing page": "page",
  country: "country",
  device: "device",
  clicks: "clicks",
  impressions: "impressions",
  ctr: "ctr",
  "click through rate": "ctr",
  position: "position",
  "average position": "position",
  date: "date",
};

const GA4_FIELD_MAP: Record<string, string> = {
  date: "date",
  // page path variants
  "page path": "pagePath",
  pagepath: "pagePath",
  "landing page": "pagePath",
  landingpage: "pagePath",
  // page title
  "page title": "pageTitle",
  pagetitle: "pageTitle",
  // session source/medium
  "session source": "sessionSource",
  sessionsource: "sessionSource",
  "session medium": "sessionMedium",
  sessionmedium: "sessionMedium",
  country: "country",
  "device category": "deviceCategory",
  devicecategory: "deviceCategory",
  // sessions
  sessions: "sessions",
  // users variants (GA4 exports "Active users")
  users: "users",
  "active users": "users",
  activeusers: "users",
  // new users
  "new users": "newUsers",
  newusers: "newUsers",
  // page views
  "page views": "pageViews",
  pageviews: "pageViews",
  views: "pageViews",
  // bounce rate
  "bounce rate": "bounceRate",
  bouncerate: "bounceRate",
  // avg session duration variants
  "average session duration": "avgSessionDur",
  averagesessionduration: "avgSessionDur",
  "average engagement time per session": "avgSessionDur",
  averageengagementtimepersession: "avgSessionDur",
  "engagement duration": "avgSessionDur",
  engagementduration: "avgSessionDur",
  // conversions (GA4 exports "Key events")
  conversions: "conversions",
  "key events": "conversions",
  keyevents: "conversions",
};

function normalizeKey(k: string) {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapRow(raw: Record<string, string>, fieldMap: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const norm = normalizeKey(k);
    const mapped = fieldMap[norm] ?? fieldMap[k.toLowerCase()];
    if (mapped) out[mapped] = String(v);
  }
  return out;
}

function detectType(headers: string[]): "gsc" | "ga4" | "sitemap" | "custom" {
  const norm = headers.map(normalizeKey);
  const hasGSC = ["clicks", "impressions", "position"].every((h) =>
    norm.some((n) => n.includes(h))
  );
  if (hasGSC) return "gsc";
  const hasGA4 = ["sessions", "users"].every((h) => norm.some((n) => n.includes(h)));
  if (hasGA4) return "ga4";
  return "custom";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const projectId = form.get("projectId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: "No project specified" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const buffer = await file.arrayBuffer();
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xml") {
      const text = new TextDecoder().decode(buffer);
      const urlMatches = [...text.matchAll(/<loc>(.*?)<\/loc>/gs)];
      const lastmodMatches = [...text.matchAll(/<lastmod>(.*?)<\/lastmod>/gs)];
      const changefreqMatches = [...text.matchAll(/<changefreq>(.*?)<\/changefreq>/gs)];
      const priorityMatches = [...text.matchAll(/<priority>(.*?)<\/priority>/gs)];

      const upload = await prisma.upload.create({
        data: {
          projectId,
          filename: file.name,
          fileType: "sitemap",
          mimeType: file.type || "application/xml",
          rowCount: urlMatches.length,
          status: "ready",
          sitemapUrls: {
            create: urlMatches.map((m, i) => ({
              loc: m[1].trim(),
              lastmod: lastmodMatches[i]?.[1]?.trim() ?? null,
              changefreq: changefreqMatches[i]?.[1]?.trim() ?? null,
              priority: priorityMatches[i] ? parseFloat(priorityMatches[i][1]) : null,
            })),
          },
        },
      });
      return NextResponse.json({ id: upload.id, fileType: "sitemap", rowCount: upload.rowCount });
    }

    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Read as raw arrays so we can skip GA4-style # metadata rows
    const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "", raw: false });

    // Find the first row that isn't a # comment (GA4 exports prepend metadata)
    const headerRowIdx = rawRows.findIndex(
      (row) => row.length > 0 && !String(row[0]).trim().startsWith("#")
    );
    if (headerRowIdx === -1) return NextResponse.json({ error: "File is empty" }, { status: 400 });

    const headers = rawRows[headerRowIdx].map(String);
    const rows: Record<string, string>[] = rawRows
      .slice(headerRowIdx + 1)
      .filter((row) => row.some((cell) => String(cell).trim() !== ""))
      .map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = String(row[i] ?? ""); });
        return obj;
      });

    if (!rows.length) return NextResponse.json({ error: "File is empty" }, { status: 400 });

    const fileType = detectType(headers);

    if (fileType === "gsc") {
      const mapped = rows.map((r) => mapRow(r, GSC_FIELD_MAP));
      const upload = await prisma.upload.create({
        data: {
          projectId,
          filename: file.name,
          fileType: "gsc",
          mimeType: file.type || "application/octet-stream",
          rowCount: mapped.length,
          status: "ready",
          gscRows: {
            create: mapped.map((r) => ({
              date: r.date || null,
              query: r.query || null,
              page: r.page || null,
              country: r.country || null,
              device: r.device || null,
              clicks: parseInt(r.clicks ?? "0") || 0,
              impressions: parseInt(r.impressions ?? "0") || 0,
              ctr: parseFloat(r.ctr?.replace("%", "") ?? "0") / (r.ctr?.includes("%") ? 100 : 1) || 0,
              position: parseFloat(r.position ?? "0") || 0,
            })),
          },
        },
      });
      return NextResponse.json({ id: upload.id, fileType: "gsc", rowCount: mapped.length });
    }

    if (fileType === "ga4") {
      const mapped = rows.map((r) => mapRow(r, GA4_FIELD_MAP));
      const upload = await prisma.upload.create({
        data: {
          projectId,
          filename: file.name,
          fileType: "ga4",
          mimeType: file.type || "application/octet-stream",
          rowCount: mapped.length,
          status: "ready",
          ga4Rows: {
            create: mapped.map((r) => ({
              date: r.date || null,
              pagePath: r.pagePath || null,
              pageTitle: r.pageTitle || null,
              sessionSource: r.sessionSource || null,
              sessionMedium: r.sessionMedium || null,
              country: r.country || null,
              deviceCategory: r.deviceCategory || null,
              sessions: parseInt(r.sessions ?? "0") || 0,
              users: parseInt(r.users ?? "0") || 0,
              newUsers: parseInt(r.newUsers ?? "0") || 0,
              pageViews: parseInt(r.pageViews ?? "0") || 0,
              bounceRate: parseFloat(r.bounceRate?.replace("%", "") ?? "0") / (r.bounceRate?.includes("%") ? 100 : 1) || 0,
              avgSessionDur: parseFloat(r.avgSessionDur ?? "0") || 0,
              conversions: parseInt(r.conversions ?? "0") || 0,
            })),
          },
        },
      });
      return NextResponse.json({ id: upload.id, fileType: "ga4", rowCount: mapped.length });
    }

    const upload = await prisma.upload.create({
      data: {
        projectId,
        filename: file.name,
        fileType: "custom",
        mimeType: file.type || "application/octet-stream",
        rowCount: rows.length,
        status: "ready",
      },
    });
    return NextResponse.json({ id: upload.id, fileType: "custom", rowCount: rows.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
