// app/api/admin/torneos/[id]/equipos/[teamId]/jugadores/[playerId]/documento/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tipos de documento soportados y a qué campo/carpeta corresponden
const TIPOS_DOCUMENTO = {
  ine: {
    campo: "ineUrl" as const,
    carpeta: "ine",
  },
  documentoOficial: {
    campo: "documentoOficialUrl" as const,
    carpeta: "documento-oficial",
  },
};

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

  const { id, teamId, playerId } = await context.params;

  const memberships = ((session.user as any).memberships || []) as {
    tenantId: string;
    role: string;
    teamIds: string[];
  }[];
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  const membership = memberships.find((m) => m.tenantId === id);

  // ─────────────────────────────────────
  // CAPITÁN: SOLO SU EQUIPO, DENTRO DE SU TORNEO
  // ─────────────────────────────────────
  if (membership?.role === "CAPTAIN") {
    if (!membership.teamIds.includes(teamId)) {
      return NextResponse.json(
        { error: "No tienes permiso para este equipo" },
        { status: 403 }
      );
    }
  }

  // ─────────────────────────────────────
  // PERMISOS
  // ─────────────────────────────────────
  if (
    !isSuperAdmin &&
    membership?.role !== "ADMIN" &&
    membership?.role !== "CAPTAIN"
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

  if (jugador.teamId !== teamId) {
    return NextResponse.json(
      {
        error: "El jugador no pertenece a este equipo",
      },
      { status: 403 }
    );
  }

  if (jugador.team.tenantId !== id) {
    return NextResponse.json(
      {
        error: "El equipo no pertenece a este torneo",
      },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────
  // ARCHIVO + TIPO DE DOCUMENTO
  // ─────────────────────────────────────
  const formData = await req.formData();

  const file = formData.get("documento") as File | null;
  const tipo = formData.get("tipo") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "No se recibió ningún archivo" },
      { status: 400 }
    );
  }

  if (!tipo || !(tipo in TIPOS_DOCUMENTO)) {
    return NextResponse.json(
      {
        error:
          "Tipo de documento inválido. Debe ser 'ine' o 'documentoOficial'",
      },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "El archivo debe ser una imagen" },
      { status: 400 }
    );
  }

  const { campo, carpeta } =
    TIPOS_DOCUMENTO[tipo as keyof typeof TIPOS_DOCUMENTO];

  // ─────────────────────────────────────
  // CLOUDINARY
  // ─────────────────────────────────────
  const buffer = await file.arrayBuffer();

  const base64 = Buffer.from(buffer).toString("base64");

  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `torneos/${id}/equipos/${teamId}/jugadores/${carpeta}`,
    public_id: playerId,
    overwrite: true,
  });

  // ─────────────────────────────────────
  // GUARDAR URL EN PRISMA (en el campo correspondiente)
  // ─────────────────────────────────────
const jugadorActualizado = await prisma.player.update({
  where: {
    id: playerId,
  },
  data: {
    [campo]: result.secure_url,
  },
});

return NextResponse.json({
  tipo,
  url: result.secure_url,
});
}