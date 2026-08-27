import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      teamId: string;
      playerId: string;
    }>;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { teamId, playerId } = await params;

  const role = (session.user as any).role;
  const sessionTeamId = (session.user as any).teamId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const sessionTeamIds = (session.user as any).teamIds as
    | string[]
    | undefined;
  // El capitán solamente puede acceder a su equipo
  if (role === "CAPTAIN") {
    // Puede agregar jugadores a CUALQUIERA de sus equipos
    if (!sessionTeamIds || !sessionTeamIds.includes(teamId)) {
      return NextResponse.json(
        { error: "No tienes permiso para este equipo" },
        { status: 403 }
      );
    }
  }

  // Solo SUPER_ADMIN, ADMIN o CAPTAIN
  if (
    !isSuperAdmin &&
    role !== "ADMIN" &&
    role !== "CAPTAIN"
  ) {
    return NextResponse.json(
      { error: "No tienes permisos" },
      { status: 403 }
    );
  }

  // Buscar jugador y comprobar que realmente pertenece
  // al equipo indicado en la URL
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Jugador no encontrado" },
      { status: 404 }
    );
  }

  if (player.teamId !== teamId) {
    return NextResponse.json(
      { error: "El jugador no pertenece a este equipo" },
      { status: 403 }
    );
  }

  // Buscar estadísticas
  const stat = await prisma.playerStat.findUnique({
    where: {
      playerId,
    },
  });

  // Borrar eventos relacionados
  if (stat) {
    await prisma.matchEvent.deleteMany({
      where: {
        playerId: stat.id,
      },
    });

    await prisma.playerStat.delete({
      where: {
        playerId,
      },
    });
  }

  // Borrar jugador
  await prisma.player.delete({
    where: {
      id: playerId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      teamId: string;
      playerId: string;
    }>;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { teamId, playerId } = await params;

  const role = (session.user as any).role;
  const sessionTeamId = (session.user as any).teamId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const sessionTeamIds = (session.user as any).teamIds as
    | string[]
    | undefined;
  // El capitán solamente puede modificar su equipo
  if (role === "CAPTAIN") {
    // Puede agregar jugadores a CUALQUIERA de sus equipos
    if (!sessionTeamIds || !sessionTeamIds.includes(teamId)) {
      return NextResponse.json(
        { error: "No tienes permiso para este equipo" },
        { status: 403 }
      );
    }
  }

  // Solo SUPER_ADMIN, ADMIN o CAPTAIN
  if (
    !isSuperAdmin &&
    role !== "ADMIN" &&
    role !== "CAPTAIN"
  ) {
    return NextResponse.json(
      { error: "No tienes permisos" },
      { status: 403 }
    );
  }

  const { name, number, position } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }

  // Comprobar que el jugador existe
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Jugador no encontrado" },
      { status: 404 }
    );
  }

  // MUY IMPORTANTE:
  // El jugador debe pertenecer al equipo
  if (player.teamId !== teamId) {
    return NextResponse.json(
      { error: "El jugador no pertenece a este equipo" },
      { status: 403 }
    );
  }

  const updatedPlayer = await prisma.player.update({
    where: {
      id: playerId,
    },

    data: {
      name: name.trim(),
      number:
        number !== null && number !== ""
          ? Number(number)
          : null,
      position: position || null,
    },
  });

  return NextResponse.json({
    ok: true,
    player: updatedPlayer,
  });
}