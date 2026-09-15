// app/api/public/jugador/[playerId]/partidos/route.ts
//
// Partidos del equipo del jugador, cada uno con los eventos que ese
// jugador específico tuvo en ese partido (goles, tarjetas). Público,
// sin auth — alimenta el perfil de jugador estilo SofaScore en la app.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, teamId: true, stats: true },
    });
    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    const playerStatId = player.stats[0]?.id ?? null;

    const matches = await prisma.match.findMany({
      where: {
        status: "FINISHED",
        OR: [{ homeTeamId: player.teamId }, { awayTeamId: player.teamId }],
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        events: playerStatId
          ? { where: { playerId: playerStatId } }
          : false,
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    const result = matches.map((m) => ({
      id: m.id,
      date: m.date,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isHome: m.homeTeamId === player.teamId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      events: (m.events ?? []).map((e) => ({
        type: e.type,
        minute: e.minute,
      })),
    }));

    return NextResponse.json({ matches: result });
  } catch (error) {
    console.error("Error fetching partidos del jugador:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}