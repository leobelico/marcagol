import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ─────────────────────────────────────
    // AUTENTICACIÓN
    // ─────────────────────────────────────

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────
    // OBTENER ID DEL TORNEO
    // ─────────────────────────────────────

    const { id } = await params;

    // ─────────────────────────────────────
    // LEER DATOS
    // ─────────────────────────────────────

    const body = await req.json();

    const { name, captain, phone } = body;

    // capitanUserId: si viene, se está reutilizando un
    // capitán YA EXISTENTE en vez de crear uno nuevo
    const capitanUserId: string | null =
      typeof body.capitanUserId === "string" && body.capitanUserId
        ? body.capitanUserId
        : null;

    // ─────────────────────────────────────
    // VALIDACIONES
    // ─────────────────────────────────────

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

    // Si NO se está reutilizando un capitán existente,
    // captain y phone son obligatorios (flujo de siempre)
    if (!capitanUserId) {
      if (!captain?.trim()) {
        return NextResponse.json(
          { error: "El nombre del capitán es obligatorio" },
          { status: 400 }
        );
      }

      if (!phone?.trim()) {
        return NextResponse.json(
          { error: "El teléfono del capitán es obligatorio" },
          { status: 400 }
        );
      }
    }

    const nombreEquipo = name.trim();

    // ─────────────────────────────────────
    // FLUJO A: REUTILIZAR CAPITÁN EXISTENTE
    // ─────────────────────────────────────

    if (capitanUserId) {
      const usuarioExistente = await prisma.user.findUnique({
        where: { id: capitanUserId },
      });

      if (!usuarioExistente) {
        return NextResponse.json(
          { error: "El capitán seleccionado no existe" },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Crear equipo (guarda snapshot de nombre/teléfono
        //    del capitán en el propio Team, como ya hacías)
        const team = await tx.team.create({
          data: {
            name: nombreEquipo,
            captain: usuarioExistente.name,
            phone: usuarioExistente.phone,
            tenantId: id,
          },
        });

        // 2. Asegurar TenantUser para este usuario en este torneo
        let tenantUser = await tx.tenantUser.findUnique({
          where: {
            userId_tenantId: {
              userId: usuarioExistente.id,
              tenantId: id,
            },
          },
        });

        if (!tenantUser) {
          tenantUser = await tx.tenantUser.create({
            data: {
              userId: usuarioExistente.id,
              tenantId: id,
              role: "CAPTAIN",
            },
          });
        }

        // 3. Vincular el equipo nuevo a ese capitán (N a N)
        const teamCaptain = await tx.teamCaptain.create({
          data: {
            tenantUserId: tenantUser.id,
            teamId: team.id,
          },
        });

        return { team, tenantUser, teamCaptain };
      });

      return NextResponse.json({
        ok: true,
        team: result.team,
        // No hay credenciales nuevas que mostrar: el capitán
        // ya tenía su cuenta de antes.
      });
    }

    // ─────────────────────────────────────
    // FLUJO B: CREAR CAPITÁN NUEVO (comportamiento original)
    // ─────────────────────────────────────

    const nombreCapitan = captain.trim();
    const telefono = phone.trim();

    // GENERAR EMAIL

    const emailBase = nombreCapitan
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");

    const email = `${emailBase}@marcagol.site`;

    // COMPROBAR TELÉFONO

    const usuarioExistente = await prisma.user.findUnique({
      where: {
        phone: telefono,
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        {
          error:
            "Ese teléfono ya está registrado. Búscalo en 'Capitán existente' para reutilizar su cuenta.",
        },
        { status: 400 }
      );
    }

    // COMPROBAR EMAIL

    const usuarioEmailExistente = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (usuarioEmailExistente) {
      return NextResponse.json(
        {
          error: "Ese capitán ya tiene un usuario registrado",
          email,
        },
        { status: 400 }
      );
    }

    // PASSWORD INICIAL

    const ultimos3 = telefono.replace(/\D/g, "").slice(-3);

    const passwordInicial = `${nombreCapitan}${ultimos3}`;

    const passwordHash = await bcrypt.hash(passwordInicial, 10);

    // TRANSACCIÓN

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: nombreEquipo,
          captain: nombreCapitan,
          phone: telefono,
          tenantId: id,
        },
      });

      const user = await tx.user.create({
        data: {
          name: nombreCapitan,
          email,
          phone: telefono,
          password: passwordHash,
          isSuperAdmin: false,
        },
      });

      const tenantUser = await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: id,
          role: "CAPTAIN",
        },
      });

      const teamCaptain = await tx.teamCaptain.create({
        data: {
          tenantUserId: tenantUser.id,
          teamId: team.id,
        },
      });

      return {
        team,
        user,
        tenantUser,
        teamCaptain,
        passwordInicial,
      };
    });

    return NextResponse.json({
      ok: true,

      team: result.team,

      captainCredentials: {
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        password: result.passwordInicial,
      },
    });
  } catch (error) {
    console.error("ERROR CREANDO EQUIPO:", error);

    return NextResponse.json(
      {
        error: "Error creando equipo y usuario",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}