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
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { playerId } = await params;
  const { name, number, position } = await req.json();

  const player = await prisma.player.update({
    where: { id: playerId },
    data: { name, number: number ?? null, position: position ?? null },
  });

  return NextResponse.json({ ok: true, player });
}