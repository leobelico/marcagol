import { NextRequest, NextResponse } from "next/server";
import { requireMatchAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recalcularSuspension } from "@/lib/suspensiones";
import { linkVideoValido } from "@/lib/video";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;

  const events = await prisma.matchEvent.findMany({
    where: { matchId },
    include: {
      player: {
        include: {
          player: true,
        },
      },
    },
    orderBy: { minute: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;

  const {
    type,
    minute,
    playerId,
    assistPlayerId,
    suspensionGames,
  } = await req.json();

  // Buscar el partido y su jornada
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    include: {
      round: true,
    },
  });

  if (!match) {
    return NextResponse.json(
      { error: "Partido no encontrado" },
      { status: 404 }
    );
  }

  // Buscar o crear PlayerStat
  let playerStat = await prisma.playerStat.findUnique({
    where: {
      playerId,
    },
  });

  if (!playerStat) {
    playerStat = await prisma.playerStat.create({
      data: {
        playerId,
      },
    });
  }

  // Partidos de castigo por roja: entero de 1 en adelante (1 si no viene)
  const castigo = Math.floor(Number(suspensionGames ?? 1));
  const suspension =
    type === "RED_CARD"
      ? Number.isFinite(castigo) && castigo >= 1 ? castigo : 1
      : null;

  // Crear evento
  const event = await prisma.matchEvent.create({
    data: {
      type,
      minute: Number(minute),
      matchId,
      playerId: playerStat.id,
      suspensionGames: suspension,
    },
  });

  // Amarilla
  if (type === "YELLOW_CARD") {
    await prisma.playerStat.update({
      where: {
        playerId,
      },
      data: {
        yellow: {
          increment: 1,
        },
      },
    });
  }

  // Roja
  if (type === "RED_CARD") {
    await prisma.playerStat.update({
      where: {
        playerId,
      },
      data: {
        red: {
          increment: 1,
        },
      },
    });

    // Actualizar suspensión del jugador
    await recalcularSuspension(playerId);
  }

  // Gol
  if (type === "GOAL") {
    await prisma.playerStat.update({
      where: {
        playerId,
      },
      data: {
        goals: {
          increment: 1,
        },
      },
    });
  }

  // Asistencia
  if (assistPlayerId) {
    let assistStat = await prisma.playerStat.findUnique({
      where: {
        playerId: assistPlayerId,
      },
    });

    if (!assistStat) {
      assistStat = await prisma.playerStat.create({
        data: {
          playerId: assistPlayerId,
        },
      });
    }

    await prisma.playerStat.update({
      where: {
        playerId: assistPlayerId,
      },
      data: {
        assists: {
          increment: 1,
        },
      },
    });
  }

  return NextResponse.json(event);
}

// Tlachtli TV: guarda (o borra, con vacío) el clip de un evento
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const eventId = typeof body?.eventId === "string" ? body.eventId : null;
  const link = linkVideoValido(body?.clipUrl);
  if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });
  if (!link.ok) {
    return NextResponse.json({ error: "Pega un link que empiece con https://" }, { status: 400 });
  }

  const event = await prisma.matchEvent.findUnique({ where: { id: eventId }, select: { matchId: true } });
  if (!event || event.matchId !== matchId) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const actualizado = await prisma.matchEvent.update({
    where: { id: eventId },
    data: { clipUrl: link.valor },
    select: { id: true, clipUrl: true },
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;
  const { eventId } = await req.json();

  const event = await prisma.matchEvent.findUnique({
    where: {
      id: eventId,
    },
    include: {
      player: true,
    },
  });

  if (!event || event.matchId !== matchId) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 }
    );
  }

  // Gol
  if (event.type === "GOAL") {
    await prisma.playerStat.update({
      where: {
        id: event.playerId,
      },
      data: {
        goals: {
          decrement: 1,
        },
      },
    });
  }

  // Amarilla
  if (event.type === "YELLOW_CARD") {
    await prisma.playerStat.update({
      where: {
        id: event.playerId,
      },
      data: {
        yellow: {
          decrement: 1,
        },
      },
    });
  }

  // Roja
  if (event.type === "RED_CARD") {
    await prisma.playerStat.update({
      where: {
        id: event.playerId,
      },
      data: {
        red: {
          decrement: 1,
        },
      },
    });
  }

  await prisma.matchEvent.delete({
    where: {
      id: eventId,
    },
  });

  // Si era una roja, recalcular desde cero
  if (event.type === "RED_CARD") {
    await recalcularSuspension(event.player.playerId);
  }

  return NextResponse.json({
    ok: true,
  });
}