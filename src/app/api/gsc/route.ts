import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  const projectId = searchParams.get("projectId");
  const limit = parseInt(searchParams.get("limit") ?? "500");

  const where = uploadId
    ? { uploadId }
    : projectId
    ? { upload: { projectId } }
    : {};

  const [rows, totals] = await Promise.all([
    prisma.gscRow.findMany({ where, orderBy: { clicks: "desc" }, take: limit }),
    prisma.gscRow.aggregate({
      where,
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({ rows, totals });
}
