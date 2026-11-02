import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

// Jornadas con sus partidos + equipos y árbitros del torneo
// (lo que la web carga en /admin/torneos/[id]/calendario). Lo usa la app móvil.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const team = { select: { id: true, name: true, logo: true } };

  const [rounds, teams, referees] = await Promise.all([
    prisma.round.findMany({
      where: { tenantId: id },
      include: {
        matches: {
          include: {
            homeTeam: team,
            awayTeam: team,
            referee: { select: { id: true, name: true } },
          },
          orderBy: [{ bracketOrder: "asc" }, { date: "asc" }],
        },
      },
      orderBy: { number: "asc" },
    }),
    prisma.team.findMany({
      where: { tenantId: id },
      select: { id: true, name: true, logo: true, disqualified: true },
      orderBy: { name: "asc" },
    }),
    prisma.referee.findMany({
      where: { tenantId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ rounds, teams, referees });
}
