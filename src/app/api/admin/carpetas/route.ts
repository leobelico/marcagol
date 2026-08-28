import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * =========================================================
 * CREAR CARPETA
 * =========================================================
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isSuperAdmin = (session.user as any).isSuperAdmin;

    // Por ahora las carpetas las administra SUPER_ADMIN.
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para crear carpetas" },
        { status: 403 }
      );
    }

    const { name, organizationId } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre de la carpeta es obligatorio" },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "La organización es obligatoria" },
        { status: 400 }
      );
    }

    // Comprobar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Evitar carpetas duplicadas dentro de la misma organización
    const existingFolder = await prisma.tenantFolder.findFirst({
      where: {
        organizationId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: "Ya existe una carpeta con ese nombre" },
        { status: 409 }
      );
    }

    const folder = await prisma.tenantFolder.create({
      data: {
        name: name.trim(),
        organizationId,
      },
    });

    return NextResponse.json(folder, {
      status: 201,
    });
  } catch (error) {
    console.error("ERROR CREANDO CARPETA:", error);

    return NextResponse.json(
      { error: "No se pudo crear la carpeta" },
      { status: 500 }
    );
  }
}

/**
 * =========================================================
 * RENOMBRAR CARPETA
 * =========================================================
 */
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

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar carpetas" },
        { status: 403 }
      );
    }

    const { id, name } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "El ID de la carpeta es obligatorio" },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre de la carpeta es obligatorio" },
        { status: 400 }
      );
    }

    const folder = await prisma.tenantFolder.findUnique({
      where: {
        id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Carpeta no encontrada" },
        { status: 404 }
      );
    }

    // Evitar nombres duplicados
    const existingFolder = await prisma.tenantFolder.findFirst({
      where: {
        organizationId: folder.organizationId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: "Ya existe otra carpeta con ese nombre" },
        { status: 409 }
      );
    }

    const updatedFolder = await prisma.tenantFolder.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("ERROR RENOMBRANDO CARPETA:", error);

    return NextResponse.json(
      { error: "No se pudo renombrar la carpeta" },
      { status: 500 }
    );
  }
}

/**
 * =========================================================
 * ELIMINAR CARPETA
 * =========================================================
 *
 * IMPORTANTE:
 * NO eliminamos los torneos.
 *
 * Los torneos que estaban dentro de la carpeta
 * simplemente quedan sin carpeta.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isSuperAdmin = (session.user as any).isSuperAdmin;

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar carpetas" },
        { status: 403 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "El ID de la carpeta es obligatorio" },
        { status: 400 }
      );
    }

    const folder = await prisma.tenantFolder.findUnique({
      where: {
        id,
      },
      include: {
        tenants: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Carpeta no encontrada" },
        { status: 404 }
      );
    }

    // Sacar los torneos de la carpeta antes de eliminarla.
    await prisma.tenant.updateMany({
      where: {
        folderId: id,
      },
      data: {
        folderId: null,
      },
    });

    await prisma.tenantFolder.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Carpeta eliminada correctamente",
      torneosLiberados: folder.tenants.length,
    });
  } catch (error) {
    console.error("ERROR ELIMINANDO CARPETA:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar la carpeta" },
      { status: 500 }
    );
  }
}