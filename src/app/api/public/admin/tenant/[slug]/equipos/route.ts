// app/api/public/admin/tenant/[slug]/equipos/route.ts
//
// Lista los equipos de un torneo, para que el admin elija cuál
// administrar (ver/editar plantilla de jugadores).
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

    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        logo: true,
        _count: { select: { players: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      logo: t.logo,
      playerCount: t._count.players,
    }));

    return NextResponse.json({ tenant, teams: result });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching equipos admin:", error);
    return NextResponse.json(
      { error: "Error al obtener equipos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { slug } = await params;
    const body = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
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

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: { name, tenantId: tenant.id },
    });

    return NextResponse.json({
      team: { id: team.id, name: team.name, logo: team.logo, playerCount: 0 },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error creando equipo:", error);
    return NextResponse.json(
      { error: "Error al crear equipo" },
      { status: 500 }
    );
  }
}