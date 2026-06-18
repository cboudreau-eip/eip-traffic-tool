import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  const limit = parseInt(searchParams.get("limit") ?? "1000");

  const where = uploadId ? { uploadId } : {};

  const [urls, count] = await Promise.all([
    prisma.sitemapUrl.findMany({ where, take: limit, orderBy: { priority: "desc" } }),
    prisma.sitemapUrl.count({ where }),
  ]);

  return NextResponse.json({ urls, total: count });
}
