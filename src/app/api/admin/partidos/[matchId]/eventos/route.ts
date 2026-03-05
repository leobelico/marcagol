import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await params;

  const events = await prisma.matchEvent.findMany({
    where: { matchId },
    include: { player: { include: { player: true } } },
    orderBy: { minute: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await params;
  const { type, minute, playerId, assistPlayerId } = await req.json();

  // Buscar o crear el PlayerStat del jugador
  let playerStat = await prisma.playerStat.findUnique({ where: { playerId } });
  if (!playerStat) {
    playerStat = await prisma.playerStat.create({ data: { playerId } });
  }

  // Crear el evento
  const event = await prisma.matchEvent.create({
    data: { type, minute: Number(minute), matchId, playerId: playerStat.id },
  });

  // Actualizar estadísticas del goleador
  if (type === "GOAL") {
    await prisma.playerStat.update({
      where: { playerId },
      data: { goals: { increment: 1 } },
    });
  }

  // Actualizar asistencia si hay asistente
  if (assistPlayerId) {
    let assistStat = await prisma.playerStat.findUnique({ where: { playerId: assistPlayerId } });
    if (!assistStat) {
      assistStat = await prisma.playerStat.create({ data: { playerId: assistPlayerId } });
    }
    await prisma.playerStat.update({
      where: { playerId: assistPlayerId },
      data: { assists: { increment: 1 } },
    });
  }

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await params;
  const { eventId } = await req.json();

  // Obtener el evento para revertir stats
  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { player: true },
  });

  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  if (event.type === "GOAL") {
    await prisma.playerStat.update({
      where: { id: event.playerId },
      data: { goals: { decrement: 1 } },
    });
  }

  await prisma.matchEvent.delete({ where: { id: eventId } });

  return NextResponse.json({ ok: true });
}