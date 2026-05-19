import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest, context: any) {
  try {
    const { params } = context;
    const { id, teamId } = await params;

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No logo" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `torneos/${id}/equipos`,
      public_id: teamId,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "center" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const team = await prisma.team.update({
      where: { id: teamId },
      data: { logo: result.secure_url },
    });

    return NextResponse.json({ logo: team.logo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error subiendo logo" }, { status: 500 });
  }
}