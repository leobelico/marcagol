import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session?.user as any)?.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await req.json();

  try {
    let totalJugadores = 0;
    let totalEquipos = 0;
    let totalTorneos = 0;

    for (const row of rows) {
      const { torneo_nombre, torneo_slug, equipo_nombre, jugador_nombre, jugador_numero, jugador_posicion } = row;

      if (!torneo_nombre || !torneo_slug || !equipo_nombre || !jugador_nombre) continue;

      // Crear o reutilizar torneo
      let tenant = await prisma.tenant.findUnique({ where: { slug: torneo_slug } });
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { name: torneo_nombre, slug: torneo_slug },
        });
        totalTorneos++;
      }

      // Crear o reutilizar equipo
      let team = await prisma.team.findFirst({
        where: { tenantId: tenant.id, name: equipo_nombre },
      });
      if (!team) {
        team = await prisma.team.create({
          data: { name: equipo_nombre, tenantId: tenant.id },
        });
        totalEquipos++;
      }

      // Crear jugador
      const player = await prisma.player.create({
        data: {
          name: jugador_nombre,
          number: jugador_numero ? Number(jugador_numero) : null,
          position: jugador_posicion || null,
          teamId: team.id,
        },
      });

      // Crear stats vacías
      await prisma.playerStat.create({
        data: { playerId: player.id },
      });

      totalJugadores++;
    }

    return NextResponse.json({
      message: `Importado: ${totalTorneos} torneos, ${totalEquipos} equipos, ${totalJugadores} jugadores`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}