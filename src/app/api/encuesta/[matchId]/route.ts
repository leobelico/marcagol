import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const body = await req.json();
  const { teamId, arbitro, respuestas, comentarios } = body;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  if (teamId !== match.homeTeam.id && teamId !== match.awayTeam.id) {
    return NextResponse.json({ error: "Equipo inválido" }, { status: 400 });
  }

  const valores = [1, 2, 3, 4, 5].map((n) => Number(respuestas?.[`q${n}`]));
  if (valores.some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
    return NextResponse.json({ error: "Responde todas las preguntas" }, { status: 400 });
  }

  const yaExiste = await prisma.encuestaArbitral.findUnique({
    where: { matchId_teamId: { matchId, teamId } },
  });
  if (yaExiste) {
    return NextResponse.json(
      { error: "Este equipo ya contestó la encuesta de este partido" },
      { status: 409 }
    );
  }

  await prisma.encuestaArbitral.create({
    data: {
      matchId,
      teamId,
      arbitro: arbitro?.toString().trim().slice(0, 100) || null,
      q1: valores[0],
      q2: valores[1],
      q3: valores[2],
      q4: valores[3],
      q5: valores[4],
      comentarios: comentarios?.toString().trim().slice(0, 1000) || null,
    },
  });

  return NextResponse.json({ ok: true });
}