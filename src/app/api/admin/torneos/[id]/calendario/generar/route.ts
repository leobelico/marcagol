import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DIAS_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

// Obtener la siguiente fecha que caiga en uno de los días permitidos
function nextMatchDate(from: Date, matchDays: string[]): Date {
  const date = new Date(from);
  const allowedDays = matchDays.map((d) => DIAS_MAP[d]);
  for (let i = 0; i < 14; i++) {
    if (allowedDays.includes(date.getDay())) return new Date(date);
    date.setDate(date.getDate() + 1);
  }
  return new Date(from);
}

// Algoritmo round-robin
function generateRoundRobin(teams: { id: string; name: string }[]): { home: string; away: string }[][] {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push({ id: "bye", name: "BYE" });

  const n = list.length;
  const rounds: { home: string; away: string }[][] = [];

  for (let r = 0; r < n - 1; r++) {
    const round: { home: string; away: string }[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = list[i];
      const away = list[n - 1 - i];
      if (home.id !== "bye" && away.id !== "bye") {
        round.push({ home: home.id, away: away.id });
      }
    }
    rounds.push(round);
    // Rotar equipos (el primero fijo)
    list.splice(1, 0, list.pop()!);
  }

  return rounds;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const torneo = await prisma.tenant.findUnique({
    where: { id },
    include: { teams: true },
  });

  if (!torneo) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  if (torneo.teams.length < 2) return NextResponse.json({ error: "Necesitas al menos 2 equipos" }, { status: 400 });
  if (!torneo.startDate) return NextResponse.json({ error: "El torneo no tiene fecha de inicio" }, { status: 400 });
  if (torneo.matchDays.length === 0) return NextResponse.json({ error: "No hay días de juego configurados" }, { status: 400 });

  // Eliminar calendario anterior
await prisma.matchEvent.deleteMany({ where: { match: { tenantId: id } } });
await prisma.match.deleteMany({ where: { tenantId: id } });
await prisma.round.deleteMany({ where: { tenantId: id } });

  // Generar fixture
  const fixture = generateRoundRobin(torneo.teams);
  let allRounds = [...fixture];

  // Si es ida y vuelta, agregar ronda de vuelta invirtiendo local/visitante
  if (torneo.roundTrip) {
    const vuelta = fixture.map((round) =>
      round.map((m) => ({ home: m.away, away: m.home }))
    );
    allRounds = [...fixture, ...vuelta];
  }

  // Asignar fechas
  let currentDate = new Date(torneo.startDate);

  for (let i = 0; i < allRounds.length; i++) {
    const roundMatches = allRounds[i];
    const roundDate = nextMatchDate(currentDate, torneo.matchDays);

    // Crear jornada
    const round = await prisma.round.create({
      data: {
        number: i + 1,
        name: torneo.roundTrip && i >= fixture.length
          ? `Jornada ${i + 1} (Vuelta)`
          : `Jornada ${i + 1}`,
        tenantId: id,
      },
    });

    // Crear partidos de la jornada
    await prisma.match.createMany({
      data: roundMatches.map((m) => ({
        tenantId: id,
        homeTeamId: m.home,
        awayTeamId: m.away,
        roundId: round.id,
        date: roundDate,
        status: "SCHEDULED",
      })),
    });

    // Avanzar a la siguiente fecha de juego
    currentDate = new Date(roundDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return NextResponse.json({ ok: true, rounds: allRounds.length });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.match.deleteMany({ where: { tenantId: id } });
  await prisma.round.deleteMany({ where: { tenantId: id } });

  return NextResponse.json({ ok: true });
}