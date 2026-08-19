import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ============================================================
    // AUTENTICACIÓN
    // ============================================================

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // ============================================================
    // PARAMS
    // ============================================================

    const { id: tenantId } = await params;

    // ============================================================
    // DATOS
    // ============================================================

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

    // ============================================================
    // VALIDACIONES
    // ============================================================

    if (!name) {
      return NextResponse.json(
        {
          error: "El nombre del equipo es obligatorio",
        },
        { status: 400 }
      );
    }

    if (!captain) {
      return NextResponse.json(
        {
          error: "El nombre del capitán es obligatorio",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "El teléfono del capitán es obligatorio",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // COMPROBAR QUE EL TORNEO EXISTE
    // ============================================================

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        {
          error: "El torneo no existe",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // PERMISOS
    // ============================================================

    const sessionUser = session.user as any;

    const role = sessionUser.role;
    const sessionTenantId = sessionUser.tenantId;
    const isSuperAdmin = sessionUser.isSuperAdmin;

    if (!isSuperAdmin) {
      if (role !== "ADMIN") {
        return NextResponse.json(
          {
            error: "No tienes permisos para crear equipos",
          },
          { status: 403 }
        );
      }

      if (sessionTenantId !== tenantId) {
        return NextResponse.json(
          {
            error: "No tienes acceso a este torneo",
          },
          { status: 403 }
        );
      }
    }

    // ============================================================
    // TELÉFONO
    // ============================================================

    const telefono = phone;

    // ============================================================
    // COMPROBAR TELÉFONO
    // ============================================================

    const usuarioExistente = await prisma.user.findUnique({
      where: {
        phone: telefono,
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        {
          error: "Ese teléfono ya está registrado",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CREAR EMAIL
    // ============================================================

    const nombreEmail = captain
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

    const email = `${nombreEmail}@marcagol.site`;

    // ============================================================
    // COMPROBAR EMAIL
    // ============================================================

    const emailExistente = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (emailExistente) {
      return NextResponse.json(
        {
          error: `Ya existe un usuario con el correo ${email}.`,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CONTRASEÑA INICIAL
    // ============================================================

    const ultimos3 = telefono
      .replace(/\D/g, "")
      .slice(-3);

    const passwordInicial =
      `${captain}${ultimos3}`;

    const passwordHash =
      await bcrypt.hash(passwordInicial, 10);

    // ============================================================
    // TRANSACCIÓN
    // ============================================================

    const result = await prisma.$transaction(
      async (tx) => {

        // --------------------------------------------------------
        // 1. CREAR TEAM
        // --------------------------------------------------------

        const team = await tx.team.create({
          data: {
            name,
            captain,
            phone: telefono,
            tenantId,
          },
        });

        console.log(
          "TEAM CREADO:",
          team.id
        );

        // --------------------------------------------------------
        // 2. CREAR USER
        // --------------------------------------------------------

        const user = await tx.user.create({
          data: {
            name: captain,
            email,
            phone: telefono,
            password: passwordHash,
            isSuperAdmin: false,
          },
        });

        console.log(
          "USER CREADO:",
          user.id
        );

        // --------------------------------------------------------
        // 3. CREAR TENANT USER
        // --------------------------------------------------------

        const tenantUser =
          await tx.tenantUser.create({
            data: {
              userId: user.id,
              tenantId,
              teamId: team.id,
              role: "CAPTAIN",
            },
          });

        console.log(
          "TENANT USER CREADO:",
          tenantUser.id
        );

        return {
          team,
          user,
          tenantUser,
        };
      }
    );

    // ============================================================
    // RESPUESTA
    // ============================================================

    return NextResponse.json(
      {
        ok: true,

        team: result.team,

        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
        },

        tenantUser: {
          id: result.tenantUser.id,
          userId: result.tenantUser.userId,
          tenantId: result.tenantUser.tenantId,
          teamId: result.tenantUser.teamId,
          role: result.tenantUser.role,
        },

        captainCredentials: {
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          password: passwordInicial,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error: any) {

    // ============================================================
    // ERROR
    // ============================================================

    console.error(
      "========================================"
    );

    console.error(
      "ERROR CREANDO EQUIPO/CAPITÁN"
    );

    console.error(error);

    console.error(
      "========================================"
    );

    // Error típico de UNIQUE en Prisma
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "Ya existe un registro con ese teléfono o correo electrónico.",
          campo:
            error?.meta?.target ?? null,
        },
        { status: 400 }
      );
    }

    // Error de relación
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Error de relación entre usuario, torneo y equipo.",
          details:
            error?.meta ?? null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Error al crear el equipo y el usuario.",
        details:
          error?.message ?? "Error desconocido",
      },
      { status: 500 }
    );
  }
}