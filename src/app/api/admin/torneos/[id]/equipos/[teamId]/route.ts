import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

  // SUPER_ADMIN puede todo
  // ADMIN puede administrar el torneo
  // CAPTAIN NO puede eliminar equipos
  if (role === "CAPTAIN") {
    return NextResponse.json(
      { error: "El capitán no puede eliminar equipos" },
      { status: 403 }
    );
  }

  if (!isSuperAdmin && role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar equipos" },
      { status: 403 }
    );
  }

  // Si no es SUPER_ADMIN, comprobar que pertenece al torneo
  if (!isSuperAdmin && sessionTenantId !== id) {
    return NextResponse.json(
      { error: "No tienes acceso a este torneo" },
      { status: 403 }
    );
  }

  // Comprobar que el equipo pertenece al torneo
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

  await prisma.$transaction(async (tx) => {
    await tx.playerStat.deleteMany({
      where: {
        player: {
          teamId,
        },
      },
    });

    await tx.player.deleteMany({
      where: {
        teamId,
      },
    });

    // Eliminar relación de los usuarios con el equipo
    await tx.tenantUser.updateMany({
      where: {
        teamId,
      },
      data: {
        teamId: null,
      },
    });

    await tx.team.delete({
      where: {
        id: teamId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
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

  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────
  // CAPITÁN
  // ─────────────────────────────────────

  if (role === "CAPTAIN") {
    // El capitán solamente puede modificar SU equipo
    if (sessionTeamId !== teamId) {
      return NextResponse.json(
        { error: "No puedes modificar otro equipo" },
        { status: 403 }
      );
    }

    // Además comprobamos que pertenece al torneo
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
      { error: "No tienes permisos para modificar equipos" },
      { status: 403 }
    );
  }

  // Comprobar que el equipo pertenece al torneo
  const existingTeam = await prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId: id,
    },
  });

  if (!existingTeam) {
    return NextResponse.json(
      { error: "Equipo no encontrado" },
      { status: 404 }
    );
  }

  const team = await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      name: name.trim(),
    },
  });

  return NextResponse.json({
    ok: true,
    team,
  });
}