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

  const memberships = ((session.user as any).memberships || []) as {
    tenantId: string;
    role: string;
    teamIds: string[];
  }[];
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  const membership = memberships.find((m) => m.tenantId === id);

  // --------------------------------------------------
  // PERMISOS
  // --------------------------------------------------

  if (membership?.role === "CAPTAIN") {
    return NextResponse.json(
      { error: "El capitán no puede eliminar equipos" },
      { status: 403 }
    );
  }

  if (!isSuperAdmin && !membership) {
    return NextResponse.json(
      { error: "No tienes acceso a este torneo" },
      { status: 403 }
    );
  }

  if (!isSuperAdmin && membership?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar equipos" },
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

    await tx.teamCaptain.deleteMany({
      where: {
        teamId,
      },
    });

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

    const memberships = ((session.user as any).memberships || []) as {
      tenantId: string;
      role: string;
      teamIds: string[];
    }[];
    const isSuperAdmin = (session.user as any).isSuperAdmin;

    const membership = memberships.find((m) => m.tenantId === id);

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

    const capitanUserId: string | null =
      typeof body.capitanUserId === "string" && body.capitanUserId
        ? body.capitanUserId
        : null;

    // --------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

    if (!capitanUserId) {
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
    }

    // --------------------------------------------------
    // PERMISOS
    // --------------------------------------------------

    if (!isSuperAdmin && !membership) {
      return NextResponse.json(
        { error: "No tienes acceso a este torneo" },
        { status: 403 }
      );
    }

    if (membership?.role === "CAPTAIN") {
      if (!membership.teamIds.includes(teamId)) {
        return NextResponse.json(
          { error: "No puedes modificar otro equipo" },
          { status: 403 }
        );
      }
    } else if (!isSuperAdmin && membership?.role !== "ADMIN") {
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
    // BUSCAR CAPITÁN ACTUAL DE ESTE EQUIPO (si tiene)
    // --------------------------------------------------

    const teamCaptainActual = await prisma.teamCaptain.findFirst({
      where: {
        teamId,
      },
      include: {
        tenantUser: {
          include: {
            user: true,
          },
        },
      },
    });

    // ====================================================
    // FLUJO A: REASIGNAR A UN CAPITÁN EXISTENTE DISTINTO
    // ====================================================

    if (capitanUserId) {
      const usuarioNuevo = await prisma.user.findUnique({
        where: { id: capitanUserId },
      });

      if (!usuarioNuevo) {
        return NextResponse.json(
          { error: "El capitán seleccionado no existe" },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const team = await tx.team.update({
          where: { id: teamId },
          data: {
            name,
            captain: usuarioNuevo.name,
            phone: usuarioNuevo.phone,
          },
        });

        if (
          teamCaptainActual &&
          teamCaptainActual.tenantUser.userId !== usuarioNuevo.id
        ) {
          await tx.teamCaptain.delete({
            where: { id: teamCaptainActual.id },
          });
        }

        let tenantUser = await tx.tenantUser.findUnique({
          where: {
            userId_tenantId: {
              userId: usuarioNuevo.id,
              tenantId: id,
            },
          },
        });

        if (!tenantUser) {
          tenantUser = await tx.tenantUser.create({
            data: {
              userId: usuarioNuevo.id,
              tenantId: id,
              role: "CAPTAIN",
            },
          });
        }

        const yaVinculado = await tx.teamCaptain.findUnique({
          where: {
            tenantUserId_teamId: {
              tenantUserId: tenantUser.id,
              teamId: team.id,
            },
          },
        });

        if (!yaVinculado) {
          await tx.teamCaptain.create({
            data: {
              tenantUserId: tenantUser.id,
              teamId: team.id,
            },
          });
        }

        return team;
      });

      return NextResponse.json({
        ok: true,
        team: result,
      });
    }

    // ====================================================
    // FLUJO B: EDITAR DATOS DEL CAPITÁN ACTUAL (o crear uno
    // nuevo si el equipo no tenía)
    // ====================================================

    if (phone !== existingTeam.phone) {
      const usuarioConEseTelefono = await prisma.user.findFirst({
        where: {
          phone,
          ...(teamCaptainActual?.tenantUser.userId
            ? {
                NOT: {
                  id: teamCaptainActual.tenantUser.userId,
                },
              }
            : {}),
        },
      });

      if (usuarioConEseTelefono) {
        return NextResponse.json(
          {
            error:
              "Ese teléfono ya está registrado en otro usuario. Búscalo en 'Capitán existente' para reutilizar su cuenta.",
          },
          { status: 400 }
        );
      }
    }

    const necesitaCrearUsuario = !teamCaptainActual;

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

      const usuarioConEseTelefono = await prisma.user.findFirst({
        where: { phone },
      });

      if (usuarioConEseTelefono) {
        return NextResponse.json(
          {
            error:
              "Ese teléfono ya está registrado en otro usuario. Búscalo en 'Capitán existente' para reutilizar su cuenta.",
          },
          { status: 400 }
        );
      }

      const usuarioConEseEmail = await prisma.user.findUnique({
        where: { email: emailNuevoUsuario },
      });

      if (usuarioConEseEmail) {
        return NextResponse.json(
          {
            error: "Ese capitán ya tiene un usuario registrado",
            email: emailNuevoUsuario,
          },
          { status: 400 }
        );
      }

      const ultimos3 = phone.replace(/\D/g, "").slice(-3);
      passwordInicial = `${captain}${ultimos3}`;
      passwordHash = await bcrypt.hash(passwordInicial, 10);
    }

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: {
          name,
          captain,
          phone,
        },
      });

      if (teamCaptainActual) {
        await tx.user.update({
          where: { id: teamCaptainActual.tenantUser.userId },
          data: {
            name: captain,
            phone,
          },
        });

        return { team, nuevoUsuario: null as null };
      }

      const nuevoUsuario = await tx.user.create({
        data: {
          name: captain,
          email: emailNuevoUsuario,
          phone,
          password: passwordHash,
          isSuperAdmin: false,
        },
      });

      const tenantUser = await tx.tenantUser.create({
        data: {
          userId: nuevoUsuario.id,
          tenantId: id,
          role: "CAPTAIN",
        },
      });

      await tx.teamCaptain.create({
        data: {
          tenantUserId: tenantUser.id,
          teamId: team.id,
        },
      });

      return { team, nuevoUsuario };
    });

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