// app/api/admin/torneos/[torneoId]/equipos/[teamId]/jugadores/[playerId]/foto/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
      teamId: string;
      playerId: string;
    }>;
  }
) {
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

  const params = await context.params;

 const {
  id,
  teamId,
  playerId,
} = params;

  const role = (session.user as any).role;
    const sessionTeamIds = (session.user as any).teamIds as
    | string[]
    | undefined;
  const sessionTeamId = (session.user as any).teamId;
  const sessionTenantId = (session.user as any).tenantId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // ─────────────────────────────────────
  // CAPITÁN: SOLO SU EQUIPO
  // ─────────────────────────────────────
  if (role === "CAPTAIN") {
    // Puede agregar jugadores a CUALQUIERA de sus equipos
    if (!sessionTeamIds || !sessionTeamIds.includes(teamId)) {
      return NextResponse.json(
        { error: "No tienes permiso para este equipo" },
        { status: 403 }
      );
    }
  }

  // ─────────────────────────────────────
  // CAPITÁN: SOLO SU TORNEO
  // ─────────────────────────────────────
  if (
    role === "CAPTAIN" &&
    sessionTenantId !== id
  ) {
    return NextResponse.json(
      { error: "No tienes permiso para este torneo" },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────
  // PERMISOS
  // ─────────────────────────────────────
  if (
    !isSuperAdmin &&
    role !== "ADMIN" &&
    role !== "CAPTAIN"
  ) {
    return NextResponse.json(
      { error: "No tienes permisos" },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────
  // COMPROBAR JUGADOR
  // ─────────────────────────────────────
  const jugador = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
    include: {
      team: true,
    },
  });

  if (!jugador) {
    return NextResponse.json(
      { error: "Jugador no encontrado" },
      { status: 404 }
    );
  }

  // El jugador tiene que pertenecer al equipo
  if (jugador.teamId !== teamId) {
    return NextResponse.json(
      {
        error: "El jugador no pertenece a este equipo",
      },
      { status: 403 }
    );
  }

  // El equipo tiene que pertenecer al torneo
  if (jugador.team.tenantId !== id) {
    return NextResponse.json(
      {
        error: "El equipo no pertenece a este torneo",
      },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────
  // ARCHIVO
  // ─────────────────────────────────────
  const formData = await req.formData();

  const file = formData.get("foto") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No se recibió ninguna foto" },
      { status: 400 }
    );
  }

  // Opcional pero recomendable:
  // limitar a imágenes
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "El archivo debe ser una imagen" },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────
  // CLOUDINARY
  // ─────────────────────────────────────
  const buffer = await file.arrayBuffer();

  const base64 = Buffer.from(buffer).toString("base64");

  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(
    dataUri,
    {
      folder: `torneos/${id}/equipos/${teamId}/jugadores`,
      public_id: playerId,
      overwrite: true,
    }
  );

  // ─────────────────────────────────────
  // GUARDAR URL EN PRISMA
  // ─────────────────────────────────────
  const jugadorActualizado =
    await prisma.player.update({
      where: {
        id: playerId,
      },
      data: {
        photo: result.secure_url,
      },
    });

  return NextResponse.json({
    photo: jugadorActualizado.photo,
  });
}