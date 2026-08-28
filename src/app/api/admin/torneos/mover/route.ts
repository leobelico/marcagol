import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isSuperAdmin = (session.user as any).isSuperAdmin;
    const role = (session.user as any).role;

    // Por ahora permitimos SUPER_ADMIN y ADMIN.
    if (!isSuperAdmin && role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para mover torneos" },
        { status: 403 }
      );
    }

    const { tenantId, folderId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "El ID del torneo es obligatorio" },
        { status: 400 }
      );
    }

    // =========================================================
    // BUSCAR TORNEO
    // =========================================================

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // =========================================================
    // COMPROBAR PERMISOS DEL ADMIN
    // =========================================================

if (!isSuperAdmin) {
  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Usuario no identificado" },
      { status: 401 }
    );
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  });

  if (!tenantUser || tenantUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes acceso a este torneo" },
      { status: 403 }
    );
  }
}
    // =========================================================
    // SACAR DE CARPETA
    // =========================================================

    if (folderId === null || folderId === undefined || folderId === "") {
      const updatedTenant = await prisma.tenant.update({
        where: {
          id: tenantId,
        },
        data: {
          folderId: null,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Torneo sacado de la carpeta",
        tenant: updatedTenant,
      });
    }

    // =========================================================
    // BUSCAR CARPETA
    // =========================================================

    const folder = await prisma.tenantFolder.findUnique({
      where: {
        id: folderId,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Carpeta no encontrada" },
        { status: 404 }
      );
    }

    // =========================================================
    // MUY IMPORTANTE
    //
    // La carpeta debe pertenecer a la misma organización
    // que el torneo.
    // =========================================================

    if (
      folder.organizationId !== tenant.organizationId
    ) {
      return NextResponse.json(
        {
          error:
            "No puedes mover un torneo a una carpeta de otra organización",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // MOVER TORNEO
    // =========================================================

    const updatedTenant = await prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        folderId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Torneo movido correctamente",
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("ERROR MOVIENDO TORNEO:", error);

    return NextResponse.json(
      { error: "No se pudo mover el torneo" },
      { status: 500 }
    );
  }
}