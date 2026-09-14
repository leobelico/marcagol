import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { matchId } = await params;

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

/**
 * Recalcula la jornada hasta la que está suspendido un jugador
 * tomando TODAS sus tarjetas rojas registradas.
 */
async function recalcularSuspension(playerId: string) {
  const playerStat = await prisma.playerStat.findUnique({
    where: { playerId },
  });

  if (!playerStat) return;

  const rojas = await prisma.matchEvent.findMany({
    where: {
      playerId: playerStat.id,
      type: "RED_CARD",
      suspensionGames: {
        not: null,
      },
    },
    include: {
      match: {
        include: {
          round: true,
        },
      },
    },
  });

  let suspendedUntil: number | null = null;

  for (const roja of rojas) {
    const jornada = roja.match.round?.number;

    if (jornada == null || roja.suspensionGames == null) {
      continue;
    }

    const hasta = jornada + roja.suspensionGames;

    if (suspendedUntil === null || hasta > suspendedUntil) {
      suspendedUntil = hasta;
    }
  }

  await prisma.player.update({
    where: {
      id: playerId,
    },
    data: {
      suspendedUntil,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { matchId } = await params;

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

  const suspension =
    type === "RED_CARD"
      ? Number(suspensionGames ?? 1)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { matchId } = await params;
  const { eventId } = await req.json();

  const event = await prisma.matchEvent.findUnique({
    where: {
      id: eventId,
    },
    include: {
      player: true,
    },
  });

  if (!event) {
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