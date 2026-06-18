import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { uploads: true } } },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { name, url, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: { name: name.trim(), url: url?.trim() || null, description: description?.trim() || null },
  });
  return NextResponse.json(project);
}
