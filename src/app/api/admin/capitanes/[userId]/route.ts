import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ======================================================
// POST - RESTABLECER CONTRASEÑA DE UN CAPITÁN
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

    // Solo super admin puede resetear contraseñas de capitanes
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Capitán no encontrado" },
        { status: 404 }
      );
    }

    if (!usuario.phone) {
      return NextResponse.json(
        {
          error:
            "Este usuario no tiene teléfono registrado, no se puede generar una contraseña con el patrón habitual",
        },
        { status: 400 }
      );
    }

    // Mismo patrón que al crear: nombre + últimos 3 dígitos del teléfono
    const ultimos3 = usuario.phone.replace(/\D/g, "").slice(-3);
    const nombreBase = (usuario.name || "capitan").trim();

    const passwordNueva = `${nombreBase}${ultimos3}`;

    const passwordHash = await bcrypt.hash(passwordNueva, 10);

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
    console.error("ERROR RESETEANDO CONTRASEÑA:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al restablecer la contraseña",
      },
      { status: 500 }
    );
  }
}