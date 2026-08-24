// app/api/public/admin/partidos/[matchId]/route.ts
//
// Captura/actualiza el resultado de un partido desde la app.
// Verifica que el admin tenga permiso sobre el tenant al que
// pertenece ese partido antes de dejarlo escribir.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { matchId } = await params;
    const body = await request.json();

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, tenantId: true },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    if (!auth.isSuperAdmin && auth.tenantId !== match.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este partido" },
        { status: 403 }
      );
    }

    const { homeScore, awayScore, status } = body ?? {};

    if (
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      return NextResponse.json(
        { error: "Marcador inválido" },
        { status: 400 }
      );
    }

    const validStatuses = ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"];
    const newStatus = validStatuses.includes(status) ? status : "FINISHED";

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, status: newStatus },
      include: { homeTeam: true, awayTeam: true },
    });

    return NextResponse.json({
      match: {
        id: updated.id,
        date: updated.date,
        status: updated.status,
        homeScore: updated.homeScore,
        awayScore: updated.awayScore,
        homeTeam: { id: updated.homeTeam.id, name: updated.homeTeam.name },
        awayTeam: { id: updated.awayTeam.id, name: updated.awayTeam.name },
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error actualizando resultado:", error);
    return NextResponse.json(
      { error: "Error al actualizar el resultado" },
      { status: 500 }
    );
  }
}