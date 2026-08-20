import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    // SI NO HAY USUARIO CAPITÁN TODAVÍA, PREPARAR
    // EMAIL Y CONTRASEÑA PARA CREARLO EN LA TRANSACCIÓN
    // (MISMA LÓGICA QUE AL CREAR EQUIPO)
    // --------------------------------------------------

    const necesitaCrearUsuario = !tenantUser?.userId;

    let emailNuevoUsuario = "";
    let passwordInicial = "";
    let passwordHash = "";

    if (necesitaCrearUsuario) {
      const emailBase = captain
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "");

      emailNuevoUsuario = `${emailBase}@marcagol.site`;

      // Comprobar que el teléfono no esté ya usado por otro user
      // (ya se validó arriba si cambió, pero si es creación nueva
      // también hay que validarlo aunque el teléfono no "cambió"
      // porque antes el equipo no tenía usuario)

      const usuarioConEseTelefono = await prisma.user.findFirst({
        where: {
          phone,
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

      const usuarioConEseEmail = await prisma.user.findUnique({
        where: {
          email: emailNuevoUsuario,
        },
      });

      if (usuarioConEseEmail) {
        return NextResponse.json(
          {
            error:
              "Ese capitán ya tiene un usuario registrado",
            email: emailNuevoUsuario,
          },
          { status: 400 }
        );
      }

      const ultimos3 = phone.replace(/\D/g, "").slice(-3);

      passwordInicial = `${captain}${ultimos3}`;

      passwordHash = await bcrypt.hash(passwordInicial, 10);
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
      // 2A. SI YA EXISTE USUARIO DEL CAPITÁN, ACTUALIZAR
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

        // ----------------------------------------------
        // 3A. ASEGURAR RELACIÓN TENANT USER
        // ----------------------------------------------

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

        return { team, nuevoUsuario: null as null };
      }

      // ----------------------------------------------
      // 2B. NO EXISTÍA USUARIO -> CREARLO AHORA
      // ----------------------------------------------

      const nuevoUsuario = await tx.user.create({
        data: {
          name: captain,
          email: emailNuevoUsuario,
          phone,
          password: passwordHash,
          isSuperAdmin: false,
        },
      });

      // ----------------------------------------------
      // 3B. CREAR O ACTUALIZAR TENANT USER
      // ----------------------------------------------

      if (tenantUser) {
        // Existía un tenantUser huérfano (sin userId) -> enlazarlo
        await tx.tenantUser.update({
          where: {
            id: tenantUser.id,
          },
          data: {
            userId: nuevoUsuario.id,
            teamId: team.id,
            tenantId: id,
            role: "CAPTAIN",
          },
        });
      } else {
        await tx.tenantUser.create({
          data: {
            userId: nuevoUsuario.id,
            tenantId: id,
            teamId: team.id,
            role: "CAPTAIN",
          },
        });
      }

      return { team, nuevoUsuario };
    });

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return NextResponse.json({
      ok: true,
      team: result.team,
      ...(result.nuevoUsuario
        ? {
            captainCredentials: {
              name: result.nuevoUsuario.name,
              email: result.nuevoUsuario.email,
              phone: result.nuevoUsuario.phone,
              password: passwordInicial,
            },
          }
        : {}),
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