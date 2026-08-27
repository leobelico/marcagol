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
    }>;
  }
) {
  try {
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

    const { id, teamId } = await context.params;

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
    // COMPROBAR EQUIPO
    // ─────────────────────────────────────
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // El equipo debe pertenecer al torneo
    if (team.tenantId !== id) {
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

    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún logo" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────
    // CLOUDINARY
    // ─────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();

    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(
      dataUri,
      {
        folder: `torneos/${id}/equipos`,
        public_id: teamId,
        overwrite: true,

        transformation: [
          {
            width: 300,
            height: 300,
            crop: "fill",
            gravity: "center",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      }
    );

    // ─────────────────────────────────────
    // GUARDAR LOGO
    // ─────────────────────────────────────
    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },

      data: {
        logo: result.secure_url,
      },
    });

    return NextResponse.json({
      logo: updatedTeam.logo,
    });
  } catch (error) {
    console.error("Error subiendo logo:", error);

    return NextResponse.json(
      { error: "Error subiendo logo" },
      { status: 500 }
    );
  }
}