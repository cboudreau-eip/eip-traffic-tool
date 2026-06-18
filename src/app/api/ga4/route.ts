import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  const limit = parseInt(searchParams.get("limit") ?? "500");

  const where = uploadId ? { uploadId } : {};

  const [rows, totals] = await Promise.all([
    prisma.ga4Row.findMany({
      where,
      orderBy: { sessions: "desc" },
      take: limit,
    }),
    prisma.ga4Row.aggregate({
      where,
      _sum: { sessions: true, users: true, newUsers: true, pageViews: true, conversions: true },
      _avg: { bounceRate: true, avgSessionDur: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({ rows, totals });
}
