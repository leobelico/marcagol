import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET - BUSCAR EQUIPOS EN OTROS TORNEOS (POR NOMBRE)
// ======================================================

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const role = (session.user as any).role;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  if (!isSuperAdmin && role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para buscar equipos" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ teams: [] });
  }

  // --------------------------------------------------
  // BUSCAR EQUIPOS EN OTROS TORNEOS
  // --------------------------------------------------

  const teams = await prisma.team.findMany({
    where: {
      tenantId: {
        not: id,
      },
      name: {
        contains: q,
        mode: "insensitive",
      },
      // Si no es super admin, solo puede traer equipos de
      // torneos donde también es ADMIN
      ...(isSuperAdmin
        ? {}
        : {
            tenant: {
              users: {
                some: {
                  userId: session.user.id,
                  role: "ADMIN",
                },
              },
            },
          }),
    },
    select: {
      id: true,
      name: true,
      logo: true,
      captain: true,
      phone: true,
      tenant: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          players: true,
        },
      },
    },
    take: 15,
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({ teams });
}

// ======================================================
// POST - IMPORTAR EQUIPO (CON JUGADORES, SIN ESTADÍSTICAS)
// ======================================================

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
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

    const { id } = await params;

    const role = (session.user as any).role;
    const sessionTenantId = (session.user as any).tenantId;
    const isSuperAdmin = (session.user as any).isSuperAdmin;

    // --------------------------------------------------
    // PERMISOS
    // --------------------------------------------------

    if (!isSuperAdmin && role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para importar equipos" },
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
    // LEER DATOS
    // --------------------------------------------------

    const body = await req.json();

    const sourceTeamId =
      typeof body.sourceTeamId === "string"
        ? body.sourceTeamId
        : "";

    if (!sourceTeamId) {
      return NextResponse.json(
        { error: "Falta el equipo a importar" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // COMPROBAR TORNEO DESTINO
    // --------------------------------------------------

    const torneoDestino = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!torneoDestino) {
      return NextResponse.json(
        { error: "Torneo destino no encontrado" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // BUSCAR EQUIPO ORIGEN CON JUGADORES Y CAPITÁN
    // --------------------------------------------------

    const equipoOrigen = await prisma.team.findUnique({
      where: { id: sourceTeamId },
      include: {
        players: true,
        // captains ahora es TeamCaptain[] (N a N), cada uno
        // apunta a un TenantUser -> User
        captains: {
          include: {
            tenantUser: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!equipoOrigen) {
      return NextResponse.json(
        { error: "Equipo origen no encontrado" },
        { status: 404 }
      );
    }

    if (equipoOrigen.tenantId === id) {
      return NextResponse.json(
        { error: "Ese equipo ya pertenece a este torneo" },
        { status: 400 }
      );
    }

    // El TeamCaptain (vínculo) cuyo TenantUser tiene rol CAPTAIN
    // en el torneo ORIGEN (si existe)
    const capitanOrigen = equipoOrigen.captains.find(
      (c) => c.tenantUser.role === "CAPTAIN"
    );

    // --------------------------------------------------
    // COMPROBAR SI YA HAY UN EQUIPO CON ESE NOMBRE
    // EN EL TORNEO DESTINO (evitar duplicados accidentales)
    // --------------------------------------------------

    const nombreDuplicado = await prisma.team.findFirst({
      where: {
        tenantId: id,
        name: equipoOrigen.name,
      },
    });

    if (nombreDuplicado) {
      return NextResponse.json(
        {
          error:
            "Ya existe un equipo con ese nombre en este torneo",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // TRANSACCIÓN: CREAR TEAM + PLAYERS + TEAMCAPTAIN
    // --------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      // ----------------------------------------------
      // 1. CREAR TEAM NUEVO EN EL TORNEO DESTINO
      // ----------------------------------------------

      const teamNuevo = await tx.team.create({
        data: {
          name: equipoOrigen.name,
          captain: equipoOrigen.captain,
          phone: equipoOrigen.phone,
          logo: equipoOrigen.logo,
          tenantId: id,
        },
      });

      // ----------------------------------------------
      // 2. CREAR JUGADORES NUEVOS (SIN ESTADÍSTICAS)
      // ----------------------------------------------

      if (equipoOrigen.players.length > 0) {
        await tx.player.createMany({
          data: equipoOrigen.players.map((p) => ({
            name: p.name,
            number: p.number,
            position: p.position,
            photo: p.photo,
            teamId: teamNuevo.id,
          })),
        });
      }

      // ----------------------------------------------
      // 3. ENLAZAR AL MISMO USUARIO CAPITÁN (SI EXISTE)
      //    Ahora vía TeamCaptain (N a N) en vez de
      //    TenantUser.teamId
      // ----------------------------------------------

      if (capitanOrigen) {
        const userId = capitanOrigen.tenantUser.userId;

        // Asegurar TenantUser para ese usuario en el torneo destino
        let tenantUserDestino = await tx.tenantUser.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId: id,
            },
          },
        });

        if (!tenantUserDestino) {
          tenantUserDestino = await tx.tenantUser.create({
            data: {
              userId,
              tenantId: id,
              role: "CAPTAIN",
            },
          });
        }

        // Crear el vínculo TeamCaptain con el equipo nuevo
        // (si no existía ya, aunque aquí siempre es nuevo)
        const yaVinculado = await tx.teamCaptain.findUnique({
          where: {
            tenantUserId_teamId: {
              tenantUserId: tenantUserDestino.id,
              teamId: teamNuevo.id,
            },
          },
        });

        if (!yaVinculado) {
          await tx.teamCaptain.create({
            data: {
              tenantUserId: tenantUserDestino.id,
              teamId: teamNuevo.id,
            },
          });
        }
      }

      return teamNuevo;
    });

    return NextResponse.json({
      ok: true,
      team: result,
    });
  } catch (error: any) {
    console.error("ERROR IMPORTANDO EQUIPO:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al importar el equipo",
      },
      { status: 500 }
    );
  }
}