// app/api/public/admin/jugador/[playerId]/route.ts
//
// PATCH: edita nombre/número/posición de un jugador.
// DELETE: elimina un jugador (y su PlayerStat, en cascada manual
// porque el schema no tiene onDelete: Cascade en esa relación).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

async function getPlayerWithTenant(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      team: { select: { tenantId: true } },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { playerId } = await params;
    const body = await request.json();

    const player = await getPlayerWithTenant(playerId);
    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== player.team.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este jugador" },
        { status: 403 }
      );
    }

    const data: { name?: string; number?: number | null; position?: string | null } = {};

    if (body?.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body?.number !== undefined) {
      const num = body.number === null || body.number === "" ? null : Number(body.number);
      data.number = Number.isFinite(num as number) ? num : null;
    }

    if (body?.position !== undefined) {
      data.position = body.position ? String(body.position).trim() : null;
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data,
      include: { stats: true },
    });

    return NextResponse.json({
      player: {
        id: updated.id,
        name: updated.name,
        number: updated.number,
        position: updated.position,
        photo: updated.photo,
        goals: updated.stats[0]?.goals ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error editando jugador:", error);
    return NextResponse.json(
      { error: "Error al editar jugador" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { playerId } = await params;

    const player = await getPlayerWithTenant(playerId);
    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== player.team.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este jugador" },
        { status: 403 }
      );
    }

    // MatchEvent.playerId apunta a PlayerStat.id (no a Player.id
    // directamente), así que hay que limpiar en orden:
    // eventos del PlayerStat de este jugador -> el PlayerStat -> el jugador.
    await prisma.$transaction([
      prisma.matchEvent.deleteMany({
        where: { player: { playerId } },
      }),
      prisma.playerStat.deleteMany({ where: { playerId } }),
      prisma.player.delete({ where: { id: playerId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error eliminando jugador:", error);
    return NextResponse.json(
      { error: "Error al eliminar jugador" },
      { status: 500 }
    );
  }
}