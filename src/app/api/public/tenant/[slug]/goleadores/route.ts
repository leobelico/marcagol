// app/api/public/tenants/[slug]/goleadores/route.ts
//
// [slug] aquí es el slug del TORNEO (Tenant).
// Misma lógica que sitio/goleadores/page.tsx: ordena por goles descendente.
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

    const players = await prisma.player.findMany({
      where: { team: { tenantId: tenant.id } },
      include: { stats: true, team: true },
    });

    const sorted = players
      .map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        team: { id: p.team.id, name: p.team.name },
        goals: p.stats[0]?.goals ?? 0,
        assists: p.stats[0]?.assists ?? 0,
        yellow: p.stats[0]?.yellow ?? 0,
        red: p.stats[0]?.red ?? 0,
      }))
      .sort((a, b) => b.goals - a.goals);

    return NextResponse.json({ tenant, players: sorted });
  } catch (error) {
    console.error("Error fetching goleadores:", error);
    return NextResponse.json(
      { error: "Error al obtener goleadores" },
      { status: 500 }
    );
  }
}