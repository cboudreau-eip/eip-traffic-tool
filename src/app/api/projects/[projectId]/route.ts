import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { uploads: true } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { name, url, description } = await req.json();
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(url !== undefined ? { url: url?.trim() || null } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
    },
  });
  return NextResponse.json(project);
}
