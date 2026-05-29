import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, matchId } = await params;

  await prisma.matchEvent.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId, tenantId: id } });

  return NextResponse.json({ ok: true });
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, matchId } = await params;
  const { targetRoundId } = await req.json();

  // Obtener el partido a mover
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  // Verificar que los equipos no jueguen ya en esa jornada
  const conflictoEquipo = await prisma.match.findFirst({
    where: {
      roundId: targetRoundId,
      id: { not: matchId },
      OR: [
        { homeTeamId: match.homeTeamId },
        { awayTeamId: match.homeTeamId },
        { homeTeamId: match.awayTeamId },
        { awayTeamId: match.awayTeamId },
      ],
    },
  });
  if (conflictoEquipo) {
    return NextResponse.json(
      { error: "Uno de los equipos ya tiene partido en esa jornada" },
      { status: 400 }
    );
  }

  // Verificar conflicto de cancha y horario
  if (match.cancha) {
    const conflictoCancha = await prisma.match.findFirst({
      where: {
        roundId: targetRoundId,
        id: { not: matchId },
        cancha: match.cancha,
        date: match.date,
      },
    });
    if (conflictoCancha) {
      return NextResponse.json(
        { error: `Ya hay un partido en cancha ${match.cancha} a esa hora en esa jornada` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { roundId: targetRoundId },
  });

  return NextResponse.json({ ok: true, match: updated });
}