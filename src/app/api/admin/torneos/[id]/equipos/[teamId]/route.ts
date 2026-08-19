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
  const sessionTenantId = (session.user as any).tenantId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // --------------------------------------------------
  // PERMISOS
  // --------------------------------------------------

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

  if (!isSuperAdmin && sessionTenantId !== id) {
    return NextResponse.json(
      { error: "No tienes acceso a este torneo" },
      { status: 403 }
    );
  }

  // --------------------------------------------------
  // COMPROBAR EQUIPO
  // --------------------------------------------------

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

  // --------------------------------------------------
  // ELIMINAR TODO LO RELACIONADO
  // --------------------------------------------------

  await prisma.$transaction(async (tx) => {
    // Estadísticas de jugadores
    await tx.playerStat.deleteMany({
      where: {
        player: {
          teamId,
        },
      },
    });

    // Jugadores
    await tx.player.deleteMany({
      where: {
        teamId,
      },
    });

    // Usuarios relacionados con este equipo
    await tx.tenantUser.updateMany({
      where: {
        teamId,
      },
      data: {
        teamId: null,
      },
    });

    // Finalmente eliminar equipo
    await tx.team.delete({
      where: {
        id: teamId,
      },
    });
  });

  return NextResponse.json({
    ok: true,
  });
}


// ======================================================
// PATCH - EDITAR EQUIPO
// ======================================================

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; teamId: string }>;
  }
) {
  try {
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

    // --------------------------------------------------
    // LEER DATOS
    // --------------------------------------------------

    const body = await req.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const captain =
      typeof body.captain === "string"
        ? body.captain.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    // --------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

    if (!captain) {
      return NextResponse.json(
        { error: "El nombre del capitán es obligatorio" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "El teléfono del capitán es obligatorio" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // PERMISOS CAPITÁN
    // --------------------------------------------------

    if (role === "CAPTAIN") {
      if (sessionTeamId !== teamId) {
        return NextResponse.json(
          { error: "No puedes modificar otro equipo" },
          { status: 403 }
        );
      }

      if (sessionTenantId !== id) {
        return NextResponse.json(
          { error: "No tienes acceso a este torneo" },
          { status: 403 }
        );
      }
    }

    // --------------------------------------------------
    // PERMISOS ADMIN
    // --------------------------------------------------

    else if (role === "ADMIN") {
      if (!isSuperAdmin && sessionTenantId !== id) {
        return NextResponse.json(
          { error: "No tienes acceso a este torneo" },
          { status: 403 }
        );
      }
    }

    // --------------------------------------------------
    // SUPER ADMIN
    // --------------------------------------------------

    else if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar equipos" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // BUSCAR EQUIPO
    // --------------------------------------------------

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

    // --------------------------------------------------
    // BUSCAR USUARIO DEL CAPITÁN
    // --------------------------------------------------

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        teamId: teamId,
        tenantId: id,
      },
      include: {
        user: true,
      },
    });

    // --------------------------------------------------
    // COMPROBAR TELÉFONO
    // --------------------------------------------------

    if (phone !== existingTeam.phone) {
      const usuarioConEseTelefono = await prisma.user.findFirst({
        where: {
          phone,
          ...(tenantUser?.userId
            ? {
                NOT: {
                  id: tenantUser.userId,
                },
              }
            : {}),
        },
      });

      if (usuarioConEseTelefono) {
        return NextResponse.json(
          {
            error:
              "Ese teléfono ya está registrado en otro usuario",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // ACTUALIZAR TODO EN UNA TRANSACCIÓN
    // --------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      // ----------------------------------------------
      // 1. ACTUALIZAR TEAM
      // ----------------------------------------------

      const team = await tx.team.update({
        where: {
          id: teamId,
        },
        data: {
          name,
          captain,
          phone,
        },
      });

      // ----------------------------------------------
      // 2. SI EXISTE USUARIO DEL CAPITÁN
      // ----------------------------------------------

      if (tenantUser?.userId) {
        await tx.user.update({
          where: {
            id: tenantUser.userId,
          },
          data: {
            name: captain,
            phone,
          },
        });
      }

      // ----------------------------------------------
      // 3. ASEGURAR RELACIÓN TENANT USER
      // ----------------------------------------------

      if (tenantUser) {
        await tx.tenantUser.update({
          where: {
            id: tenantUser.id,
          },
          data: {
            teamId: team.id,
            tenantId: id,
            role: "CAPTAIN",
          },
        });
      }

      return team;
    });

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return NextResponse.json({
      ok: true,
      team: result,
    });
  } catch (error: any) {
    console.error("ERROR ACTUALIZANDO EQUIPO:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al actualizar el equipo",
      },
      { status: 500 }
    );
  }
}