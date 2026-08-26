// app/api/public/admin/equipo/[teamId]/jugadores/route.ts
//
// GET: lista la plantilla de un equipo.
// POST: crea un jugador nuevo en ese equipo.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, tenantId: true },
    });
    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== team.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este equipo" },
        { status: 403 }
      );
    }

    const players = await prisma.player.findMany({
      where: { teamId: team.id },
      include: { stats: true },
      orderBy: { name: "asc" },
    });

    const result = players.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      photo: p.photo,
      goals: p.stats[0]?.goals ?? 0,
    }));

    return NextResponse.json({
      team: { id: team.id, name: team.name },
      players: result,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching jugadores:", error);
    return NextResponse.json(
      { error: "Error al obtener jugadores" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { teamId } = await params;
    const body = await request.json();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, tenantId: true },
    });
    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== team.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este equipo" },
        { status: 403 }
      );
    }

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del jugador es obligatorio" },
        { status: 400 }
      );
    }

    const number =
      body?.number !== undefined && body?.number !== null && body?.number !== ""
        ? Number(body.number)
        : null;
    const position = body?.position ? String(body.position).trim() : null;

    const player = await prisma.player.create({
      data: {
        name,
        number: Number.isFinite(number) ? number : null,
        position,
        teamId: team.id,
        stats: { create: {} }, // fila PlayerStat en 0, igual que el resto
      },
      include: { stats: true },
    });

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
        photo: player.photo,
        goals: player.stats[0]?.goals ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error creando jugador:", error);
    return NextResponse.json(
      { error: "Error al crear jugador" },
      { status: 500 }
    );
  }
}