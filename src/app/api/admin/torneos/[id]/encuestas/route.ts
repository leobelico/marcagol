import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// ⚠️ Agrega aquí la misma validación de sesión/admin que usas en tus otras rutas /api/admin

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encuestas = await prisma.encuestaArbitral.findMany({
    where: { match: { round: { tenantId: id } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ encuestas });
}