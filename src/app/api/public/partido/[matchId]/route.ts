// app/api/public/partido/[matchId]/route.ts
//
// Detalle público de un partido para la app: marcador, video (Tlachtli TV)
// y jugadas con su clip si lo tienen. Las asistencias se guardan como
// eventos aparte; aquí se mandan todos los eventos y la app decide qué
// mostrar.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const m = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
        tenant: { select: { name: true, slug: true } },
        round: { select: { number: true, name: true } },
        events: {
          orderBy: { minute: "asc" },
          include: {
            player: { select: { player: { select: { id: true, name: true, number: true, teamId: true } } } },
          },
        },
      },
    });
    if (!m) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      match: {
        id: m.id,
        date: m.date,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        cancha: m.cancha,
        videoUrl: m.videoUrl,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        tenant: m.tenant,
        round: m.round ? (m.round.name ?? `Jornada ${m.round.number}`) : null,
      },
      events: m.events.map((e) => ({
        id: e.id,
        type: e.type,
        minute: e.minute,
        clipUrl: e.clipUrl,
        player: {
          id: e.player.player.id,
          name: e.player.player.name,
          number: e.player.player.number,
        },
        teamId: e.player.player.teamId,
      })),
    });
  } catch (error) {
    console.error("Error fetching partido:", error);
    return NextResponse.json({ error: "Error al obtener el partido" }, { status: 500 });
  }
}
