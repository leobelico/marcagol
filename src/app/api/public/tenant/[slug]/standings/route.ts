// app/api/public/tenants/[slug]/standings/route.ts
//
// [slug] aquí es el slug del TORNEO (Tenant), no de la organización.
// Misma lógica de cálculo que sitio/page.tsx (PosicionesPage):
// 3pts victoria, 1pt empate, excluye partidos de liguilla (bracketStage != null).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
      include: {
        homeMatches: {
          where: { status: "FINISHED", round: { bracketStage: null } },
        },
        awayMatches: {
          where: { status: "FINISHED", round: { bracketStage: null } },
        },
      },
    });

    const standings = teams
      .map((team) => {
        let pts = 0,
          w = 0,
          d = 0,
          l = 0,
          gf = 0,
          ga = 0;

        team.homeMatches.forEach((m) => {
          gf += m.homeScore ?? 0;
          ga += m.awayScore ?? 0;
          if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) {
            pts += 3;
            w++;
          } else if (m.homeScore === m.awayScore) {
            pts += 1;
            d++;
          } else {
            l++;
          }
        });

        team.awayMatches.forEach((m) => {
          gf += m.awayScore ?? 0;
          ga += m.homeScore ?? 0;
          if ((m.awayScore ?? 0) > (m.homeScore ?? 0)) {
            pts += 3;
            w++;
          } else if (m.homeScore === m.awayScore) {
            pts += 1;
            d++;
          } else {
            l++;
          }
        });

        return {
          team: { id: team.id, name: team.name, logo: team.logo },
          pts,
          pj: w + d + l,
          w,
          d,
          l,
          gf,
          ga,
          dif: gf - ga,
        };
      })
      .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);

    return NextResponse.json({ tenant, standings });
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Error al obtener tabla de posiciones" },
      { status: 500 }
    );
  }
}