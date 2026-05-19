// app/api/admin/torneos/[torneoId]/equipos/[teamId]/jugadores/[playerId]/foto/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta la ruta a tu instancia de Prisma
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest, context: any) {
  const params = await context.params;

  const formData = await req.formData();
  const file = formData.get("foto") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `torneos/${params.id}/jugadores`,
    public_id: params.playerId,
    overwrite: true,
  });

  const jugador = await prisma.player.update({
    where: {
      id: params.playerId,
    },
    data: {
      photo: result.secure_url,
    },
  });

  return NextResponse.json({ photo: jugador.photo });
}