import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { playerId } = await params;

  // Primero borrar eventos del jugador
  const stat = await prisma.playerStat.findUnique({ where: { playerId } });
  if (stat) {
    await prisma.matchEvent.deleteMany({ where: { playerId: stat.id } });
    await prisma.playerStat.delete({ where: { playerId } });
  }

  await prisma.player.delete({ where: { id: playerId } });

  return NextResponse.json({ ok: true });
}