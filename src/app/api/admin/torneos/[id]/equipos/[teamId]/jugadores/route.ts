import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; teamId: string }>;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id, teamId } = await params;

  const role = (session.user as any).role;
  const sessionTeamId = (session.user as any).teamId;
  const sessionTenantId = (session.user as any).tenantId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // ─────────────────────────────────────
  // CAPITÁN
  // ─────────────────────────────────────

  if (role === "CAPTAIN") {
    // Solo puede agregar jugadores a SU equipo
    if (sessionTeamId !== teamId) {
      return NextResponse.json(
        { error: "No tienes permiso para este equipo" },
        { status: 403 }
      );
    }

    // El equipo debe pertenecer a su torneo
    if (sessionTenantId !== id) {
      return NextResponse.json(
        { error: "No tienes acceso a este torneo" },
        { status: 403 }
      );
    }
  }

  // ─────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────

  else if (role === "ADMIN") {
    if (!isSuperAdmin && sessionTenantId !== id) {
      return NextResponse.json(
        { error: "No tienes acceso a este torneo" },
        { status: 403 }
      );
    }
  }

  // ─────────────────────────────────────
  // SUPER ADMIN
  // ─────────────────────────────────────

  else if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "No tienes permisos para crear jugadores" },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────
  // DATOS DEL JUGADOR
  // ─────────────────────────────────────

  const { name, number, position } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre del jugador es obligatorio" },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────
  // VERIFICAR EQUIPO
  // ─────────────────────────────────────

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId: id,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Equipo no encontrado" },
      { status: 404 }
    );
  }

  // ─────────────────────────────────────
  // CREAR JUGADOR
  // ─────────────────────────────────────

  const player = await prisma.player.create({
    data: {
      name: name.trim(),

      number:
        number !== null &&
        number !== "" &&
        number !== undefined
          ? Number(number)
          : null,

      position: position || null,

      teamId,

      stats: {
        create: {},
      },
    },
  });

  return NextResponse.json(player);
}