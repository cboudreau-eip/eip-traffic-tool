import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const uploadId = searchParams.get("uploadId");
  const page = searchParams.get("page");

  if (!uploadId || !page) {
    return NextResponse.json({ error: "Missing uploadId or page" }, { status: 400 });
  }

  const rows = await prisma.gscRow.findMany({
    where: { uploadId, page, query: { not: null } },
    select: { query: true, clicks: true, impressions: true, ctr: true, position: true },
    orderBy: { clicks: "desc" },
    take: 25,
  });

  const queries = rows.map((r) => ({
    query: r.query!,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  return NextResponse.json({ queries });
}
