// app/api/public/admin/evento/[eventId]/route.ts
//
// Elimina un MatchEvent (por si el admin capturó algo por error) y
// revierte el incremento correspondiente en PlayerStat.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { eventId } = await params;

    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: {
        match: { select: { tenantId: true } },
        player: { select: { id: true, playerId: true } },
      },
    });
    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== event.match.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este evento" },
        { status: 403 }
      );
    }

    const decrementField =
      event.type === "GOAL"
        ? "goals"
        : event.type === "YELLOW_CARD"
        ? "yellow"
        : event.type === "RED_CARD"
        ? "red"
        : null;

    await prisma.$transaction([
      prisma.matchEvent.delete({ where: { id: eventId } }),
      ...(decrementField
        ? [
            prisma.playerStat.update({
              where: { id: event.player.id },
              data: { [decrementField]: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error eliminando evento:", error);
    return NextResponse.json(
      { error: "Error al eliminar el evento" },
      { status: 500 }
    );
  }
}