// Equipos del capitán logueado, agrupados por liga (lo que la web carga
// en /capitan). Lo usa la app móvil para el portal del capitán.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jornadaActual } from "@/lib/suspensiones";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId: session.user.id, role: "CAPTAIN", teams: { some: {} } },
    include: {
      tenant: {
        select: { id: true, name: true, slug: true, logo: true, registrationOpen: true },
      },
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logo: true,
              disqualified: true,
              allowLateRegistration: true,
              players: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  position: true,
                  photo: true,
                  ineUrl: true,
                  documentoOficialUrl: true,
                  suspendedUntil: true,
                },
                orderBy: { name: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const ligas = await Promise.all(
    tenantUsers.map(async (tu) => {
      // Suspensión vigente: suspendedUntil alcanza la jornada que sigue
      const actual = await jornadaActual(tu.tenant.id);
      return {
        tenant: tu.tenant,
        jornadaActual: actual,
        teams: tu.teams.map((tc) => ({
          ...tc.team,
          players: tc.team.players.map((p) => ({
            ...p,
            suspendido: p.suspendedUntil != null && actual != null && p.suspendedUntil >= actual,
          })),
        })),
      };
    })
  );

  return NextResponse.json({ ligas });
}
