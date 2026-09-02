// app/api/public/admin/equipo/[teamId]/logo/route.ts
//
// Sube/actualiza el logo de un equipo. Mismo patrón que tu endpoint
// existente de foto de jugador (formData -> Cloudinary -> guardar URL),
// adaptado a auth móvil y a nivel de equipo.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = verifyMobileAuth(req);
    const { teamId } = await params;

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

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `torneos/${team.tenantId}/equipos`,
      public_id: teamId,
      overwrite: true,
    });

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { logo: result.secure_url },
    });

    return NextResponse.json({
      team: { id: updated.id, name: updated.name, logo: updated.logo },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error subiendo logo de equipo:", error);
    return NextResponse.json(
      { error: "Error al subir el logo" },
      { status: 500 }
    );
  }
}