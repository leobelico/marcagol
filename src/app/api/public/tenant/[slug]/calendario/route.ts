// app/api/public/tenants/[slug]/calendario/route.ts
//
// [slug] aquí es el slug del TORNEO (Tenant).
// Devuelve todos los partidos, ordenados por fecha ascendente.
// La app arma el texto de fecha/hora/status localmente (con la
// misma zona horaria America/Mexico_City) a partir del ISO date + status.
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

    const matches = await prisma.match.findMany({
      where: { tenantId: tenant.id },
      include: { homeTeam: true, awayTeam: true, referee: true },
      orderBy: { date: "asc" },
    });

    const result = matches.map((m) => ({
      id: m.id,
      date: m.date, // ISO string; la app formatea con America/Mexico_City
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      cancha: m.cancha,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, logo: m.homeTeam.logo },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, logo: m.awayTeam.logo },
      referee: m.referee ? { name: m.referee.name } : null,
    }));

    return NextResponse.json({ tenant, matches: result });
  } catch (error) {
    console.error("Error fetching calendario:", error);
    return NextResponse.json(
      { error: "Error al obtener calendario" },
      { status: 500 }
    );
  }
}