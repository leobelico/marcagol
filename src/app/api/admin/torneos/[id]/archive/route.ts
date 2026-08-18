import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const torneo = await prisma.tenant.update({
      where: {
        id,
      },
      data: {
        archived: true,
      },
    });

    return NextResponse.json({
      success: true,
      torneo,
    });
  } catch (error) {
    console.error("Error archivando torneo:", error);

    return NextResponse.json(
      {
        success: false,
        error: "No se pudo archivar el torneo",
      },
      { status: 500 }
    );
  }
}