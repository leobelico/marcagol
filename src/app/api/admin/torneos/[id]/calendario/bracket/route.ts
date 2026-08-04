import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Crea una fase de bracket (ej. Cuartos) con todos sus cruces en una sola Round
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: tenantId } = await params;
  const { bracketLabel, pares } = await req.json();
  // pares: [{ homeTeamId, awayTeamId, fecha, hora, cancha }, ...]

  if (!bracketLabel || !Array.isArray(pares) || pares.length === 0) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Determinar el siguiente bracketStage
  const lastBracket = await prisma.round.findFirst({
    where: { tenantId, bracketStage: { not: null } },
    orderBy: { bracketStage: "desc" },
  });
  const nextStage = (lastBracket?.bracketStage ?? 0) + 1;

  const lastRound = await prisma.round.findFirst({
    where: { tenantId },
    orderBy: { number: "desc" },
  });
  const nextNumber = (lastRound?.number ?? 0) + 1;

  const round = await prisma.round.create({
    data: {
      tenantId,
      number: nextNumber,
      name: bracketLabel,
      bracketStage: nextStage,
      bracketLabel,
    },
  });

  const matches = [];
  for (let i = 0; i < pares.length; i++) {
    const p = pares[i];
    const match = await prisma.match.create({
      data: {
        tenantId,
        homeTeamId: p.homeTeamId,
        awayTeamId: p.awayTeamId,
        date: new Date(`${p.fecha}T${p.hora}:00-06:00`),
        cancha: p.cancha,
        roundId: round.id,
        bracketOrder: i,
        status: "SCHEDULED",
      },
    });
    matches.push(match);
  }

  return NextResponse.json({ round, matches });
}

// Obtiene la última fase de bracket para saber si ya se puede generar la siguiente
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const lastRound = await prisma.round.findFirst({
    where: { tenantId, bracketStage: { not: null } },
    orderBy: { bracketStage: "desc" },
    include: {
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: { bracketOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ lastRound });
}