// app/api/organizations/route.ts
//
// Lista pública de ligas (organizaciones) para la app. Además de nombre
// y logo, regresa números para las tarjetas de inicio: torneos activos,
// equipos, partidos jugados, goles y partidos en vivo. Solo cuenta
// torneos no archivados.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [organizations, finished, live] = await Promise.all([
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          contactName: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          tenants: {
            where: { archived: false },
            select: { _count: { select: { teams: true } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.match.findMany({
        where: { status: "FINISHED", tenant: { archived: false, organizationId: { not: null } } },
        select: { homeScore: true, awayScore: true, tenant: { select: { organizationId: true } } },
      }),
      prisma.match.findMany({
        where: { status: "LIVE", tenant: { archived: false, organizationId: { not: null } } },
        select: { tenant: { select: { organizationId: true } } },
      }),
    ]);

    const jugados = new Map<string, { partidos: number; goles: number }>();
    for (const m of finished) {
      const id = m.tenant.organizationId!;
      const s = jugados.get(id) ?? { partidos: 0, goles: 0 };
      s.partidos++;
      s.goles += (m.homeScore ?? 0) + (m.awayScore ?? 0);
      jugados.set(id, s);
    }
    const enVivo = new Map<string, number>();
    for (const m of live) {
      const id = m.tenant.organizationId!;
      enVivo.set(id, (enVivo.get(id) ?? 0) + 1);
    }

    return NextResponse.json({
      organizations: organizations.map(({ tenants, ...org }) => ({
        ...org,
        stats: {
          torneos: tenants.length,
          equipos: tenants.reduce((n, t) => n + t._count.teams, 0),
          partidos: jugados.get(org.id)?.partidos ?? 0,
          goles: jugados.get(org.id)?.goles ?? 0,
          enVivo: enVivo.get(org.id) ?? 0,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Error al obtener organizaciones" },
      { status: 500 }
    );
  }
}
