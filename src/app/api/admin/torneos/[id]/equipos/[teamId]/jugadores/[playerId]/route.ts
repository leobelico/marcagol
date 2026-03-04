import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { playerId } = await params;

  await prisma.playerStat.deleteMany({ where: { playerId } });
  await prisma.player.delete({ where: { id: playerId } });

  return NextResponse.json({ ok: true });
}