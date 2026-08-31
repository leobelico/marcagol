import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ======================================================
// POST - CAMBIAR CONTRASEÑA DE UN CAPITÁN
// ======================================================

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ userId: string }>;
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

    const isSuperAdmin = (session.user as any).isSuperAdmin;

    // Solo super admin puede cambiar contraseñas
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    const body = await req.json().catch(() => ({}));

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Capitán no encontrado" },
        { status: 404 }
      );
    }

    // ======================================================
    // CONTRASEÑA PERSONALIZADA
    // ======================================================

    let passwordNueva = "";

    if (
      typeof body.password === "string" &&
      body.password.trim()
    ) {
      passwordNueva = body.password.trim();
    } else {
      // ======================================================
      // CONTRASEÑA AUTOMÁTICA
      // nombre + últimos 3 dígitos del teléfono
      // ======================================================

      if (!usuario.phone) {
        return NextResponse.json(
          {
            error:
              "Este usuario no tiene teléfono registrado y no se proporcionó una contraseña personalizada.",
          },
          { status: 400 }
        );
      }

      const ultimos3 = usuario.phone
        .replace(/\D/g, "")
        .slice(-3);

      const nombreBase = (usuario.name || "capitan").trim();

      passwordNueva = `${nombreBase}${ultimos3}`;
    }

    // ======================================================
    // VALIDAR CONTRASEÑA
    // ======================================================

    if (passwordNueva.length < 6) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // GENERAR HASH
    // ======================================================

    const passwordHash = await bcrypt.hash(
      passwordNueva,
      10
    );

    // ======================================================
    // ACTUALIZAR USUARIO
    // ======================================================

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
      },
    });

    return NextResponse.json({
      ok: true,
      credentials: {
        name: usuario.name,
        email: usuario.email,
        phone: usuario.phone,
        password: passwordNueva,
      },
    });
  } catch (error: any) {
    console.error(
      "ERROR CAMBIANDO CONTRASEÑA:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al cambiar la contraseña",
      },
      { status: 500 }
    );
  }
}