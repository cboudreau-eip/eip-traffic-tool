import * as XLSX from "xlsx";

export type FileType = "gsc" | "ga4" | "sitemap" | "custom";

export interface ParseResult {
  fileType: FileType;
  rows: Record<string, string | number>[];
  headers: string[];
}

const GSC_HEADERS = ["query", "clicks", "impressions", "ctr", "position"];
const GA4_HEADERS = ["sessions", "users", "pageviews", "bounceRate"];

function detectFileType(headers: string[]): FileType {
  const lower = headers.map((h) => h.toLowerCase().replace(/\s/g, ""));
  const hasGSC = GSC_HEADERS.every((h) => lower.some((l) => l.includes(h)));
  if (hasGSC) return "gsc";
  const hasGA4 = GA4_HEADERS.some((h) => lower.some((l) => l.includes(h)));
  if (hasGA4) return "ga4";
  return "custom";
}

export async function parseFile(buffer: ArrayBuffer, filename: string): Promise<ParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "xml" || filename.toLowerCase().includes("sitemap")) {
    return parseSitemap(buffer);
  }

  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, {
    defval: "",
    raw: false,
  });

  if (!raw.length) {
    return { fileType: "custom", rows: [], headers: [] };
  }

  const headers = Object.keys(raw[0]);
  const fileType = detectFileType(headers);

  return { fileType, rows: raw, headers };
}

function parseSitemap(buffer: ArrayBuffer): ParseResult {
  const text = new TextDecoder().decode(buffer);
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const urls = Array.from(doc.querySelectorAll("url"));

  const rows = urls.map((url) => ({
    loc: url.querySelector("loc")?.textContent ?? "",
    lastmod: url.querySelector("lastmod")?.textContent ?? "",
    changefreq: url.querySelector("changefreq")?.textContent ?? "",
    priority: url.querySelector("priority")?.textContent ?? "",
  }));

  return { fileType: "sitemap", rows, headers: ["loc", "lastmod", "changefreq", "priority"] };
}
