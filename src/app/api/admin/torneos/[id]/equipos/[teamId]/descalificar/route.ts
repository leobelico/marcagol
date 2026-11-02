import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const { id: tenantId, teamId } = await params;
  const guard = await requireTenantAdmin(tenantId);
  if ("error" in guard) return guard.error;
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