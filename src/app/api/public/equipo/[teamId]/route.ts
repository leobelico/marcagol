// app/api/public/equipo/[teamId]/route.ts
//
// Detalle público de un equipo: stats (W/D/L/GF/GA), plantilla de
// jugadores y sus partidos jugados. Misma lógica de cálculo que
// EquipoPage (app/equipos/[teamId]/page.tsx) en la web, sin login.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: { include: { stats: true } },
        homeMatches: {
          where: { status: "FINISHED" },
          include: { awayTeam: true },
          orderBy: { date: "desc" },
        },
        awayMatches: {
          where: { status: "FINISHED" },
          include: { homeTeam: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Combinar y ordenar partidos (igual que en la web)
    const matches = [
      ...team.homeMatches.map((m) => ({
        id: m.id,
        date: m.date,
        isHome: true,
        teamScore: m.homeScore,
        opponentScore: m.awayScore,
        opponent: { id: m.awayTeam.id, name: m.awayTeam.name },
      })),
      ...team.awayMatches.map((m) => ({
        id: m.id,
        date: m.date,
        isHome: false,
        teamScore: m.awayScore,
        opponentScore: m.homeScore,
        opponent: { id: m.homeTeam.id, name: m.homeTeam.name },
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Stats del equipo (mismo cálculo que la web)
    let w = 0,
      d = 0,
      l = 0,
      gf = 0,
      ga = 0;
    team.homeMatches.forEach((m) => {
      gf += m.homeScore ?? 0;
      ga += m.awayScore ?? 0;
      if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) w++;
      else if (m.homeScore === m.awayScore) d++;
      else l++;
    });
    team.awayMatches.forEach((m) => {
      gf += m.awayScore ?? 0;
      ga += m.homeScore ?? 0;
      if ((m.awayScore ?? 0) > (m.homeScore ?? 0)) w++;
      else if (m.homeScore === m.awayScore) d++;
      else l++;
    });

    const players = team.players.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      photo: p.photo,
      goals: p.stats[0]?.goals ?? 0,
      assists: p.stats[0]?.assists ?? 0,
    }));

    return NextResponse.json({
      team: { id: team.id, name: team.name, logo: team.logo },
      stats: { w, d, l, gf, ga },
      players,
      matches,
    });
  } catch (error) {
    console.error("Error fetching equipo público:", error);
    return NextResponse.json(
      { error: "Error al obtener el equipo" },
      { status: 500 }
    );
  }
}