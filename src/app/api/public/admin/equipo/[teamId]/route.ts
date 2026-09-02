// app/api/public/admin/equipo/[teamId]/route.ts
//
// Edita datos del equipo (por ahora solo el nombre; el logo tiene
// su propio endpoint en /logo porque usa formData, no JSON).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { teamId } = await params;
    const body = await request.json();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, tenantId: true },
    });
    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== team.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este equipo" },
        { status: 403 }
      );
    }

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 }
      );
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    return NextResponse.json({
      team: { id: updated.id, name: updated.name, logo: updated.logo },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error editando equipo:", error);
    return NextResponse.json(
      { error: "Error al editar equipo" },
      { status: 500 }
    );
  }
}