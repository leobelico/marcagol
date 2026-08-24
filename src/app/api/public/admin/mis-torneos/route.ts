// app/api/public/admin/mis-torneos/route.ts
//
// Devuelve los torneos a los que el admin logueado tiene acceso,
// para que la app sepa qué partidos puede mostrarle para capturar.
// SUPER_ADMIN ve todos los torneos; un ADMIN normal solo el suyo
// (según tenantId en su token, igual que en la web).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const auth = verifyMobileAuth(request);

    const tenants = auth.isSuperAdmin
      ? await prisma.tenant.findMany({
          where: { archived: false },
          select: { id: true, name: true, slug: true, logo: true },
          orderBy: { name: "asc" },
        })
      : auth.tenantId
      ? await prisma.tenant.findMany({
          where: { id: auth.tenantId, archived: false },
          select: { id: true, name: true, slug: true, logo: true },
        })
      : [];

    return NextResponse.json({ tenants });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching mis-torneos:", error);
    return NextResponse.json(
      { error: "Error al obtener torneos" },
      { status: 500 }
    );
  }
}