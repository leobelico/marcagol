// app/api/public/admin/equipo/[teamId]/route.ts
//
// Edita datos del equipo: nombre, y opcionalmente reasigna el
// capitán (a uno existente vía capitanUserId, o actualiza datos de
// contacto vía captain/phone). El logo tiene su propio endpoint en
// /logo porque usa formData, no JSON.
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

    const capitanUserId: string | null =
      typeof body?.capitanUserId === "string" && body.capitanUserId
        ? body.capitanUserId
        : null;

    // Sin reasignación de capitán: solo actualiza el nombre (y
    // opcionalmente captain/phone como texto libre, igual que la web).
    if (!capitanUserId) {
      const data: { name: string; captain?: string; phone?: string } = {
        name,
      };
      if (body?.captain !== undefined) data.captain = String(body.captain).trim();
      if (body?.phone !== undefined) data.phone = String(body.phone).trim();

      const updated = await prisma.team.update({
        where: { id: teamId },
        data,
      });

      return NextResponse.json({
        team: {
          id: updated.id,
          name: updated.name,
          logo: updated.logo,
          captain: updated.captain,
          phone: updated.phone,
        },
      });
    }

    // Reasignar a un capitán existente
    const usuarioExistente = await prisma.user.findUnique({
      where: { id: capitanUserId },
    });
    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "El capitán seleccionado no existe" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: {
          name,
          captain: usuarioExistente.name,
          phone: usuarioExistente.phone,
        },
      });

      let tenantUser = await tx.tenantUser.findUnique({
        where: {
          userId_tenantId: {
            userId: usuarioExistente.id,
            tenantId: team.tenantId,
          },
        },
      });
      if (!tenantUser) {
        tenantUser = await tx.tenantUser.create({
          data: {
            userId: usuarioExistente.id,
            tenantId: team.tenantId,
            role: "CAPTAIN",
          },
        });
      }

      // Evita duplicar el vínculo si ya era capitán de este equipo
      await tx.teamCaptain.upsert({
        where: {
          tenantUserId_teamId: { tenantUserId: tenantUser.id, teamId },
        },
        update: {},
        create: { tenantUserId: tenantUser.id, teamId },
      });

      return updatedTeam;
    });

    return NextResponse.json({
      team: {
        id: updated.id,
        name: updated.name,
        logo: updated.logo,
        captain: updated.captain,
        phone: updated.phone,
      },
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