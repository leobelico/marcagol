import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { teamId } = await params;
  const { name, number, position } = await req.json();

  const player = await prisma.player.create({
    data: {
      name,
      number,
      position,
      teamId,
      stats: { create: {} },
    },
  });

  return NextResponse.json(player);
}