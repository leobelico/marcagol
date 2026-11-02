import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recalcularSuspensionesTorneo } from "@/lib/suspensiones";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  // Obtenemos el partido antes de borrarlo, para saber a qué jornada pertenece
  const match = await prisma.match.findFirst({
    where: { id: matchId, tenantId: id },
    select: { roundId: true },
  });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  await prisma.matchEvent.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId, tenantId: id } }); 

  // Si la jornada se quedó sin partidos, la eliminamos también
  if (match.roundId) {
    const partidosRestantes = await prisma.match.count({
      where: { roundId: match.roundId },
    });
    if (partidosRestantes === 0) {
      await prisma.round.delete({ where: { id: match.roundId } });
    }
  }

  await recalcularSuspensionesTorneo(id);
  return NextResponse.json({ ok: true });
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;
  const { targetRoundId } = await req.json();

  // Obtener el partido a mover
  const match = await prisma.match.findFirst({
    where: { id: matchId, tenantId: id },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  const targetRound = await prisma.round.findFirst({ where: { id: targetRoundId, tenantId: id } });
  if (!targetRound) return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 });

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

  await recalcularSuspensionesTorneo(id);
  return NextResponse.json({ ok: true, match: updated });
}