import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const where = projectId ? { projectId } : {};

  const uploads = await prisma.upload.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: {
      id: true,
      filename: true,
      fileType: true,
      uploadedAt: true,
      rowCount: true,
      status: true,
      errorMsg: true,
    },
  });
  return NextResponse.json(uploads);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.upload.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
