"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleArchivoTorneo(
  tenantId: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // =========================================================
  // OBTENER TORNEO
  // =========================================================

  const torneo = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      archived: true,
    },
  });

  if (!torneo) {
    throw new Error("Torneo no encontrado");
  }

  // =========================================================
  // SUPER ADMIN
  // =========================================================

  if (isSuperAdmin) {
    await prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        archived: !torneo.archived,
      },
    });

    revalidatePath("/admin");

    return;
  }

  // =========================================================
  // ADMIN NORMAL
  // =========================================================

  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: session.user.id,
      tenantId,
      role: "ADMIN",
    },
  });

  if (!tenantUser) {
    throw new Error("No tienes permiso para modificar este torneo");
  }

  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  await prisma.tenant.update({
    where: {
      id: tenantId,
    },
    data: {
      archived: !torneo.archived,
    },
  });

  // Refrescar las dos vistas
  revalidatePath("/admin");
}