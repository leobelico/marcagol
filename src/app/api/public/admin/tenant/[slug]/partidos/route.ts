// app/api/public/admin/tenant/[slug]/partidos/route.ts
//
// Lista los partidos de un torneo para que el admin capture resultados.
// Verifica que el admin tenga permiso sobre ESE tenant específico
// (SUPER_ADMIN siempre puede; un ADMIN normal solo si es su tenantId).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
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

    if (!auth.isSuperAdmin && auth.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este torneo" },
        { status: 403 }
      );
    }

    const matches = await prisma.match.findMany({
      where: { tenantId: tenant.id },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: "asc" },
    });

    const result = matches.map((m) => ({
      id: m.id,
      date: m.date,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, logo: m.homeTeam.logo },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, logo: m.awayTeam.logo },
    }));

    return NextResponse.json({ tenant, matches: result });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching partidos admin:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}