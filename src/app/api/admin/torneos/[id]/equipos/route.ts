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

    console.log("=================================");
    console.log("CREANDO EQUIPO");
    console.log("TORNEO ID:", id);

    // ─────────────────────────────────────
    // LEER DATOS
    // ─────────────────────────────────────

    const body = await req.json();

    console.log("BODY RECIBIDO:", body);

    const { name, captain, phone } = body;

    // ─────────────────────────────────────
    // VALIDACIONES
    // ─────────────────────────────────────

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

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

    // ─────────────────────────────────────
    // LIMPIAR DATOS
    // ─────────────────────────────────────

    const nombreEquipo = name.trim();
    const nombreCapitan = captain.trim();
    const telefono = phone.trim();

    // ─────────────────────────────────────
    // GENERAR EMAIL
    // ─────────────────────────────────────

    const emailBase = nombreCapitan
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");

    const email = `${emailBase}@marcagol.site`;

    console.log("EMAIL GENERADO:", email);

    // ─────────────────────────────────────
    // COMPROBAR TELÉFONO
    // ─────────────────────────────────────

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

    // ─────────────────────────────────────
    // COMPROBAR EMAIL
    // ─────────────────────────────────────

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

    // ─────────────────────────────────────
    // PASSWORD INICIAL
    // ─────────────────────────────────────

    const ultimos3 = telefono
      .replace(/\D/g, "")
      .slice(-3);

    const passwordInicial = `${nombreCapitan}${ultimos3}`;

    const passwordHash = await bcrypt.hash(
      passwordInicial,
      10
    );

    console.log("PASSWORD GENERADA");

    // ─────────────────────────────────────
    // TRANSACCIÓN
    // ─────────────────────────────────────

    const result = await prisma.$transaction(async (tx) => {
      // ─────────────────────────────────
      // 1. CREAR EQUIPO
      // ─────────────────────────────────

      console.log("1. CREANDO TEAM...");

      const team = await tx.team.create({
        data: {
          name: nombreEquipo,
          captain: nombreCapitan,
          phone: telefono,
          tenantId: id,
        },
      });

      console.log("TEAM CREADO:", team.id);

      // ─────────────────────────────────
      // 2. CREAR USER
      // ─────────────────────────────────

      console.log("2. CREANDO USER...");

      const user = await tx.user.create({
        data: {
          name: nombreCapitan,
          email,
          phone: telefono,
          password: passwordHash,
          isSuperAdmin: false,
        },
      });

      console.log("USER CREADO:", user.id);

      // ─────────────────────────────────
      // 3. RELACIONAR USER CON TORNEO
      // ─────────────────────────────────

      console.log("3. CREANDO TENANT USER...");

      const tenantUser = await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: id,
          teamId: team.id,
          role: "CAPTAIN",
        },
      });

      console.log(
        "TENANT USER CREADO:",
        tenantUser.id
      );

      // ─────────────────────────────────
      // DEVOLVER RESULTADO
      // ─────────────────────────────────

      return {
        team,
        user,
        tenantUser,
        passwordInicial,
      };
    });

    console.log("=================================");
    console.log("TODO CREADO CORRECTAMENTE");
    console.log("TEAM:", result.team.id);
    console.log("USER:", result.user.id);
    console.log("TENANT USER:", result.tenantUser.id);
    console.log("=================================");

    // ─────────────────────────────────────
    // RESPUESTA
    // ─────────────────────────────────────

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
    // ─────────────────────────────────────
    // ERROR
    // ─────────────────────────────────────

    console.error("=================================");
    console.error("ERROR CREANDO EQUIPO:");
    console.error(error);
    console.error("=================================");

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