import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: tenantId } = await params;
  const { homeTeamId, awayTeamId, date, cancha, roundId } = await req.json();

  if (!homeTeamId || !awayTeamId || !date || !cancha) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  if (homeTeamId === awayTeamId) {
    return NextResponse.json({ error: "Un equipo no puede jugar contra sí mismo" }, { status: 400 });
  }

  const matchDate = new Date(date);
const matchEnd = new Date(matchDate.getTime() + 60 * 60 * 1000); // ← aquí

const existingMatches = await prisma.match.findMany({
  where: { tenantId, status: { not: "CANCELLED" } },
  include: { homeTeam: true, awayTeam: true },
});

  // 1. ¿Ya se enfrentaron?
  const yaJugaron = existingMatches.find(m =>
    (m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId) ||
    (m.homeTeamId === awayTeamId && m.awayTeamId === homeTeamId)
  );
  if (yaJugaron) {
    return NextResponse.json({
      error: `Estos equipos ya se enfrentaron el ${new Date(yaJugaron.date).toLocaleDateString("es-MX")}`
    }, { status: 400 });
  }

  // 2. ¿Cancha ocupada en ese horario?
 const canchaOcupada = existingMatches.find(m => {
  if ((m as any).cancha !== cancha) return false;
  const mStart = new Date(m.date);
  const mEnd = new Date(mStart.getTime() + 60 * 60 * 1000); // ← aquí
  return matchDate < mEnd && matchEnd > mStart;
});
  if (canchaOcupada) {
    return NextResponse.json({
      error: `La cancha ${cancha} ya tiene un partido a esa hora: ${canchaOcupada.homeTeam.name} vs ${canchaOcupada.awayTeam.name}`
    }, { status: 400 });
  }

  // 3. ¿Algún equipo ya juega en ese horario?
  const equipoOcupado = existingMatches.find(m => {
  const equiposEnPartido = [m.homeTeamId, m.awayTeamId];
  if (!equiposEnPartido.includes(homeTeamId) && !equiposEnPartido.includes(awayTeamId)) return false;
  const mStart = new Date(m.date);
  const mEnd = new Date(mStart.getTime() + 60 * 60 * 1000); // ← aquí
  return matchDate < mEnd && matchEnd > mStart;
});
  if (equipoOcupado) {
    const equipoNombre = [equipoOcupado.homeTeamId, equipoOcupado.awayTeamId].includes(homeTeamId)
      ? existingMatches.find(m => m.id === equipoOcupado.id)?.homeTeam.name
      : existingMatches.find(m => m.id === equipoOcupado.id)?.awayTeam.name;
    return NextResponse.json({
      error: `Un equipo ya tiene partido a esa hora`
    }, { status: 400 });
  }

  // Crear o usar jornada
  let round;
  if (roundId) {
    round = await prisma.round.findUnique({ where: { id: roundId } });
  } else {
    // Crear nueva jornada
    const lastRound = await prisma.round.findFirst({
      where: { tenantId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastRound?.number ?? 0) + 1;
    round = await prisma.round.create({
      data: { tenantId, number: nextNumber, name: `Jornada ${nextNumber}` },
    });
  }

  const match = await prisma.match.create({
    data: {
      tenantId,
      homeTeamId,
      awayTeamId,
      date: matchDate,
      cancha,
      roundId: round!.id,
      status: "SCHEDULED",
    },
  });

  return NextResponse.json({ match });
}