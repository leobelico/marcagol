import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: tenantId, teamId } = await params;
  const { disqualified } = await req.json();

  if (typeof disqualified !== "boolean") {
    return NextResponse.json({ error: "Falta el campo disqualified" }, { status: 400 });
  }

  const team = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
  if (!team) return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { disqualified },
  });

  // Si lo estás descalificando, cancela sus partidos futuros SIN tocar los ya jugados
  // (así las estadísticas de lo que ya ocurrió no se ven afectadas)
  if (disqualified) {
    await prisma.match.updateMany({
      where: {
        tenantId,
        status: "SCHEDULED",
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ team: updated });
}